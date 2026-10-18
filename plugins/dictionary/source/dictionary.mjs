export const PAGE_SIZE = 10;
export function plainText(value) {
  if (typeof value !== 'string') return '';
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/<[^>]*>/g, '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()] ?? match;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '';
  });
}
export function normalizeDictionary(data) {
  if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message || '사전 검색에 실패했습니다.');
  const channel = data?.channel;
  const total = Number(channel?.total);
  if (!channel || !['number', 'string'].includes(typeof channel.total) || channel.total === '' || !Number.isSafeInteger(total) || total < 0 || (channel.item != null && !Array.isArray(channel.item)) || (total > 0 && !channel.item)) throw new Error('사전 검색 결과를 읽을 수 없습니다.');
  const items = (channel.item || []).map(item => {
    if (typeof item?.word !== 'string' || !Array.isArray(item.sense) || !item.sense.every(sense => sense && typeof sense.definition === 'string')) throw new Error('사전 검색 결과를 읽을 수 없습니다.');
    return { word: plainText(item.word), senses: item.sense.map(sense => ({ pos: plainText(sense.pos), origin: plainText(sense.origin), definition: plainText(sense.definition) })) };
  });
  return { total, items };
}
export async function searchDictionary(sdk, term) {
  const q = term.trim();
  if (!q || q.length > 100) throw new Error('검색어는 1~100자로 입력해주세요.');
  return normalizeDictionary(await sdk.network.get('dictionary', { q }));
}
