import { useEffect, useRef, useState } from 'react';

export interface TickerItem {
  date: string;
  title: string;
  url?: string;
}

interface Props {
  items: TickerItem[];
  visible?: number;
  pauseLabel: string;
  playLabel: string;
}

const ROW = 64; // px, keep in sync with the row height below
const PX_PER_SECOND = ROW / 3.6; // one item every 3.6 s
const TOUCH_RESUME_MS = 4000;

/**
 * Vertically scrolling news list. It drifts on its own (a seamless loop over a doubled list) and
 * stops while hovered, focused or touched, so visitors can scroll through it by hand; the pause
 * button stops it for good. The newest item is a hard top: only scrolling down wraps around.
 */
export default function NewsTicker({ items, visible = 4, pauseLabel, playLabel }: Props) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const holding = useRef(false); // hover, focus or a recent touch
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const scrollable = items.length > visible;
  const loop = scrollable && !reduced; // reduced motion: same box, scrolled by hand only
  const rows = loop ? [...items, ...items] : items;
  const half = items.length * ROW;

  useEffect(() => {
    const box = boxRef.current;
    if (!box || !loop) return;
    // The list is doubled, so shifting back by one copy (`half`) is invisible. Keeping scrollTop in
    // [0, half) means scrolling up always ends at the real top (the newest item).
    const wrap = () => {
      if (box.scrollTop >= half) box.scrollTop -= half;
    };
    let frame = 0;
    let last = performance.now();
    let position = box.scrollTop;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (holding.current || pausedRef.current) {
        position = box.scrollTop; // follow the visitor's own scrolling
      } else {
        // Track the position as a float: scrollTop may round to whole pixels and stall a slow drift.
        position += PX_PER_SECOND * dt;
        if (position >= half) position -= half;
        box.scrollTop = position;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    box.addEventListener('scroll', wrap, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener('scroll', wrap);
    };
  }, [loop, half]);

  // Touch: hold while the finger is down and for a few seconds after, so a swipe can be read.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !loop) return;
    let timer = 0;
    const start = () => { holding.current = true; window.clearTimeout(timer); };
    const end = () => { timer = window.setTimeout(() => { holding.current = false; }, TOUCH_RESUME_MS); };
    box.addEventListener('touchstart', start, { passive: true });
    box.addEventListener('touchend', end, { passive: true });
    return () => {
      box.removeEventListener('touchstart', start);
      box.removeEventListener('touchend', end);
      window.clearTimeout(timer);
    };
  }, [loop]);

  return (
    <div className="glass relative overflow-hidden">
      <div
        ref={boxRef}
        className="relative overflow-y-auto overscroll-contain px-5 pr-12 [scrollbar-width:none] sm:px-7 sm:pr-14 [&::-webkit-scrollbar]:hidden"
        style={{ height: scrollable ? ROW * visible : undefined, maskImage: scrollable ? 'linear-gradient(transparent, #000 22%, #000 78%, transparent)' : undefined }}
        onMouseEnter={() => { holding.current = true; }}
        onMouseLeave={() => { holding.current = false; }}
        onFocus={() => { holding.current = true; }}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) holding.current = false; }}
      >
        <ul>
          {rows.map((item, i) => (
            <li
              key={i}
              aria-hidden={loop && i >= items.length ? true : undefined}
              className="grid grid-cols-[96px_1fr] items-center gap-4 border-b border-line sm:grid-cols-[120px_1fr]"
              style={{ height: ROW }}
            >
              <time className="mono text-[12.5px] text-muted">{item.date}</time>
              {item.url ? (
                <a href={item.url} tabIndex={loop && i >= items.length ? -1 : undefined} className="serif line-clamp-1 text-[16px] leading-snug hover:text-[var(--teal)] sm:line-clamp-2 sm:text-[19px]">{item.title}</a>
              ) : (
                <span className="serif line-clamp-1 text-[16px] leading-snug sm:line-clamp-2 sm:text-[19px]">{item.title}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {loop && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? playLabel : pauseLabel}
          className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-line bg-[var(--bg)] text-[11px] text-muted hover:text-[var(--ink)]"
        >
          {paused ? '▶' : '❚❚'}
        </button>
      )}
    </div>
  );
}
