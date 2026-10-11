import { useState } from 'react';

/**
 * "Leave me a message" form. The site is static (GitHub Pages), so messages go through
 * Web3Forms (https://web3forms.com), which emails them on. The access key only identifies the
 * destination inbox, so it is safe to publish.
 */
export const WEB3FORMS_KEY = 'cd616a61-db5d-481c-8ef9-594a2557bd91';

const COPY = {
  en: {
    name: 'Your name',
    email: 'Your email',
    message: 'Message',
    placeholder: 'A question about a paper, a collaboration idea, a xianxia recommendation…',
    send: 'Send message',
    sending: 'Sending…',
    sent: 'Thanks! Your message is on its way. I usually reply within a few days.',
    error: 'Something went wrong. Please email me instead:',
  },
  zh: {
    name: '你的名字',
    email: '你的邮箱',
    message: '留言',
    placeholder: '论文问题、合作想法，或者推荐一本好看的修仙小说……',
    send: '发送留言',
    sending: '发送中…',
    sent: '收到啦！留言已发送，我一般几天内回复。',
    error: '发送失败了，请直接发邮件给我：',
  },
};

export default function ContactForm({ lang, email }: { lang: 'en' | 'zh'; email: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const text = COPY[lang];
  if (!WEB3FORMS_KEY) return null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('botcheck')) return; // honeypot: only bots fill the hidden field
    setStatus('sending');
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `shuaiwang.io message from ${form.get('name')}`,
          from_name: 'shuaiwang.io',
          name: form.get('name'),
          email: form.get('email'),
          message: form.get('message'),
          page: location.pathname,
        }),
      });
      const result = await response.json();
      setStatus(result.success ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') return <p className="mt-6 rounded-[14px] border border-line p-5 text-[15px]" role="status">{text.sent}</p>;

  const field = 'mt-1.5 w-full rounded-[12px] border border-line bg-[var(--bg)] px-4 py-2.5 text-base outline-none sm:text-[15px] focus:ring-2 focus:ring-[var(--teal)]';
  return (
    <form id="contact" onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-[var(--muted)]">
        {text.name}
        <input name="name" required autoComplete="name" maxLength={100} className={field} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        {text.email}
        <input name="email" type="email" required autoComplete="email" maxLength={200} className={field} />
      </label>
      <label className="text-sm text-[var(--muted)] sm:col-span-2">
        {text.message}
        <textarea name="message" required rows={5} maxLength={5000} placeholder={text.placeholder} className={`${field} resize-y placeholder:text-[var(--muted)] placeholder:opacity-70`} />
      </label>
      <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" className="btn btn-solid" disabled={status === 'sending'}>{status === 'sending' ? text.sending : text.send}</button>
        {status === 'error' && <p className="text-sm" role="alert">{text.error} <a className="text-link" href={`mailto:${email}`}>{email}</a></p>}
      </div>
    </form>
  );
}
