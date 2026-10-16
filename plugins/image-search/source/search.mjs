export const CACHE_TTL = 24 * 60 * 60 * 1000;
export const PAGE_SIZE = 10;

export function createSearchClient(sdk, now = Date.now) {
  let cache;
  const pending = new Map();
  const load = () => cache ||= sdk.storage.get('search-cache').then(value => Array.isArray(value) ? value : []);
  return async (criteria, revision) => {
    const q = criteria.q.trim();
    if (!q || q.length > 100) throw new Error('검색어는 1~100자로 입력해주세요.');
    const params = { q, lang: 'ko', image_type: criteria.type, page: criteria.page, per_page: PAGE_SIZE };
    if (criteria.color !== 'none') params.colors = criteria.color;
    const key = JSON.stringify([revision, params]);
    const entries = await load();
    const found = entries.find(entry => entry.key === key && now() - entry.time < CACHE_TTL && entry.time <= now());
    if (found) return found.result;
    if (pending.has(key)) return pending.get(key);
    const request = (async () => {
      const result = await sdk.network.get('pixabay', params);
      if (!result || !Array.isArray(result.hits) || !Number.isSafeInteger(result.totalHits) || result.totalHits < 0) throw new Error('이미지 검색 결과를 읽을 수 없습니다.');
      const current = await load();
      current.unshift({ key, time: now(), result });
      const keep = current.filter(entry => now() - entry.time < CACHE_TTL);
      cache = Promise.resolve(keep);
      await sdk.storage.set('search-cache', keep);
      return result;
    })();
    pending.set(key, request);
    try { return await request; } finally { pending.delete(key); }
  };
}
