import { useEffect, useRef, useState } from 'react';
import { encoderLoaded, loadEncoder, search, type SearchDoc, type SearchMode, type SearchResult } from '../../lib/search/hybrid.ts';

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
  const request = useRef(0);
  const typeKey = types?.join(',');

  useEffect(() => {
    if (!enabled || !semantic || model !== 'idle') return;
    setModel('loading');
    loadEncoder().then((encoder) => setModel(encoder ? 'ready' : 'unavailable'));
  }, [enabled, semantic, model]);

  useEffect(() => {
    if (!enabled) return;
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const id = ++request.current;
    const timer = window.setTimeout(async () => {
      const found = await search(query, { types, lang, semantic });
      if (id !== request.current) return;
      setResults(found.results);
      setMode(found.mode);
    }, 120);
    return () => window.clearTimeout(timer);
    // `model` and `semantic` are dependencies so results re-rank when either changes.
  }, [query, enabled, model, semantic, typeKey, lang]);

  return { results, mode, model };
}
