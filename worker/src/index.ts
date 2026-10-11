import { systemPrompt } from './prompt';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  SITE: string;
  ALLOWED_ORIGINS: string;
  LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const MAX_MESSAGES = 12; // conversation turns sent to the model
const MAX_CHARS = 1500; // per visitor message
const PROFILE_TTL = 3600; // seconds to cache llms-full.txt

/**
 * POST /chat {messages: [{role, content}]} → text/plain stream of the twin's reply.
 * Any failure (quota, network, bad input) is a non-200 status; the site then shows
 * "Service not available".
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    const cors: Record<string, string> = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    const fail = (status: number, message: string) => new Response(message, { status, headers: cors });

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/chat') return fail(404, 'Not found');
    if (!allowed.includes(origin)) return fail(403, 'Forbidden');

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (env.LIMITER && !(await env.LIMITER.limit({ key: ip })).success) return fail(429, 'Too many messages');

    let messages: ChatMessage[];
    try {
      const body = (await request.json()) as { messages?: ChatMessage[] };
      messages = (body.messages ?? [])
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
        .slice(-MAX_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    } catch {
      return fail(400, 'Bad request');
    }
    if (!messages.length || messages[messages.length - 1].role !== 'user') return fail(400, 'Bad request');

    try {
      const profile = await loadProfile(env.SITE, ctx);
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt(env.SITE, profile, new Date().toISOString().slice(0, 10)) }] },
            contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
            generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
          }),
        },
      );
      if (!upstream.ok || !upstream.body) return fail(503, 'Service not available');
      return new Response(upstream.body.pipeThrough(geminiText()), {
        headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    } catch {
      return fail(503, 'Service not available');
    }
  },
};

/** The site's full Markdown profile (llms-full.txt), cached at the edge for an hour. */
async function loadProfile(site: string, ctx: ExecutionContext): Promise<string> {
  const cache = caches.default;
  const key = new Request(`${site}/llms-full.txt`);
  const hit = await cache.match(key);
  if (hit) return hit.text();
  const response = await fetch(key);
  if (!response.ok) throw new Error(`profile ${response.status}`);
  const text = await response.text();
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
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
      if (text) controller.enqueue(encoder.encode(text));
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
