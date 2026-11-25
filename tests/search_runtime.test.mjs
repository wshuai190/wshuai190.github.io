import assert from 'node:assert/strict';
import { test } from 'node:test';
import { modelAsset } from '../src/lib/search/model-cache.ts';
import { loadIndex, search } from '../src/lib/search/hybrid.ts';

async function withBrowser(cache, fetch, run) {
  const previous = { window: globalThis.window, caches: globalThis.caches, fetch: globalThis.fetch };
  globalThis.window = { location: { origin: 'https://shuaiwang.io' } };
  globalThis.caches = cache;
  globalThis.fetch = fetch;
  try { await run(); }
  finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  }
}

function memoryCache() {
  const entries = new Map();
  return {
    entries,
    async match(key) { return entries.get(key)?.clone(); },
    async put(key, response) { entries.set(key, response); },
    async keys() { return [...entries.keys()].map((key) => new Request(key)); },
    async delete(request) { return entries.delete(request.url); },
  };
}

test('model assets survive navigation and update when their content revision changes', async () => {
  const cache = memoryCache();
  let downloads = 0;
  await withBrowser({ open: async () => cache }, async () => new Response(`model-${++downloads}`), async () => {
    assert.equal(await (await modelAsset('/model.onnx', 'v1')).text(), 'model-1');
    assert.equal(await (await modelAsset('/model.onnx', 'v1')).text(), 'model-1');
    assert.equal(downloads, 1);
    assert.equal(await (await modelAsset('/model.onnx', 'v2')).text(), 'model-2');
    assert.deepEqual([...cache.entries.keys()], ['https://shuaiwang.io/model.onnx?v=v2']);
  });
});

test('unavailable storage and cache quota failures still return the downloaded model', async () => {
  for (const cache of [
    { open: async () => { throw new Error('private browsing'); } },
    { open: async () => ({ match: async () => undefined, put: async () => { throw new Error('quota'); } }) },
  ]) {
    await withBrowser(cache, async () => new Response('model'), async () => {
      assert.equal(await (await modelAsset('/model.onnx', 'v1')).text(), 'model');
    });
  }
});

test('failed model responses are rejected and never persisted', async () => {
  const cache = memoryCache();
  await withBrowser({ open: async () => cache }, async () => new Response('unavailable', { status: 503 }), async () => {
    await assert.rejects(modelAsset('/model.onnx', 'v1'), /HTTP 503/);
    assert.equal(cache.entries.size, 0);
  });
});

test('a failed index request can retry; keyword searches share one text-only download', async () => {
  let downloads = 0;
  const docs = [
    { url: '/starbucks', type: 'paper', lang: 'en', title: 'Starbucks embeddings', text: 'Training embeddings' },
    { url: '/iter', type: 'paper', lang: 'en', title: 'ITER', text: 'Agentic retrieval' },
  ];
  await withBrowser(undefined, async (url) => {
    assert.equal(url, '/search-index.json');
    if (++downloads === 1) return new Response('unavailable', { status: 503 });
    return Response.json({ docs, vectors: '/vectors.json', modelRevision: 'v1', vocabRevision: 'v1' });
  }, async () => {
    await assert.rejects(loadIndex(), /HTTP 503/);
    const pending = loadIndex();
    assert.equal(loadIndex(), pending);
    await pending;
    const found = await search('Starbucks', { semantic: false });
    assert.equal(found.mode, 'lexical');
    assert.equal(found.results[0].doc.url, '/starbucks');
    assert.equal(downloads, 2);
    assert(docs.every((doc) => !('vector' in doc)));
  });
});
