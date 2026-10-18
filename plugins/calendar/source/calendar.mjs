export const EVENTS_KEY = 'events';
export function dateKey(date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜를 확인해주세요.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(2000, month - 1, day, 12);
  date.setFullYear(year);
  if (year < 1 || year > 9999 || dateKey(date) !== value) throw new Error('날짜를 확인해주세요.');
  return date;
}
export function monthCells(month) {
  const first = parseDate(month + '-01');
  const start = new Date(first); start.setDate(1 - first.getDay());
  const last = new Date(first); last.setMonth(last.getMonth() + 1, 0);
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    return { key: dateKey(date), day: date.getDate(), inMonth: date.getMonth() === first.getMonth(), weekday: date.getDay(), selectable: date.getFullYear() >= 1 && date.getFullYear() <= 9999 };
  });
}
export function shiftMonth(month, amount) {
  const date = parseDate(month + '-01'); date.setMonth(date.getMonth() + amount);
  const key = dateKey(date).slice(0, 7); parseDate(key + '-01'); return key;
}
export function normalizeEvents(value) {
  if (value === null) return [];
  if (!Array.isArray(value)) throw new Error('저장된 일정을 읽을 수 없습니다.');
  const ids = new Set();
  return value.map(event => {
    if (!event || typeof event.id !== 'string' || !event.id || ids.has(event.id) || typeof event.content !== 'string' || !event.content.trim() || event.content.length > 500) throw new Error('저장된 일정을 읽을 수 없습니다.');
    parseDate(event.date); ids.add(event.id);
    return { id: event.id, date: event.date, content: event.content };
  });
}
export function addEvent(events, { id, date, content }) {
  parseDate(date);
  if (typeof content !== 'string' || !content.trim() || content.trim().length > 500) throw new Error('일정 내용은 1~500자로 입력해주세요.');
  if (events.length >= 3000) throw new Error('일정은 최대 3,000개까지 저장할 수 있습니다.');
  return normalizeEvents([...events, { id, date, content: content.trim() }]);
}
export function eventsOn(events, date) { return events.filter(event => event.date === date); }
