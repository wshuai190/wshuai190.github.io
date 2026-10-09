import { useState } from 'react';

interface Props {
  text: string;
  label: string;
  done: string;
  className?: string;
}

export default function CopyButton({ text, label, done, className = 'link-pill' }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? `✓ ${done}` : `⧉ ${label}`}
    </button>
  );
}
