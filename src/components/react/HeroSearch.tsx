import { useEffect, useRef, useState } from 'react';

interface Props {
  action: string;
  label: string;
  button: string;
  examples: string[];
}

/** Search box with a typewriter placeholder; submits to the publications explorer (?q=). */
export default function HeroSearch({ action, label, button, examples }: Props) {
  const [placeholder, setPlaceholder] = useState(examples[0] ?? '');
  const [value, setValue] = useState('');
  const focused = useRef(false);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let example = 0, chars = 0, deleting = false, timer = 0;
    const tick = () => {
      if (!(focused.current && value)) {
        const text = examples[example];
        chars += deleting ? -1 : 1;
        setPlaceholder(text.slice(0, chars));
        let delay = deleting ? 22 : 48;
        if (!deleting && chars === text.length) { deleting = true; delay = 2200; }
        else if (deleting && chars === 0) { deleting = false; example = (example + 1) % examples.length; delay = 350; }
        timer = window.setTimeout(tick, delay);
      } else {
        timer = window.setTimeout(tick, 400);
      }
    };
    timer = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timer);
  }, [examples, value]);

  return (
    <form
      action={action}
      method="get"
      role="search"
      className="glass flex items-center gap-2 !rounded-full p-1.5 pl-5 transition-shadow focus-within:shadow-[var(--lift)]"
      onSubmit={(event) => {
        if (!value.trim()) {
          event.preventDefault();
          window.location.href = `${action}?q=${encodeURIComponent(placeholder)}`;
        }
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-[var(--muted)]" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <label className="sr-only" htmlFor="hero-q">{label}</label>
      <input
        id="hero-q"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; }}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--muted)]"
      />
      <button type="submit" className="btn btn-solid !py-2">{button}</button>
    </form>
  );
}
