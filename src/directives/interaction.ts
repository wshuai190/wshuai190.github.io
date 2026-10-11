import type { ClientDirective } from 'astro';

/**
 * client:interaction="search" | "twin" — hydrate an island only when the visitor first uses it,
 * then replay that first action, so pages don't download React for features nobody opens.
 *   search: ⌘K / Ctrl+K / "/" or a click on [data-open-search]
 *   twin:   a click on [data-open-twin] or a `twin:ask` event (home search, palette)
 * Hovering or focusing a trigger starts the download early.
 */
const interaction: ClientDirective = (load, options) => {
  const kind = options.value === 'twin' ? 'twin' : 'search';
  const selector = kind === 'twin' ? '[data-open-twin]' : '[data-open-search]';
  let loading: ReturnType<typeof load> | null = null;
  let started = false;
  const prefetch = () => (loading ??= load());

  const start = async (replay: () => void) => {
    if (started) return;
    started = true;
    cleanup();
    const hydrate = await prefetch();
    await hydrate();
    // Let the island's effects register their listeners before replaying the first action.
    window.setTimeout(replay, 50);
  };

  const onClick = (event: MouseEvent) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>(selector);
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    start(() => trigger.click());
  };
  const onKey = (event: KeyboardEvent) => {
    const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
    if (!((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing))) return;
    event.preventDefault();
    start(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey })));
  };
  const onAsk = (event: Event) => {
    event.stopImmediatePropagation();
    const detail = (event as CustomEvent<string>).detail;
    start(() => window.dispatchEvent(new CustomEvent('twin:ask', { detail })));
  };
  const onHover = (event: Event) => {
    if ((event.target as Element | null)?.closest?.(selector)) prefetch();
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerover', onHover, { passive: true });
  document.addEventListener('focusin', onHover);
  if (kind === 'search') window.addEventListener('keydown', onKey, true);
  else window.addEventListener('twin:ask', onAsk, true);

  function cleanup() {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('pointerover', onHover);
    document.removeEventListener('focusin', onHover);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('twin:ask', onAsk, true);
  }
};

export default interaction;
