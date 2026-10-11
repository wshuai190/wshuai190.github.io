import { DurableObject } from 'cloudflare:workers';
import { systemPrompt } from './prompt';

interface RateLimiter { limit(options: { key: string }): Promise<{ success: boolean }> }

interface Env {
  GEMINI_API_KEY: string;
  TURNSTILE_SECRET: string;
  SESSION_SECRET: string;
  GEMINI_MODELS: string; // comma-separated, tried in order (overloaded/removed models fall through)
  GEMINI_THINKING: string; // thinking level for models that support it ("low" = faster replies)
  SITE: string;
  ALLOWED_ORIGINS: string;
  ENABLED: string; // "false" switches the twin off (kill switch)
  DAILY_LIMIT: string; // messages per day, whole site
  IP_DAILY_LIMIT: string; // messages per day, per visitor IP
  IP_LIMITER?: RateLimiter;
  GLOBAL_LIMITER?: RateLimiter;
  USAGE?: DurableObjectNamespace<UsageCounter>; // always bound in production; absent in wrangler.test.toml
}

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const MAX_BODY_BYTES = 32_000;
const MAX_MESSAGES = 12; // conversation turns sent to the model
const MAX_CHARS = 1500; // per visitor message
const MAX_ASSISTANT_CHARS = 4000; // per (client-supplied) earlier reply
const PROFILE_TTL = 600; // seconds to cache llms-full.txt (site updates reach the twin within 10 min)
const SESSION_TTL = 30 * 60; // seconds a Turnstile-verified session lasts
const MODEL_TIMEOUT_MS = 25_000; // give up on a model that hasn't started answering

/**
 * Digital twin backend.
 *   POST /session {token}      Turnstile token → short-lived signed session (proves a real browser)
 *   POST /chat {messages}      with "Authorization: Bearer <session>" → text/plain stream of the reply
 * Any failure (quota, limits, bad input) is a non-200 status; the site then shows "Service not available".
 *
 * Abuse protection: allowed origins only, Turnstile human check, per-IP and global per-minute
 * limits, per-IP and global daily caps (KV), request/message size caps, Gemini safety filters, and
 * the ENABLED kill switch. The Gemini key has no billing attached, so the worst case is a paused twin.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const cors: Record<string, string> = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
    const fail = (status: number, message = 'Service not available') => new Response(message, { status, headers: cors });

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const { pathname } = new URL(request.url);
    if (request.method !== 'POST' || (pathname !== '/chat' && pathname !== '/session')) return fail(404, 'Not found');
    if (env.ENABLED === 'false') return fail(503);
    if (!allowed.includes(origin)) return fail(403, 'Forbidden');
    if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return fail(413, 'Too large');

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (env.IP_LIMITER && !(await env.IP_LIMITER.limit({ key: ip })).success) return fail(429, 'Too many messages');

    let body: Record<string, unknown>;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) return fail(413, 'Too large');
      body = JSON.parse(raw);
    } catch {
      return fail(400, 'Bad request');
    }

    if (pathname === '/session') {
      const ok = typeof body.token === 'string' && (await verifyTurnstile(body.token, ip, env.TURNSTILE_SECRET));
      if (!ok) return fail(403, 'Forbidden');
      const session = await sign({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL }, env.SESSION_SECRET);
      return new Response(JSON.stringify({ session, ttl: SESSION_TTL }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // /chat
    const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    if (!(await verifySession(bearer, env.SESSION_SECRET))) return fail(401, 'Session expired');
    if (env.GLOBAL_LIMITER && !(await env.GLOBAL_LIMITER.limit({ key: 'all' })).success) return fail(429, 'Busy');

    const messages = cleanMessages(body.messages);
    if (!messages) return fail(400, 'Bad request');

    // Daily caps, counted exactly in one Durable Object (free plan; no KV write limits).
    const day = new Date().toISOString().slice(0, 10);
    if (env.USAGE) {
      // Bump the name to start fresh counters (e.g. after test traffic hit production).
      const counter = env.USAGE.get(env.USAGE.idFromName('usage-v2'));
      if (!(await counter.hit(day, ip, Number(env.DAILY_LIMIT), Number(env.IP_DAILY_LIMIT)))) return fail(429, 'Daily limit reached');
    }

    try {
      const profile = await loadProfile(env.SITE, ctx);
      const request = {
        systemInstruction: { parts: [{ text: systemPrompt(env.SITE, profile, day) }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        // Thinking tokens count against maxOutputTokens, so leave room for both (replies stay short via the prompt).
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        safetySettings: ['HARASSMENT', 'HATE_SPEECH', 'SEXUALLY_EXPLICIT', 'DANGEROUS_CONTENT'].map((category) => ({
          category: `HARM_CATEGORY_${category}`,
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        })),
      };
      const upstream = await firstAvailableModel(env, request);
      if (!upstream) return fail(503);
      return new Response(upstream.body.pipeThrough(geminiText()), {
        headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
      });
    } catch (error) {
      console.error('chat', String(error));
      return fail(503);
    }
  },
};

/** Daily message counters (whole site and per IP); yesterday's counts are dropped on the first hit of a new day. */
export class UsageCounter extends DurableObject {
  async hit(day: string, ip: string, dailyLimit: number, ipLimit: number): Promise<boolean> {
    const storage = this.ctx.storage;
    if ((await storage.get<string>('day')) !== day) {
      await storage.deleteAll();
      await storage.put('day', day);
    }
    const total = (await storage.get<number>('total')) ?? 0;
    const mine = (await storage.get<number>(`ip:${ip}`)) ?? 0;
    if (total >= dailyLimit || mine >= ipLimit) return false;
    await storage.put({ total: total + 1, [`ip:${ip}`]: mine + 1 });
    return true;
  }

  async stats(): Promise<{ day?: string; total: number; visitors: number }> {
    const all = await this.ctx.storage.list();
    return {
      day: all.get('day') as string | undefined,
      total: (all.get('total') as number) ?? 0,
      visitors: [...all.keys()].filter((k) => k.startsWith('ip:')).length,
    };
  }
}

/**
 * Try each model in GEMINI_MODELS until one starts answering. A model that is overloaded (503),
 * rate-limited (429), retired (404) or slow is skipped; thinking settings are dropped for models
 * that reject them.
 */
async function firstAvailableModel(env: Env, request: Record<string, unknown>): Promise<Response | null> {
  const models = env.GEMINI_MODELS.split(',').map((m) => m.trim()).filter(Boolean);
  for (const model of models) {
    const configs = env.GEMINI_THINKING ? [{ thinkingConfig: { thinkingLevel: env.GEMINI_THINKING } }, {}] : [{}];
    for (const extra of configs) {
      const body = { ...request, generationConfig: { ...(request.generationConfig as object), ...extra } };
      // The timeout only covers waiting for the model to start; a long streamed reply is not cut off.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body: JSON.stringify(body),
            signal: controller.signal,
          },
        );
        clearTimeout(timer);
        if (response.ok && response.body) {
          console.log('gemini ok', model);
          return response;
        }
        const detail = (await response.text()).slice(0, 200);
        console.error('gemini', model, response.status, detail);
        if (response.status === 400 && /thinking/i.test(detail)) continue; // retry this model without thinking settings
      } catch (error) {
        clearTimeout(timer);
        console.error('gemini', model, String(error));
      }
      break; // next model
    }
  }
  return null;
}

/** Validate and trim the conversation: alternating roles, last one from the visitor, size-capped. */
function cleanMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const strip = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  const messages = input
    .filter((m): m is ChatMessage => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string')
    .map((m) => ({ role: m.role, content: strip(m.content).slice(0, m.role === 'user' ? MAX_CHARS : MAX_ASSISTANT_CHARS) }))
    .filter((m) => m.content)
    .slice(-MAX_MESSAGES);
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token.slice(0, 4096));
  form.append('remoteip', ip);
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const result = (await response.json()) as { success: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

// Sessions: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload)).
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(payload: { exp: number }, secret: string): Promise<string> {
  const data = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(data));
  return `${data}.${b64url(new Uint8Array(signature))}`;
}

async function verifySession(token: string, secret: string): Promise<boolean> {
  const [data, signature] = token.split('.');
  if (!data || !signature || token.length > 512) return false;
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(signature), new TextEncoder().encode(data));
    if (!valid) return false;
    const { exp } = JSON.parse(new TextDecoder().decode(fromB64url(data))) as { exp: number };
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * The site's full Markdown profile (llms-full.txt). Kept in isolate memory for 10 minutes (the Cache
 * API is a no-op on *.workers.dev), with the edge cache as a second layer on custom domains.
 */
let memo: { text: string; at: number } | null = null;

async function loadProfile(site: string, ctx: ExecutionContext): Promise<string> {
  if (memo && Date.now() - memo.at < PROFILE_TTL * 1000) return memo.text;
  const cache = caches.default;
  // A per-10-minute query string keeps the edge cache from serving an older copy past the TTL.
  const key = new Request(`${site}/llms-full.txt?v=${Math.floor(Date.now() / (PROFILE_TTL * 1000))}`);
  const hit = await cache.match(key);
  if (hit) {
    memo = { text: await hit.text(), at: Date.now() };
    return memo.text;
  }
  const response = await fetch(key, { cf: { cacheTtl: PROFILE_TTL, cacheEverything: true } });
  if (!response.ok) {
    if (memo) return memo.text; // serve the last good copy if the site is briefly down
    throw new Error(`profile ${response.status}`);
  }
  const text = await response.text();
  memo = { text, at: Date.now() };
  ctx.waitUntil(cache.put(key, new Response(text, { headers: { 'Cache-Control': `max-age=${PROFILE_TTL}` } })));
  return text;
}

/** Gemini SSE ("data: {...}" lines) → the plain reply text, chunk by chunk. */
function geminiText(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  const emit = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith('data:')) return;
    try {
      const data = JSON.parse(line.slice(5));
      const candidate = data.candidates?.[0];
      // Skip thought parts; only the visible answer goes to the visitor.
      const text = (candidate?.content?.parts ?? []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text ?? '').join('');
      if (text) controller.enqueue(encoder.encode(text));
      if (candidate?.finishReason === 'MAX_TOKENS') controller.enqueue(encoder.encode(' …'));
    } catch { /* ignore keep-alives and partial lines */ }
  };
  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) emit(line.trim(), controller);
    },
    flush(controller) {
      emit(buffer.trim(), controller);
    },
  });
}
