import { useEffect, useRef, useState } from 'react';
import { encoderLoaded, loadEncoder, search, type SearchDoc, type SearchMode, type SearchResult } from '../../lib/search/hybrid.ts';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * Debounced hybrid search. Shows BM25 results at once and re-ranks with Starbucks dense
 * scores as soon as the model finishes loading (started when `enabled` becomes true).
 */
export function useHybridSearch(query: string, enabled: boolean, types?: SearchDoc['type'][], lang: 'en' | 'zh' = 'en') {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [mode, setMode] = useState<SearchMode>('lexical');
  const [model, setModel] = useState<ModelStatus>(encoderLoaded() ? 'ready' : 'idle');
  const request = useRef(0);
  const typeKey = types?.join(',');

  useEffect(() => {
    if (!enabled || model !== 'idle') return;
    setModel('loading');
    loadEncoder().then((encoder) => setModel(encoder ? 'ready' : 'unavailable'));
  }, [enabled, model]);

  useEffect(() => {
    if (!enabled) return;
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const id = ++request.current;
    const timer = window.setTimeout(async () => {
      const found = await search(query, { types, lang });
      if (id !== request.current) return;
      setResults(found.results);
      setMode(found.mode);
    }, 120);
    return () => window.clearTimeout(timer);
    // `model` is a dependency so results re-rank when the encoder becomes ready.
  }, [query, enabled, model, typeKey, lang]);

  return { results, mode, model };
}
