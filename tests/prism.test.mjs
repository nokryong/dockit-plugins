import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SEARCH_FIELDS, buildSearchParams, buildDetailParams, normalizeSearch, normalizeDetail, reportPageUrl, searchReports, loadReport } from '../plugins/prism/source/prism.mjs';

const item = { research_id: '1074800-202600001', research_name: '정책연구', issued_year: '2026', organ_name: '발주기관', charge_person_department: '담당부서', research_organName: '연구기관', researcher_name: '연구자', research_date: '2026.01.01 ~ 2026.12.31' };

test('all three search fields use the route query with page and limit', () => {
  for (const option of SEARCH_FIELDS) assert.deepEqual(buildSearchParams({ field: option.value, term: ' 정책 & 연구 ', page: 3 }), { [option.value]: '정책 & 연구', page: 3, limit: 10 });
  assert.throws(() => buildSearchParams({ field: 'download', term: '연구' }), /검색 기준/);
  assert.throws(() => buildSearchParams({ term: ' ' }), /검색어/);
  assert.throws(() => buildSearchParams({ term: '연구', page: 0 }), /페이지/);
  assert.throws(() => buildSearchParams({ term: '연구', page: 1.5 }), /페이지/);
});

test('search normalization preserves report metadata and numeric pagination', () => {
  assert.deepEqual(normalizeSearch({ content: [item], pagination: { total_count: '31' } }), { content: [item], totalCount: 31 });
  assert.equal(normalizeSearch({ content: [item], pagination: { total_count: 'invalid' } }).totalCount, 1);
  assert.equal(normalizeSearch({ content: [item], pagination: { total_count: -2 } }).totalCount, 1);
  assert.deepEqual(normalizeSearch({ content: [], pagination: { total_count: 0 } }), { content: [], totalCount: 0 });
  assert.equal(normalizeSearch({ content: [{ research_id: 'id' }] }).content[0].research_name, '');
});

test('detail summary uses reportInfo with outline fallback and only exposes file names', () => {
  const payload = { research: { research_name: '과제', research_outline: '대체 개요' }, reportInfo: { summary: '개요', url: [{ file_name: '보고서.pdf', file_url: '/api/prism?download=1' }] } };
  assert.deepEqual(normalizeDetail(payload), { title: '과제', summary: '개요', files: ['보고서.pdf'] });
  payload.reportInfo.summary = '';
  assert.equal(normalizeDetail(payload).summary, '대체 개요');
  assert.deepEqual(normalizeDetail({ research: {}, reportInfo: {} }), { title: '', summary: '', files: [] });
});

test('errors and invalid payloads are rejected with useful messages', () => {
  assert.throws(() => normalizeSearch({ error: '기관 점검 중' }), /기관 점검 중/);
  for (const payload of [null, [], '<html>', {}, { content: null }, { content: [null] }, { content: [{ research_name: '과제' }] }]) assert.throws(() => normalizeSearch(payload), /읽을 수/);
  assert.throws(() => normalizeDetail({ error: '상세 조회 실패' }), /상세 조회 실패/);
  assert.throws(() => normalizeDetail({ research: {} }), /읽을 수/);
  assert.throws(() => buildDetailParams(''), /과제 번호/);
});

test('report page URLs stay on the declared PRISM origin with an encoded research ID', async () => {
  const manifest = JSON.parse(await readFile(new URL('../plugins/prism/manifest.json', import.meta.url)));
  const url = new URL(reportPageUrl('id&download=1#fragment'));
  assert.ok(manifest.externalOrigins.includes(url.origin));
  assert.equal(url.pathname, '/homepage/entire/retrieveEntireDetail.do');
  assert.equal(url.searchParams.get('research_id'), 'id&download=1#fragment');
  assert.equal(url.searchParams.size, 1);
  assert.equal(url.hash, '');
  assert.deepEqual(manifest.permissions, ['network', 'external']);
  assert.equal(manifest.services.prism.url, 'https://dockit.kr/api/prism');
  assert.equal(manifest.services.prism.credential, undefined);
});

test('SDK adapters perform JSON search and detail GETs without PDF requests', async () => {
  const calls = [];
  const sdk = { network: { get: async (service, params) => {
    calls.push({ service, params });
    return params.research_id ? { research: { research_name: '과제' }, reportInfo: { summary: '개요' } } : { content: [item], pagination: { total_count: 1 } };
  } } };
  await searchReports(sdk, { field: 'organ_name', term: '기관', page: 2 });
  assert.equal((await loadReport(sdk, item.research_id)).summary, '개요');
  assert.deepEqual(calls, [
    { service: 'prism', params: { organ_name: '기관', page: 2, limit: 10 } },
    { service: 'prism', params: { research_id: item.research_id } },
  ]);
  assert.ok(calls.every(call => !('download' in call.params)));
  sdk.network.get = async () => { throw new Error('offline'); };
  await assert.rejects(loadReport(sdk, item.research_id), /offline/);
});
