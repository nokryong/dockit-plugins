export const PAGE_SIZE = 10;
const portal = 'https://www.data.go.kr/';
export const DATA_TYPES = [
  { value: 'HEALTH_FOOD_INFO', label: '건강기능식품 정보', source: '식품의약품안전처', url: portal, placeholder: '검색할 식품', paged: true },
  { value: 'TOUR_PHOTO', label: '관광사진', source: '한국관광공사', url: portal, placeholder: '검색할 장소·키워드', paged: true },
  { value: 'MOUNTAIN_INFO', label: '산 정보', source: '산림청', url: portal, placeholder: '검색할 산' },
  { value: 'HACCP_PRODUCT_INFO', label: 'HACCP 제품 정보', source: '한국식품안전관리인증원', url: portal, placeholder: '검색할 제품', paged: true },
  { value: 'POPULATION_INFO', label: '행정동별 인구 정보', source: '행정안전부', url: portal },
  { value: 'COUNTRY_INFO', label: '국가별 정보', source: '외교부', url: portal },
  { value: 'NK_TV_SCHEDULE', label: '북한 TV 편성표', source: '통일부', url: portal },
  { value: 'CULTURE_INFO', label: '문화예술공연 프로그램 정보', source: '문화체육관광부', url: 'https://www.culture.go.kr/', placeholder: '검색할 공연', paged: true },
  { value: 'FESTIVAL_INFO', label: '지역축제 정보', source: '문화체육관광부', url: 'https://www.culture.go.kr/', paged: true },
  { value: 'SOCIAL_ENTERPRISE_INFO', label: '사회적기업 정보', source: '한국사회적기업진흥원', url: portal, placeholder: '기업명 (선택)', paged: true, optional: true },
];
export const CULTURE_TYPES = ['연극', '뮤지컬', '오페라', '음악', '콘서트', '국악', '무용', '전시', '기타'];
export const IMAGE_ORIGINS = ['https://tong.visitkorea.or.kr', 'https://galphoto.visitkorea.or.kr', 'https://www.forest.go.kr'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const list = value => (Array.isArray(value) ? value : [value]).filter(item => object(item) && Object.keys(item).length > 0);
const unwrapItems = value => object(value) && 'item' in value ? value.item : value;
export const plainText = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, key) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[key])
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (match, code) => {
      const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
    }).trim();
};
export const formatNumber = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value).toLocaleString('ko-KR') : '—';
export function previousMonth(date = new Date()) {
  const value = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, '0')}`;
}
export function validMonth(value, date = new Date()) {
  return /^\d{4}(0[1-9]|1[0-2])$/.test(value) && Number(value) >= 202210 && Number(value) < date.getFullYear() * 100 + date.getMonth() + 1;
}
function validDate(value) {
  if (!/^\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4)), month = Number(value.slice(4, 6)), day = Number(value.slice(6, 8));
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}
export function buildRequest({ type, term = '', page = 1, code = '', month = '', date = '', culture = '연극' }, now = new Date()) {
  const config = DATA_TYPES.find(item => item.value === type);
  if (!config) throw new Error('데이터 종류를 선택해 주세요.');
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('페이지 번호를 확인해 주세요.');
  const q = String(term).trim().slice(0, 200);
  if (type === 'COUNTRY_INFO') {
    const country = String(code).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(country)) throw new Error('국가를 선택하거나 ISO 3자리 코드를 입력해 주세요.');
    return { service: 'country-info', params: { code: country } };
  }
  if (type === 'POPULATION_INFO') {
    if (!/^\d{10}$/.test(code)) throw new Error('행정동을 선택해 주세요.');
    if (!validMonth(month, now)) throw new Error('2022년 10월부터 지난달까지의 기준월을 선택해 주세요.');
    return { service: 'population-info', params: { q: code, srchFrYm: month } };
  }
  if (config.placeholder && !config.optional && !q) throw new Error('검색어를 입력해 주세요.');
  const params = { select_value: type, pageNo: config.paged ? page : 1, q };
  if (type === 'NK_TV_SCHEDULE') {
    const compact = date.replace(/-/g, '');
    if (!validDate(compact)) throw new Error('조회 날짜를 확인해 주세요.');
    params.sub_value = compact;
  }
  if (type === 'CULTURE_INFO') {
    if (!CULTURE_TYPES.includes(culture)) throw new Error('공연 종류를 선택해 주세요.');
    params.sub_value = culture;
  }
  return { service: 'dataportal', params };
}

export function imageUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:') url.protocol = 'https:';
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !IMAGE_ORIGINS.includes(url.origin)) return '';
    url.hash = '';
    return url.href;
  } catch { return ''; }
}
export function mountainImage(item) {
  const file = list(item?.image?.response?.body?.items?.item).find(image => image.imgfilename)?.imgfilename;
  if (typeof file !== 'string' || !file || /[\\/]|\.\./.test(file)) return '';
  return imageUrl(`https://www.forest.go.kr/images/data/down/mountain/${encodeURIComponent(file)}`);
}

function assertResponse(payload) {
  if (!object(payload)) throw new Error('공공데이터 응답을 읽을 수 없습니다.');
  if (payload.error) throw new Error(plainText(payload.error) || '공공데이터 요청에 실패했습니다.');
  const header = payload.response?.header ?? payload.header;
  const resultCode = header?.resultCode;
  if (resultCode !== undefined && !['0', '00', '0000', 'INFO-000', 'OK'].includes(String(resultCode))) {
    throw new Error(plainText(header.resultMsg) || '공공데이터 제공 기관에서 오류를 반환했습니다.');
  }
  if (payload.code !== undefined && Number(payload.code) !== 0 && payload.msg) throw new Error(plainText(payload.msg));
}

export function normalizeResponse(type, payload) {
  assertResponse(payload);
  if (type === 'COUNTRY_INFO') {
    if (!['flag', 'general', 'relation', 'economic', 'security', 'medical'].some(key => key in payload)) throw new Error('국가별 정보 응답을 읽을 수 없습니다.');
    const country = Object.fromEntries(['flag', 'general', 'relation', 'economic', 'security', 'medical'].map(key => [key, list(payload[key])[0] ?? null]));
    return { country, items: [], totalCount: Object.values(country).some(Boolean) ? 1 : 0 };
  }
  if (type === 'POPULATION_INFO') {
    if (Object.keys(payload).length && !['admmCd', 'statsYm', 'totNmprCnt', 'maleNmprCnt', 'hhCnt', 'maleAgeArray', 'femlAgeArray'].some(key => key in payload)) throw new Error('인구 정보 응답을 읽을 수 없습니다.');
    return { population: payload, items: [], totalCount: Object.keys(payload).length ? 1 : 0 };
  }
  let raw, total;
  if (['HEALTH_FOOD_INFO', 'HACCP_PRODUCT_INFO'].includes(type)) {
    if (!object(payload.body)) throw new Error('식품 정보 응답을 읽을 수 없습니다.');
    raw = payload.body.items;
    // These two APIs wrap each record as { item: record }.
    raw = Array.isArray(raw) ? raw.map(unwrapItems) : unwrapItems(raw);
    total = payload.body.totalCount;
  } else if (type === 'NK_TV_SCHEDULE') {
    if (!('items' in payload)) throw new Error('편성표 응답을 읽을 수 없습니다.');
    raw = unwrapItems(payload.items);
    total = payload.totalCount;
  } else if (type === 'SOCIAL_ENTERPRISE_INFO') {
    if (!Array.isArray(payload.data)) throw new Error('사회적기업 응답을 읽을 수 없습니다.');
    raw = payload.data; total = payload.totalCount;
  } else {
    const body = payload.response?.body;
    if (!object(body)) throw new Error('공공데이터 목록 응답을 읽을 수 없습니다.');
    raw = unwrapItems(body.items);
    total = body.totalCount;
  }
  const items = list(raw);
  const count = Number(total ?? items.length);
  const config = DATA_TYPES.find(item => item.value === type);
  return { items, totalCount: config?.paged && Number.isSafeInteger(count) && count >= items.length ? count : items.length };
}
export async function queryData(sdk, query) {
  const { service, params } = buildRequest(query);
  return normalizeResponse(query.type, await sdk.network.get(service, params));
}

export function populationAges(data) {
  if (!Array.isArray(data?.maleAgeArray) && !Array.isArray(data?.femlAgeArray)) return [];
  const number = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
  return Array.from({ length: 11 }, (_, index) => ({
    label: index === 10 ? '100세 이상' : index === 0 ? '0–9세' : `${index * 10}대`,
    male: number(data.maleAgeArray?.[index]), female: number(data.femlAgeArray?.[index]),
  }));
}
