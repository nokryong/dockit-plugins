import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CACHE_TTL, createSearchClient } from '../plugins/image-search/source/search.mjs';

test('search caching preserves page, filters and key revision and expires after 24 hours', async () => {
  let time = 1000;
  let persisted = null;
  const requests = [];
  const sdk = { storage: { get: async () => persisted, set: async (_key, value) => { persisted = structuredClone(value); } }, network: { get: async (service, params) => { requests.push({ service, params }); return { hits: [], totalHits: 0 }; } } };
  let search = createSearchClient(sdk, () => time);
  const query = { q: ' cat ', type: 'all', color: 'none', page: 1 };
  await Promise.all([search(query, 'key-1'), search(query, 'key-1')]);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], { service: 'pixabay', params: { q: 'cat', lang: 'ko', image_type: 'all', page: 1, per_page: 10 } });
  search = createSearchClient(sdk, () => time);
  await search(query, 'key-1');
  assert.equal(requests.length, 1);
  await search({ ...query, page: 2, color: 'transparent' }, 'key-1');
  assert.equal(requests[1].params.colors, 'transparent');
  assert.equal(requests[1].params.page, 2);
  await search(query, 'key-2');
  assert.equal(requests.length, 3);
  time += CACHE_TTL;
  await search(query, 'key-1');
  assert.equal(requests.length, 4);
});

test('failed and malformed responses are not cached and can be retried', async () => {
  let saves = 0;
  const sdk = { storage: { get: async () => null, set: async () => { saves++; } }, network: { get: async () => { throw new Error('offline'); } } };
  const search = createSearchClient(sdk);
  const query = { q: 'cat', type: 'photo', color: 'none', page: 1 };
  await assert.rejects(search(query, 'key-1'), /offline/);
  sdk.network.get = async () => ({ error: 'invalid' });
  await assert.rejects(search(query, 'key-1'), /읽을 수/);
  assert.equal(saves, 0);
  sdk.network.get = async () => ({ hits: [], totalHits: 0 });
  await search(query, 'key-1');
  assert.equal(saves, 1);
});

test('frequent filter changes do not evict responses before the required 24 hours', async () => {
  let requests = 0;
  const sdk = { storage: { get: async () => null, set: async () => {} }, network: { get: async () => { requests++; return { hits: [], totalHits: 0 }; } } };
  const search = createSearchClient(sdk);
  for (let i = 0; i < 25; i++) await search({ q: `query-${i}`, type: 'all', color: 'none', page: 1 }, 'key-1');
  await search({ q: 'query-0', type: 'all', color: 'none', page: 1 }, 'key-1');
  assert.equal(requests, 25);
});
