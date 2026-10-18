function checked(data) {
  if (data?.error) throw new Error(data.error.info || '위키백과 요청에 실패했습니다.');
  if (!data?.query) throw new Error('위키백과 응답을 읽을 수 없습니다.');
  return data.query;
}
export function articleUrl(title) { return `https://ko.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`; }
export function thumbnailUrl(value) {
  try { const url = new URL(value); return url.origin === 'https://upload.wikimedia.org' && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export async function searchWikipedia(sdk, term) {
  const q = term.trim();
  if (!q || q.length > 100) throw new Error('검색어는 1~100자로 입력해주세요.');
  const query = checked(await sdk.network.get('wikipedia', { action: 'query', format: 'json', formatversion: 2, list: 'search', srsearch: q, srnamespace: 0, srlimit: 10, srprop: '' }));
  if (!Array.isArray(query.search) || !query.search.every(item => typeof item?.title === 'string' && Number.isSafeInteger(item.pageid))) throw new Error('위키백과 검색 결과를 읽을 수 없습니다.');
  return query.search.map(({ title, pageid }) => ({ title, pageid }));
}
export async function loadArticle(sdk, title) {
  const query = checked(await sdk.network.get('wikipedia', { action: 'query', format: 'json', formatversion: 2, prop: 'extracts|pageimages', titles: title, redirects: 1, exintro: 1, explaintext: 1, exchars: 1200, piprop: 'thumbnail', pithumbsize: 360 }));
  const page = query.pages?.[0];
  if (!page || page.missing || page.invalid || typeof page.title !== 'string') throw new Error('문서를 찾을 수 없습니다.');
  return { title: page.title, extract: typeof page.extract === 'string' ? page.extract : '', thumbnail: thumbnailUrl(page.thumbnail?.source), url: articleUrl(page.title) };
}
