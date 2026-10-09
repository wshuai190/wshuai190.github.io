import { useEffect, useState } from 'react';

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
const SECONDS_PER_ITEM = 3.6;

/** Vertically scrolling news list: seamless loop, pauses on hover/focus or via the button. */
export default function NewsTicker({ items, visible = 4, pauseLabel, playLabel }: Props) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const animate = !reduced && items.length > visible;
  const rows = animate ? [...items, ...items] : items.slice(0, Math.max(visible, 6));

  return (
    <div className="glass relative overflow-hidden">
      <div
        className="group relative overflow-hidden px-7"
        style={{ height: animate ? ROW * visible : undefined, maskImage: animate ? 'linear-gradient(transparent, #000 14%, #000 86%, transparent)' : undefined }}
      >
        <ul
          className="group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          style={animate ? { animation: `ticker ${items.length * SECONDS_PER_ITEM}s linear infinite`, animationPlayState: paused ? 'paused' : undefined } : undefined}
        >
          {rows.map((item, i) => (
            <li
              key={i}
              aria-hidden={animate && i >= items.length ? true : undefined}
              className="grid grid-cols-[96px_1fr] items-center gap-4 border-b border-line sm:grid-cols-[120px_1fr]"
              style={{ height: ROW }}
            >
              <time className="mono text-[12.5px] text-muted">{item.date}</time>
              {item.url ? (
                <a href={item.url} tabIndex={animate && i >= items.length ? -1 : undefined} className="serif line-clamp-2 text-[17px] leading-snug hover:text-[var(--teal)] sm:text-[19px]">{item.title}</a>
              ) : (
                <span className="serif line-clamp-2 text-[17px] leading-snug sm:text-[19px]">{item.title}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {animate && (
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
