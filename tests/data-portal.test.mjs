import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DATA_TYPES, IMAGE_ORIGINS, buildRequest, normalizeResponse, queryData, imageUrl, mountainImage, plainText, formatNumber, previousMonth, validMonth, populationAges } from '../plugins/data-portal/source/data.mjs';
import { recordView, countrySections } from '../plugins/data-portal/source/fields.mjs';
import { COUNTRIES } from '../plugins/data-portal/source/countries.mjs';

const now = new Date(2026, 9, 17);
const nested = (item, totalCount = 1) => ({ response: { header: { resultCode: '00' }, body: { items: { item }, totalCount } } });

// Trimmed from the live HACCP (q=김치) and country (code=GHA) responses.
const haccpSample = {
  body: {
    items: [
      { item: { prdlstNm: '고들빼기김치', prdkind: '김치류', manufacture: '(주)올마루', prdlstReportNo: '201804150729', allergy: '새우,대두,밀' } },
      { item: { prdlstNm: '양념깻잎김치', prdkind: '김치류', manufacture: '(주)올마루', prdlstReportNo: '201804150727', allergy: '대두,밀' } },
    ],
    totalCount: '243', pageNo: '1', numOfRows: '10',
  },
  header: { resultCode: 'OK', resultMessage: 'success' },
};
const countrySample = {
  flag: [{ country_nm: '가나', country_eng_nm: 'Ghana', country_iso_alp2: 'GH', download_url: 'https://opendata.mofa.go.kr:8444/fileDownload/images/country_images/flags/15/20220318_161935687.gif' }],
  general: [{ country_nm: '가나', country_eng_nm: 'Ghana', capital: '아크라(Accra)', population: '35064000', area: '238537', lang: '영어(공용어), 아산테어, 에웨어 등' }],
  relation: [{ diplomatic_relations: '1977.11.14. 수교', export_amount: '209000000', import_amount: '37000000' }],
  economic: [{ gdp: '75000000000', gdp_per_capita: '2230', inflation_rate: null }],
  security: [{ current_travel_alarm: '2단계: 여행자제', suicide_death_rate: 28.66, suicide_death_rate_year: 2019 }],
  medical: [{ clean_water_use_rate: 88.37, clean_water_use_rate_year: 2022, tuber_pr_hndrd_thsnd_ppl_outbreak_rate: 126 }],
};

test('live HACCP success code and wrapped rows reach the product cards with pagination', async () => {
  const calls = [];
  const sdk = { network: { get: async (...args) => { calls.push(args); return haccpSample; } } };
  const result = await queryData(sdk, { type: 'HACCP_PRODUCT_INFO', term: '김치' });
  assert.deepEqual(calls, [['dataportal', { select_value: 'HACCP_PRODUCT_INFO', pageNo: 1, q: '김치' }]]);
  assert.equal(result.totalCount, 243);
  assert.deepEqual(result.items, haccpSample.body.items.map(row => row.item));
  const cards = result.items.map(item => recordView('HACCP_PRODUCT_INFO', item));
  assert.deepEqual(cards.map(card => card.title), ['고들빼기김치', '양념깻잎김치']);
  assert.deepEqual(cards[0].fields, [
    { label: '식품 종류', value: '김치류' },
    { label: '제조원', value: '(주)올마루' },
    { label: '품목보고번호', value: '201804150729' },
    { label: '알레르기 유발물질', value: '새우,대두,밀' },
  ]);
  assert.throws(() => normalizeResponse('HACCP_PRODUCT_INFO', { ...haccpSample, header: { resultCode: 'ERROR' } }), /오류/);
});

test('live country response retains all information while rejecting unusable flag URLs', async () => {
  const calls = [];
  const sdk = { network: { get: async (...args) => { calls.push(args); return countrySample; } } };
  const result = await queryData(sdk, { type: 'COUNTRY_INFO', code: 'GHA' });
  assert.deepEqual(calls, [['country-info', { code: 'GHA' }]]);
  assert.equal(result.totalCount, 1);
  assert.equal(result.country.flag.country_nm, '가나');
  assert.equal(result.country.flag.country_eng_nm, 'Ghana');
  assert.equal(imageUrl(result.country.flag.download_url), '');
  assert.ok(!IMAGE_ORIGINS.some(origin => new URL(origin).hostname.endsWith('mofa.go.kr')));
  const sections = countrySections(result.country);
  assert.ok(sections.every(section => section.fields.length > 0));
  assert.deepEqual(sections.find(section => section.key === 'general').fields[0], { label: '수도', value: '아크라(Accra)' });
  assert.ok(sections.find(section => section.key === 'medical').fields.some(field => field.value === '88.37'));
});

test('all ten data types use declared services, scalar parameters and no credentials', async () => {
  const manifest = JSON.parse(await readFile(new URL('../plugins/data-portal/manifest.json', import.meta.url)));
  assert.equal(DATA_TYPES.length, 10);
  assert.equal(new Set(DATA_TYPES.map(item => item.value)).size, 10);
  assert.deepEqual(manifest.imageOrigins, IMAGE_ORIGINS);
  assert.deepEqual(manifest.permissions, ['network', 'images', 'external']);
  for (const type of DATA_TYPES) {
    const request = buildRequest({ type: type.value, term: ' 서울 & 산 ', page: 2, code: type.value === 'COUNTRY_INFO' ? 'KOR' : '1111053000', month: '202609', date: '2026-10-17', culture: '연극' }, now);
    assert.ok(manifest.services[request.service]);
    assert.ok(!manifest.services[request.service].credential);
    assert.equal(new URL(manifest.services[request.service].url).search, '');
    assert.ok(Object.values(request.params).every(value => ['string', 'number', 'boolean'].includes(typeof value)));
    assert.ok(manifest.externalOrigins.includes(new URL(type.url).origin));
    if (request.service === 'dataportal') {
      assert.equal(request.params.q, '서울 & 산');
      assert.equal(request.params.pageNo, type.paged ? 2 : 1);
    }
  }
});

test('country, population, television and culture request parameters match routes', () => {
  assert.deepEqual(buildRequest({ type: 'COUNTRY_INFO', code: ' kor ' }, now), { service: 'country-info', params: { code: 'KOR' } });
  assert.deepEqual(buildRequest({ type: 'POPULATION_INFO', code: '1111053000', month: '202609' }, now), { service: 'population-info', params: { q: '1111053000', srchFrYm: '202609' } });
  assert.equal(buildRequest({ type: 'NK_TV_SCHEDULE', date: '2024-02-29', page: 3 }, now).params.sub_value, '20240229');
  assert.equal(buildRequest({ type: 'CULTURE_INFO', term: '공연', culture: '국악' }, now).params.sub_value, '국악');
  assert.equal(buildRequest({ type: 'FESTIVAL_INFO' }, now).params.q, '');
  assert.throws(() => buildRequest({ type: 'COUNTRY_INFO', code: 'KR' }, now), /3자리/);
  assert.throws(() => buildRequest({ type: 'POPULATION_INFO', code: '서울', month: '202609' }, now), /행정동/);
  assert.throws(() => buildRequest({ type: 'NK_TV_SCHEDULE', date: '2026-02-30' }, now), /날짜/);
  assert.throws(() => buildRequest({ type: 'HEALTH_FOOD_INFO', term: ' ' }, now), /검색어/);
  assert.throws(() => buildRequest({ type: 'CULTURE_INFO', term: '공연', culture: '잘못된 종류' }, now), /공연 종류/);
  assert.throws(() => buildRequest({ type: 'unknown' }, now), /데이터 종류/);
  assert.throws(() => buildRequest({ type: 'FESTIVAL_INFO', page: -1 }, now), /페이지/);
});

test('month bounds, January rollover and month-end defaults are valid', () => {
  assert.equal(previousMonth(new Date(2026, 0, 31)), '202512');
  assert.equal(previousMonth(new Date(2026, 2, 31)), '202602');
  for (const value of ['202200', '202213', '202601x', '202610', '202609.0', '202209']) assert.equal(validMonth(value, now), false, value);
  assert.equal(validMonth('202210', now), true);
  assert.equal(validMonth('202609', now), true);
  assert.throws(() => buildRequest({ type: 'POPULATION_INFO', code: '1111053000', month: '202610' }, now), /지난달/);
});

test('route-specific list shapes normalize single records, arrays and empty results', () => {
  const food = { PRDUCT: '식품', ENTRPS: '제조원' };
  const haccp = { prdlstNm: '제품' };
  for (const [type, item] of [['HEALTH_FOOD_INFO', food], ['HACCP_PRODUCT_INFO', haccp]]) {
    assert.deepEqual(normalizeResponse(type, { body: { items: [{ item }], totalCount: '12' } }), { items: [item], totalCount: 12 });
    assert.deepEqual(normalizeResponse(type, { body: { items: { item }, totalCount: 1 } }).items, [item]);
    assert.deepEqual(normalizeResponse(type, { body: { items: { item: [item] }, totalCount: 1 } }).items, [item]);
    assert.deepEqual(normalizeResponse(type, { body: { items: { item: null }, totalCount: 0 } }).items, []);
    assert.equal(normalizeResponse(type, { body: { items: [], totalCount: 0 } }).totalCount, 0);
  }
  for (const type of ['TOUR_PHOTO', 'MOUNTAIN_INFO', 'CULTURE_INFO', 'FESTIVAL_INFO']) {
    const item = { title: '제목' };
    assert.deepEqual(normalizeResponse(type, nested(item)).items, [item]);
    assert.deepEqual(normalizeResponse(type, nested([item])).items, [item]);
    for (const raw of ['', null, {}, []]) assert.deepEqual(normalizeResponse(type, nested(raw, 0)).items, []);
  }
  // The mountain endpoint always fetches page 1: do not expose false pagination.
  assert.equal(normalizeResponse('MOUNTAIN_INFO', nested([{ mntiname: '산' }], 99)).totalCount, 1);
  assert.deepEqual(normalizeResponse('NK_TV_SCHEDULE', { items: [{ sj: '방송', frmtn_time: '0930' }] }).items, [{ sj: '방송', frmtn_time: '0930' }]);
  assert.equal(normalizeResponse('SOCIAL_ENTERPRISE_INFO', { data: [{ entNmV: '기업' }], totalCount: '21' }).totalCount, 21);
});

test('country handles missing sections and population preserves partial responses and zero values', () => {
  const country = normalizeResponse('COUNTRY_INFO', { flag: [{ country_nm: '한국' }], general: { capital: '서울' }, medical: [{ clean_water_use_rate: 98 }], security: null });
  assert.equal(country.totalCount, 1);
  assert.equal(country.country.general.capital, '서울');
  assert.equal(country.country.security, null);
  assert.equal(normalizeResponse('COUNTRY_INFO', { flag: null, general: [] }).totalCount, 0);
  assert.equal(countrySections(country.country).find(section => section.key === 'medical').fields[0].value, '98');
  const population = { hhCnt: 0, maleNmprCnt: 0, femlAgeArray: [0, 12] };
  assert.deepEqual(normalizeResponse('POPULATION_INFO', population).population, population);
  assert.equal(normalizeResponse('POPULATION_INFO', {}).totalCount, 0);
  const ages = populationAges(population);
  assert.equal(ages.length, 11);
  assert.deepEqual(ages[1], { label: '10대', male: 0, female: 12 });
  assert.equal(ages[10].label, '100세 이상');
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(null), '—');
});

test('upstream JSON errors and malformed envelopes fail without pretending results are empty', () => {
  for (const payload of [null, [], 'html', { error: '기관 점검 중' }, { response: { header: { resultCode: '30', resultMsg: '인증 오류' } } }, { code: -1, msg: '서비스 오류' }, {}]) {
    assert.throws(() => normalizeResponse('TOUR_PHOTO', payload));
  }
  assert.throws(() => normalizeResponse('COUNTRY_INFO', { status: 'invalid' }), /읽을 수/);
  assert.throws(() => normalizeResponse('POPULATION_INFO', { status: 'invalid' }), /읽을 수/);
});

test('image URLs use HTTPS and only declared photo and forest hosts', () => {
  assert.equal(imageUrl('http://tong.visitkorea.or.kr/cms2/photo.jpg'), 'https://tong.visitkorea.or.kr/cms2/photo.jpg');
  assert.equal(imageUrl('https://galphoto.visitkorea.or.kr/photo.jpg'), 'https://galphoto.visitkorea.or.kr/photo.jpg');
  assert.equal(mountainImage({ image: nested({ imgfilename: '북한산.jpg' }) }), 'https://www.forest.go.kr/images/data/down/mountain/%EB%B6%81%ED%95%9C%EC%82%B0.jpg');
  assert.equal(mountainImage({ image: nested([{ imgfilename: 'a.jpg' }, { imgfilename: 'b.jpg' }]) }), 'https://www.forest.go.kr/images/data/down/mountain/a.jpg');
  for (const url of ['https://evil.test/a.jpg', 'https://tong.visitkorea.or.kr.evil.test/a.jpg', 'https://user:pass@tong.visitkorea.or.kr/a.jpg', 'https://tong.visitkorea.or.kr:8444/a.jpg', 'https://www.mofa.go.kr/flag.gif', 'https://opendata.mofa.go.kr/flag.gif', 'data:image/png,x', 'javascript:alert(1)']) assert.equal(imageUrl(url), '');
  assert.equal(mountainImage({ image: nested({ imgfilename: '../a.jpg' }) }), '');
  assert.equal(mountainImage({}), '');
});

test('record views retain Korean detail fields, time, zero and safe text', () => {
  assert.equal(plainText('<p>소개<br>둘째 &amp; &#xD55C;</p>'), '소개\n둘째 & 한');
  const view = recordView('HEALTH_FOOD_INFO', { PRDUCT: '식품', INTAKE_HINT1: '주의사항', MAIN_FNCTN: '기능', SRV_USE: '섭취방법' });
  assert.equal(view.title, '식품');
  assert.deepEqual(view.fields.map(field => field.value), ['섭취방법', '기능', '주의사항']);
  assert.equal(recordView('NK_TV_SCHEDULE', { sj: '뉴스', frmtn_time: 930 }).fields[0].value, '09:30');
  assert.equal(recordView('FESTIVAL_INFO', { title: '축제', description: '행사 소개' }).title, '축제');
});

test('country choices contain ISO alpha-3 values and packaged administrative districts', async () => {
  assert.equal(COUNTRIES.length, 249);
  assert.equal(new Set(COUNTRIES.map(item => item.value)).size, 249);
  assert.ok(COUNTRIES.every(item => /^[A-Z]{3}$/.test(item.value)));
  assert.match(COUNTRIES.find(item => item.value === 'KOR').label, /대한민국|한국/);
  assert.ok(COUNTRIES.some(item => item.value === 'GHA'));
  const districts = JSON.parse(await readFile(new URL('../plugins/data-portal/source/districts.json', import.meta.url)));
  assert.ok(Object.keys(districts).length > 3000);
  assert.ok(Object.keys(districts).every(code => /^\d{10}$/.test(code)));
});

test('SDK request adapter sends only a named GET service and normalizes its result', async () => {
  const calls = [];
  const sdk = { network: { get: async (...args) => { calls.push(args); return nested({ galTitle: '서울' }); } } };
  const result = await queryData(sdk, { type: 'TOUR_PHOTO', term: ' 서울 ', page: 2 });
  assert.deepEqual(calls, [['dataportal', { select_value: 'TOUR_PHOTO', pageNo: 2, q: '서울' }]]);
  assert.equal(result.items[0].galTitle, '서울');
  sdk.network.get = async () => { throw new Error('offline'); };
  await assert.rejects(queryData(sdk, { type: 'FESTIVAL_INFO' }), /offline/);
});
