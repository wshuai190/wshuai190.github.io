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
    window.setTimeout(() => reject(new Error('turnstile timeout')), 20_000);
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
    signal: AbortSignal.timeout(20_000),
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
    placeholder: 'Ask me anything…',
    send: 'Send',
    close: 'Close',
    newChat: 'New chat',
    retry: 'Retry',
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
    placeholder: '随便问我……',
    send: '发送',
    close: '关闭',
    newChat: '新对话',
    retry: '重试',
    unavailable: 'Service not available.',
    handoff: '把这段对话发给真正的王率',
    handoffEmail: '你的邮箱（方便我回复）',
    handoffSend: '发送',
    handoffDone: '已发送！真正的王率会看到。',
    starters: ['你主要研究什么？', '我应该先读你哪篇论文？', '你现在修为到哪一层了？', '一分钟讲讲 Starbucks', '你下班以后都做什么？'],
  },
};

/**
 * Minimal, safe Markdown: escape everything, then allow links to site paths or http(s) URLs,
 * **bold**, *italic*, `code` and "- " lists. Images become plain links; protocol-relative
 * ("//host", "/\\host") hrefs are never links.
 */
function renderMarkdown(text: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (s: string) => escape(s)
    .replace(/!\[/g, '[')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/(?![\/\\]))[^\s)`]+)\)/g, (_, label, href) => {
      // Paper pages live at /publication/<slug> (no trailing slash); models often add one.
      const url = href.replace(/^(\/publication\/[^/?#]+)\/$/, '$1');
      return `<a href="${url}"${url.startsWith('/') ? '' : ' target="_blank" rel="noopener"'} class="text-link">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>')
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
  const [announcement, setAnnouncement] = useState('');
  const [handoff, setHandoff] = useState<'closed' | 'open' | 'sending' | 'sent'>('closed');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const text = COPY[lang];

  useEffect(() => {
    if (!TWIN_ENDPOINT) return;
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-open-twin]');
      if (!trigger) return;
      event.preventDefault();
      returnFocus.current = trigger;
      setOpen(true);
      const question = trigger.dataset.twinQuestion;
      if (question) window.setTimeout(() => askRef.current(question), 0);
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
    // Escape closes; Tab cycles within the dialog (focus trap).
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, input, a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!dialogRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, close]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, error]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = '';
    await run([...messages, { role: 'user', content: q }]);
  }

  /** Send the conversation (ending with the visitor's question) and stream the reply in. */
  async function run(history: Message[]) {
    setMessages([...history, { role: 'assistant', content: '' }]);
    setBusy(true);
    setError(false);
    setAnnouncement('');
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
      setAnnouncement(reply);
    } catch {
      setMessages(history);
      setError(true);
    } finally {
      setBusy(false);
      // Refocus only with a keyboard/mouse; on phones it would pop the keyboard over the reply.
      if (matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
    }
  }

  function newChat() {
    setMessages([]);
    setError(false);
    setHandoff('closed');
    setAnnouncement('');
    inputRef.current?.focus();
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
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={text.title} className="glass flex h-[min(680px,92dvh)] w-full max-w-xl flex-col overflow-hidden !rounded-b-none !bg-[var(--bg-raised)] pb-[env(safe-area-inset-bottom)] shadow-2xl sm:!rounded-[22px] sm:pb-0">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="serif text-xl"><span aria-hidden="true">🧘 </span>{text.title}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-[var(--muted)]">{text.notice}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {messages.length > 0 && !busy && (
              <button type="button" onClick={newChat} aria-label={text.newChat} title={text.newChat} className="grid h-8 w-8 place-items-center rounded-full border border-line text-[var(--muted)] hover:text-[var(--ink)]">↺</button>
            )}
            <button type="button" onClick={close} aria-label={text.close} className="grid h-8 w-8 place-items-center rounded-full border border-line text-[var(--muted)] hover:text-[var(--ink)]">✕</button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{announcement}</p>
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
          {error && (
            <p className="flex items-center gap-3 text-[14px] text-[var(--muted)]" role="alert">
              {text.unavailable}
              {messages[messages.length - 1]?.role === 'user' && <button type="button" className="link-pill" onClick={() => run(messages)}>{text.retry}</button>}
            </p>
          )}
        </div>

        {messages.length > 1 && WEB3FORMS_KEY && handoff !== 'closed' ? (
          <div className="border-t border-line px-5 py-3 text-sm">
            {handoff === 'sent' ? <p role="status">{text.handoffDone}</p> : (
              <form onSubmit={sendHandoff} className="flex gap-2">
                <input name="email" type="email" required placeholder={text.handoffEmail} aria-label={text.handoffEmail} className="h-9 min-w-0 flex-1 rounded-full border border-line bg-[var(--bg)] px-4 text-base outline-none sm:text-sm focus:ring-2 focus:ring-[var(--teal)]" />
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
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = '';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(input); } }}
            rows={1}
            maxLength={1500}
            placeholder={text.placeholder}
            aria-label={text.placeholder}
            className="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-[14px] border border-line bg-[var(--bg)] px-4 py-2.5 text-base outline-none placeholder:truncate sm:text-[15px] focus:ring-2 focus:ring-[var(--teal)]"
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
