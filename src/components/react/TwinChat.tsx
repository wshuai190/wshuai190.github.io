import { useCallback, useEffect, useRef, useState } from 'react';
import { WEB3FORMS_KEY } from './ContactForm';

/**
 * "Talk with my digital twin": a chat dialog backed by the Cloudflare Worker in /worker
 * (Gemini, grounded in the site's llms-full.txt). Opened by any element with `data-open-twin`.
 * Hidden until TWIN_ENDPOINT is set.
 */
export const TWIN_ENDPOINT = 'https://shuaiwang-twin.shuaiwang-io.workers.dev';
/** Cloudflare Turnstile (invisible) site key: the worker only answers browsers that pass it. */
const TURNSTILE_SITEKEY = '0x4AAAAAAFTlAg-4M1DHF17K';

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, options: Record<string, unknown>): string;
      execute(id: string): void;
      reset(id: string): void;
    };
  }
}

let turnstileScript: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  turnstileScript ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { turnstileScript = null; reject(new Error('turnstile')); };
    document.head.append(script);
  });
  return turnstileScript;
}

/** Run the invisible Turnstile check and swap its token for a short-lived worker session. */
let session: { token: string; expires: number } | null = null;
let pending: Promise<string> | null = null;
function getSession(host: HTMLElement): Promise<string> {
  if (session && session.expires > Date.now()) return Promise.resolve(session.token);
  // One check at a time: the warm-up on open and the first message share it.
  pending ??= newSession(host).finally(() => { pending = null; });
  return pending;
}

async function newSession(host: HTMLElement): Promise<string> {
  await loadTurnstile();
  const token = await new Promise<string>((resolve, reject) => {
    host.replaceChildren();
    window.turnstile!.render(host, {
      sitekey: TURNSTILE_SITEKEY,
      callback: resolve,
      'error-callback': () => reject(new Error('turnstile')),
      'timeout-callback': () => reject(new Error('turnstile')),
    });
  });
  const response = await fetch(`${TWIN_ENDPOINT}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error(String(response.status));
  const { session: value, ttl } = (await response.json()) as { session: string; ttl: number };
  session = { token: value, expires: Date.now() + (ttl - 60) * 1000 };
  return value;
}

interface Message { role: 'user' | 'assistant'; content: string }

const STORAGE_KEY = 'twin-chat';
const ASK_EVENT = 'twin:ask';

/** Open the twin and send it a question (used by the home search and the ⌘K palette). */
export function askTwin(question: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: question }));
}

const COPY = {
  en: {
    title: "Dylan's digital twin",
    notice: 'An AI twin that answers from this website. It is not me and can be wrong; it cannot make commitments for me.',
    placeholder: 'Ask about my research, papers, teaching…',
    send: 'Send',
    close: 'Close',
    unavailable: 'Service not available.',
    handoff: 'Send this chat to the real Dylan',
    handoffEmail: 'Your email (so I can reply)',
    handoffSend: 'Send',
    handoffDone: 'Sent! The real Dylan will read it.',
    starters: ['What do you work on?', 'Which paper should I read first?', 'What is your cultivation realm?', 'Starbucks embeddings in one minute?', 'What do you do outside research?'],
  },
  zh: {
    title: '王率的数字分身',
    notice: '这是根据本网站内容回答问题的 AI 分身，不是我本人，可能会出错，也不能替我做任何承诺。',
    placeholder: '问问我的研究、论文、教学……',
    send: '发送',
    close: '关闭',
    unavailable: 'Service not available.',
    handoff: '把这段对话发给真正的王率',
    handoffEmail: '你的邮箱（方便我回复）',
    handoffSend: '发送',
    handoffDone: '已发送！真正的王率会看到。',
    starters: ['你主要研究什么？', '我应该先读你哪篇论文？', '你现在修为到哪一层了？', '一分钟讲讲 Starbucks', '你下班以后都做什么？'],
  },
};

/** Minimal, safe Markdown: escape everything, then allow links (site paths or http/s), **bold**, `code` and "- " lists. */
function renderMarkdown(text: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (s: string) => escape(s)
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, label, href) =>
      `<a href="${href}"${href.startsWith('/') ? '' : ' target="_blank" rel="noopener"'} class="text-link">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="mono text-[0.9em]">$1</code>');
  const html: string[] = [];
  let list = false;
  for (const line of text.split('\n')) {
    const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (item) {
      if (!list) { html.push('<ul class="ml-4 list-disc space-y-1">'); list = true; }
      html.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    if (list) { html.push('</ul>'); list = false; }
    if (line.trim()) html.push(`<p>${inline(line)}</p>`);
  }
  if (list) html.push('</ul>');
  return html.join('');
}

export default function TwinChat({ lang }: { lang: 'en' | 'zh' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const restored = useRef(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [handoff, setHandoff] = useState<'closed' | 'open' | 'sending' | 'sent'>('closed');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const text = COPY[lang];

  useEffect(() => {
    if (!TWIN_ENDPOINT) return;
    document.querySelectorAll<HTMLElement>('[data-open-twin]').forEach((el) => { el.hidden = false; });
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-open-twin]');
      if (!trigger) return;
      event.preventDefault();
      returnFocus.current = trigger;
      setOpen(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Keep the conversation for this browser session, so following a link in an answer doesn't lose it.
  useEffect(() => {
    try { setMessages(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')); } catch { /* ignore */ }
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current || busy) return;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch { /* ignore */ }
  }, [messages, busy]);

  // Questions from the home search / palette.
  const askRef = useRef<(q: string) => void>(() => {});
  useEffect(() => {
    if (!TWIN_ENDPOINT) return;
    const onAsk = (event: Event) => {
      returnFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
      const question = (event as CustomEvent<string>).detail;
      if (question) window.setTimeout(() => askRef.current(question), 0);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => returnFocus.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    // Start the invisible human check now, so the first answer isn't waiting for it.
    if (turnstileRef.current) getSession(turnstileRef.current).catch(() => { /* retried on send */ });
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, close]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, error]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const history: Message[] = [...messages, { role: 'user', content: q }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    setError(false);
    try {
      const send = async () => fetch(`${TWIN_ENDPOINT}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getSession(turnstileRef.current!)}` },
        body: JSON.stringify({ messages: history }),
      });
      let response = await send();
      if (response.status === 401) { session = null; response = await send(); } // session expired: re-check once
      if (!response.ok || !response.body) throw new Error(String(response.status));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: 'assistant', content: reply }]);
      }
      if (!reply.trim()) throw new Error('empty');
    } catch {
      setMessages(history);
      setError(true);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  askRef.current = ask;

  async function sendHandoff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');
    setHandoff('sending');
    try {
      const transcript = messages.map((m) => `${m.role === 'user' ? 'Visitor' : 'Twin'}: ${m.content}`).join('\n\n');
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: 'Digital twin chat from shuaiwang.io', from_name: 'shuaiwang.io twin', email, message: transcript }),
      });
      setHandoff((await response.json()).success ? 'sent' : 'open');
    } catch {
      setHandoff('open');
    }
  }

  if (!TWIN_ENDPOINT || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:px-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={text.title} className="glass flex h-[min(680px,92vh)] w-full max-w-xl flex-col overflow-hidden !rounded-b-none !bg-[var(--bg-raised)] shadow-2xl sm:!rounded-[22px]">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="serif text-xl"><span aria-hidden="true">🧘 </span>{text.title}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-[var(--muted)]">{text.notice}</p>
          </div>
          <button type="button" onClick={close} aria-label={text.close} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-[var(--muted)] hover:text-[var(--ink)]">✕</button>
        </div>

        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {text.starters.map((s) => <button key={s} type="button" className="chip" onClick={() => ask(s)}>{s}</button>)}
            </div>
          )}
          {messages.map((m, i) => (
            m.role === 'user'
              ? <p key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-[16px] rounded-br-[4px] bg-[var(--ink)] px-4 py-2.5 text-[15px] text-[var(--bg)]">{m.content}</p>
              : <div key={i} className="max-w-[92%] space-y-2 text-[15px] leading-relaxed [&_a]:break-words">
                  {m.content ? <div className="space-y-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} /> : <span className="inline-flex gap-1 py-2" aria-label="…">{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)]" style={{ animationDelay: `${d * 0.15}s` }} />)}</span>}
                </div>
          ))}
          {error && <p className="text-[14px] text-[var(--muted)]" role="alert">{text.unavailable}</p>}
        </div>

        {messages.length > 1 && WEB3FORMS_KEY && handoff !== 'closed' ? (
          <div className="border-t border-line px-5 py-3 text-sm">
            {handoff === 'sent' ? <p role="status">{text.handoffDone}</p> : (
              <form onSubmit={sendHandoff} className="flex gap-2">
                <input name="email" type="email" required placeholder={text.handoffEmail} className="h-9 min-w-0 flex-1 rounded-full border border-line bg-[var(--bg)] px-4 outline-none focus:ring-2 focus:ring-[var(--teal)]" />
                <button type="submit" className="btn btn-solid !py-1.5" disabled={handoff === 'sending'}>{text.handoffSend}</button>
              </form>
            )}
          </div>
        ) : null}

        <div ref={turnstileRef} className="sr-only" aria-hidden="true" />
        <form className="flex items-end gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(input); } }}
            rows={1}
            maxLength={1500}
            placeholder={text.placeholder}
            aria-label={text.placeholder}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-[14px] border border-line bg-[var(--bg)] px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[var(--teal)]"
          />
          <button type="submit" className="btn btn-solid" disabled={busy || !input.trim()}>{text.send}</button>
        </form>
        {messages.length > 1 && WEB3FORMS_KEY && handoff === 'closed' && (
          <button type="button" className="mx-auto -mt-1 mb-2 text-[12.5px] text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]" onClick={() => setHandoff('open')}>{text.handoff}</button>
        )}
      </div>
    </div>
  );
}
