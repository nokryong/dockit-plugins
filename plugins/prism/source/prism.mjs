export const PAGE_SIZE = 10;
export const SEARCH_FIELDS = [
  { value: 'research_name', label: '과제명' },
  { value: 'organ_name', label: '기관명' },
  { value: 'researcher_name', label: '연구자명' },
];

export function buildSearchParams({ field = 'research_name', term = '', page = 1 } = {}) {
  if (!SEARCH_FIELDS.some(option => option.value === field)) throw new Error('검색 기준을 선택해 주세요.');
  const value = String(term).trim();
  if (!value) throw new Error('검색어를 입력해 주세요.');
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('페이지 번호를 확인해 주세요.');
  return { [field]: value.slice(0, 200), page, limit: PAGE_SIZE };
}

export function buildDetailParams(id) {
  const value = String(id ?? '').trim();
  if (!value || value.length > 200) throw new Error('연구 과제 번호를 확인해 주세요.');
  return { research_id: value };
}

export function reportPageUrl(id) {
  const { research_id } = buildDetailParams(id);
  return `https://www.prism.go.kr/homepage/entire/retrieveEntireDetail.do?research_id=${encodeURIComponent(research_id)}`;
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

function assertPayload(payload) {
  if (!object(payload)) throw new Error('PRISM 응답을 읽을 수 없습니다.');
  if (payload.error) throw new Error(text(payload.error) || 'PRISM 요청에 실패했습니다.');
}

export function normalizeSearch(payload) {
  assertPayload(payload);
  if (!Array.isArray(payload.content) || payload.content.some(item => !object(item) || !text(item.research_id).trim())) {
    throw new Error('PRISM 검색 응답을 읽을 수 없습니다.');
  }
  const content = payload.content.map(item => Object.fromEntries([
    'research_id', 'research_name', 'issued_year', 'organ_name', 'charge_person_department',
    'research_organName', 'researcher_name', 'research_date',
  ].map(key => [key, text(item[key])])));
  const total = Number(payload.pagination?.total_count ?? content.length);
  return { content, totalCount: Number.isSafeInteger(total) && total >= content.length ? total : content.length };
}

export function normalizeDetail(payload) {
  assertPayload(payload);
  if (!object(payload.research) || !object(payload.reportInfo)) throw new Error('PRISM 상세 응답을 읽을 수 없습니다.');
  return {
    title: text(payload.research.research_name),
    summary: text(payload.reportInfo.summary) || text(payload.research.research_outline),
    files: Array.isArray(payload.reportInfo.url) ? payload.reportInfo.url.map(file => text(file?.file_name)).filter(Boolean) : [],
  };
}

export const searchReports = async (sdk, query) => normalizeSearch(await sdk.network.get('prism', buildSearchParams(query)));
export const loadReport = async (sdk, id) => normalizeDetail(await sdk.network.get('prism', buildDetailParams(id)));
