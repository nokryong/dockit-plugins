import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleUrl, thumbnailUrl, searchWikipedia, loadArticle } from '../plugins/wikipedia/source/wikipedia.mjs';

test('Wikipedia title search and plain summary share a fixed query endpoint', async () => {
  const calls = [];
  const sdk = { network: { get: async (service, params) => { calls.push({ service, params }); return params.list ? { query: { search: [{ pageid: 42, title: '대한민국' }] } } : { query: { pages: [{ title: '대한민국', extract: '대한민국은…', thumbnail: { source: 'https://upload.wikimedia.org/wikipedia/commons/test.jpg' } }] } }; } } };
  assert.deepEqual(await searchWikipedia(sdk, ' 한국 '), [{ pageid: 42, title: '대한민국' }]);
  const article = await loadArticle(sdk, '한국');
  assert.equal(calls[0].service, 'wikipedia'); assert.equal(calls[0].params.srsearch, '한국');
  assert.equal(calls[0].params.formatversion, 2); assert.equal(calls[1].params.explaintext, 1); assert.equal(calls[1].params.redirects, 1);
  assert.equal(calls[1].params.exchars, 1200);
  assert.equal(article.extract, '대한민국은…'); assert.match(article.thumbnail, /^https:\/\/upload.wikimedia.org\//);
  assert.equal(article.url, articleUrl('대한민국'));
});
test('Wikipedia rejects malformed and missing pages and constrains image/external origins', async () => {
  for (const payload of [{ error: { info: 'rate limit' } }, {}, { query: { search: [{}] } }]) await assert.rejects(searchWikipedia({ network: { get: async () => payload } }, 'x'));
  await assert.rejects(loadArticle({ network: { get: async () => ({ query: { pages: [{ title: '없음', missing: true }] } }) } }, '없음'), /찾을 수/);
  assert.equal(thumbnailUrl('https://upload.wikimedia.org.evil.test/a'), '');
  assert.equal(thumbnailUrl('https://user:pass@upload.wikimedia.org/a'), '');
  assert.equal(thumbnailUrl('data:image/png,xxx'), '');
  assert.equal(new URL(articleUrl('https://evil.test/?q=한 글')).origin, 'https://ko.wikipedia.org');
  await assert.rejects(searchWikipedia({}, ' '), /1~100/);
});
