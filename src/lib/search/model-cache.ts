const CACHE_NAME = 'site-search-model-v1';

/** Versioned model assets survive GitHub Pages' short HTTP cache lifetime. */
export async function modelAsset(url: string, revision: string): Promise<Response> {
  const key = new URL(url, window.location.origin);
  key.searchParams.set('v', revision);
  let cache: Cache | undefined;
  try {
    cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key.href);
    if (cached) return cached;
  } catch { /* Storage can be unavailable in private browsing or when over quota. */ }

  const response = await fetch(key.href);
  if (!response.ok) throw new Error(`Search asset: HTTP ${response.status}`);
  if (cache) {
    try {
      await cache.put(key.href, response.clone());
      // Keep just the current revision of this asset, rather than growing on every update.
      const old = (await cache.keys()).filter((request) => {
        const previous = new URL(request.url);
        return previous.pathname === key.pathname && previous.href !== key.href;
      });
      await Promise.all(old.map((request) => cache!.delete(request)));
    } catch { /* A full cache must not prevent search. */ }
  }
  return response;
}
