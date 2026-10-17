import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEvent, dateKey, eventsOn, monthCells, normalizeEvents, parseDate, shiftMonth } from '../plugins/calendar/source/calendar.mjs';

test('calendar uses local dates, leap years and year boundaries without dayjs', () => {
  assert.equal(dateKey(parseDate('2024-02-29')), '2024-02-29');
  assert.equal(dateKey(parseDate('0099-02-28')), '0099-02-28');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  for (const value of ['2023-02-29', '1900-02-29', '2024-02-30', '2026-13-01', '2026-00-01', '2026-1-01', '0000-01-01']) assert.throws(() => parseDate(value), /날짜/);
  const cells = monthCells('2024-02');
  assert.equal(cells.length % 7, 0); assert.equal(cells.filter(cell => cell.inMonth).length, 29);
  assert.equal(cells[0].weekday, 0); assert.equal(cells.at(-1).weekday, 6);
  assert.equal(new Set(cells.map(cell => cell.key)).size, cells.length);
  assert.ok(monthCells('0001-01').filter(cell => cell.selectable).every(cell => Number(cell.key.slice(0, 4)) >= 1));
  assert.ok(monthCells('9999-12').filter(cell => cell.selectable).every(cell => cell.key.length === 10));
  assert.throws(() => shiftMonth('0001-01', -1), /날짜/);
  assert.throws(() => shiftMonth('9999-12', 1), /날짜/);
});
test('calendar round-trips stored events, validates before saving and leaves source unchanged', () => {
  const original = [{ id: 'a', date: '2026-10-17', content: '회의' }];
  const next = addEvent(original, { id: 'b', date: '2026-10-18', content: '  산책  ' });
  assert.equal(original.length, 1); assert.equal(next[1].content, '산책');
  assert.deepEqual(normalizeEvents(JSON.parse(JSON.stringify(next))), next);
  assert.deepEqual(eventsOn(next, '2026-10-17'), original); assert.deepEqual(normalizeEvents(null), []);
  assert.throws(() => addEvent(original, { id: 'b', date: '2026-02-30', content: 'x' }), /날짜/);
  assert.throws(() => addEvent(original, { id: 'b', date: '2026-10-17', content: ' ' }), /내용/);
  assert.throws(() => normalizeEvents([...original, ...original]), /읽을 수/);
  assert.throws(() => normalizeEvents({ events: [] }), /읽을 수/);
});
