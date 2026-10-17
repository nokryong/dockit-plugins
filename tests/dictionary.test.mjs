import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDictionary, plainText, searchDictionary } from '../plugins/dictionary/source/dictionary.mjs';

test('dictionary uses the fixed service and normalizes the route response without HTML execution', async () => {
  const calls = [];
  const sdk = { network: { get: async (...args) => { calls.push(args); return { channel: { total: '12', item: [{ word: '사랑', sense: [{ pos: '명사', origin: '愛', definition: '<b>아끼는</b> 마음 &amp; &#xC0AC;&#46993; &lt;script&gt;' }] }] } }; } } };
  const result = await searchDictionary(sdk, ' 사랑 ');
  assert.deepEqual(calls, [['dictionary', { q: '사랑' }]]);
  assert.equal(result.total, 12);
  assert.equal(result.items[0].senses[0].definition, '아끼는 마음 & 사랑 <script>');
  assert.equal(plainText('&#99999999; &#55296;'), ' ');
});
test('dictionary accepts empty results and rejects errors and malformed payloads', async () => {
  assert.deepEqual(normalizeDictionary({ channel: { total: 0 } }), { total: 0, items: [] });
  for (const payload of [null, {}, { channel: { total: 'oops' } }, { channel: { total: 1 } }, { channel: { total: 1, item: [{ word: 'x' }] } }]) assert.throws(() => normalizeDictionary(payload), /읽을 수/);
  assert.throws(() => normalizeDictionary({ channel: { total: null } }), /읽을 수/);
  assert.throws(() => normalizeDictionary({ channel: { total: 1, item: [{ word: 'x', sense: [null] }] } }), /읽을 수/);
  assert.throws(() => normalizeDictionary({ error: '서버 오류' }), /서버 오류/);
  const sdk = { network: { get: () => assert.fail('must not request') } };
  await assert.rejects(searchDictionary(sdk, '  '), /1~100/);
  await assert.rejects(searchDictionary(sdk, '가'.repeat(101)), /1~100/);
});
