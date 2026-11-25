import { useEffect, useRef, useState } from 'react';
import { encoderLoaded, loadEncoder, loadIndex, search, type SearchDoc, type SearchMode, type SearchResult } from '../../lib/search/hybrid.ts';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

const STORAGE_KEY = 'semantic-search';
const CHANGE_EVENT = 'semantic-search-change';

/**
 * Whether semantic (Starbucks) ranking is switched on. Off by default so the ~15 MB model is
 * never downloaded unless the visitor asks for it; the choice is remembered and shared by every
 * search box on the page.
 */
export function useSemanticPreference(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => { try { setOn(localStorage.getItem(STORAGE_KEY) === 'on'); } catch { /* private mode */ } };
    read();
    window.addEventListener(CHANGE_EVENT, read);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener(CHANGE_EVENT, read); window.removeEventListener('storage', read); };
  }, []);
  const set = (value: boolean) => {
    try { localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off'); } catch { /* private mode */ }
    setOn(value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  return [on, set];
}

/**
 * Debounced search. BM25 results come at once; when `semantic` is on, the Starbucks model is
 * loaded (once) and results are re-ranked with the hybrid score as soon as it is ready.
 */
export function useHybridSearch(query: string, enabled: boolean, types?: SearchDoc['type'][], lang: 'en' | 'zh' = 'en', semantic = false) {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [mode, setMode] = useState<SearchMode>('lexical');
  const [model, setModel] = useState<ModelStatus>(encoderLoaded() ? 'ready' : 'idle');
  const [error, setError] = useState(false);
  const request = useRef(0);
  const typeKey = types?.join(',');

  useEffect(() => {
    if (!enabled || !semantic || model !== 'idle') return;
    setModel('loading');
    loadEncoder().then((encoder) => setModel(encoder ? 'ready' : 'unavailable'));
  }, [enabled, semantic, model]);

  useEffect(() => {
    const id = ++request.current;
    setError(false);
    if (!enabled || !query.trim()) {
      setResults(null);
      setMode('lexical');
      return;
    }
    // Start the shared download while the visitor types, rather than after the debounce.
    void loadIndex().catch(() => {});
    let denseTimer = 0;
    const timer = window.setTimeout(async () => {
      try {
        // Keyword results always arrive first, including while an inference is running.
        const found = await search(query, { types, lang, semantic: false });
        if (id !== request.current) return;
        setResults(found.results);
        setMode(found.mode);
        if (semantic && encoderLoaded()) {
          denseTimer = window.setTimeout(async () => {
            try {
              const hybrid = await search(query, { types, lang, semantic: true });
              if (id !== request.current) return;
              setResults(hybrid.results);
              setMode(hybrid.mode);
            } catch { /* Keep the keyword results when inference fails. */ }
          }, 160);
        }
      } catch {
        if (id !== request.current) return;
        setResults([]);
        setError(true);
      }
    }, 80);
    return () => {
      ++request.current; // Also invalidate pending work when cleared, closed or unmounted.
      window.clearTimeout(timer);
      window.clearTimeout(denseTimer);
    };
    // `model` and `semantic` are dependencies so results re-rank when either changes.
  }, [query, enabled, model, semantic, typeKey, lang]);

  return { results, mode, model, error };
}
