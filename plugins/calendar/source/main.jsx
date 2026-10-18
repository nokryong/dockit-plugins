import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sdk, report, useActions, useFooter, useTheme } from './runtime.mjs';
import { EVENTS_KEY, addEvent, dateKey, eventsOn, monthCells, normalizeEvents, parseDate, shiftMonth } from './calendar.mjs';
import './style.css';

function Calendar() {
  useTheme();
  const today = dateKey(new Date());
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [itemDate, setItemDate] = useState(today);
  const lock = useRef(false), input = useRef(null), mounted = useRef(false);
  const load = useCallback(async () => {
    setError(''); setLoaded(false);
    try { const data = normalizeEvents(await sdk.storage.get(EVENTS_KEY)); if (mounted.current) { setEvents(data); setLoaded(true); } }
    catch (failure) { if (mounted.current) { setError(failure.message); report(failure); } }
  }, []);
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; }; }, [load]);
  useEffect(() => { if (editing) input.current?.focus(); }, [editing]);
  const actions = useMemo(() => [{ id: 'add', label: '일정 추가', icon: 'plus', disabled: !loaded || busy }, { id: 'today', label: '오늘', icon: 'refresh' }], [loaded, busy]);
  const handleAction = useCallback(id => {
    if (id === 'today') { const value = dateKey(new Date()); setSelected(value); setMonth(value.slice(0, 7)); }
    if (id === 'add' && loaded && !busy) { setItemDate(selected); setEditing(true); }
  }, [loaded, busy, selected]);
  useActions(actions, handleAction);
  useFooter(loaded ? `저장된 일정 ${events.length}개` : error ? '일정을 불러오지 못했습니다' : '일정을 불러오는 중');
  const changeMonth = value => {
    try { parseDate(value + '-01'); setMonth(value); setSelected(value + '-01'); } catch (failure) { report(failure); }
  };
  const moveMonth = amount => { try { changeMonth(shiftMonth(month, amount)); } catch (failure) { report(failure); } };
  const save = async (next, after) => {
    if (lock.current || !loaded) return;
    lock.current = true; setBusy(true); setError('');
    try { await sdk.storage.set(EVENTS_KEY, next); if (mounted.current) { setEvents(next); after?.(); } }
    catch (failure) { if (mounted.current) { setError('일정을 저장하지 못했습니다. 다시 시도해주세요.'); report(failure); } }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  const submit = event => {
    event.preventDefault();
    try { const next = addEvent(events, { id: crypto.randomUUID(), date: itemDate, content }); save(next, () => { setEditing(false); setContent(''); setSelected(itemDate); setMonth(itemDate.slice(0, 7)); }); }
    catch (failure) { setError(failure.message); report(failure); }
  };
  const counts = new Map(); for (const event of events) counts.set(event.date, (counts.get(event.date) || 0) + 1);
  const selectedEvents = eventsOn(events, selected);
  return <main aria-label="달력">
    <div className="row"><button aria-label="이전 달" onClick={() => moveMonth(-1)}>‹</button><label className="grow"><span className="sr-only">표시할 연월</span><input aria-label="표시할 연월" type="month" min="0001-01" max="9999-12" value={month} onChange={e => { if (e.target.value) changeMonth(e.target.value); }} /></label><button aria-label="다음 달" onClick={() => moveMonth(1)}>›</button></div>
    <div className="calendar-grid" role="group" aria-label={`${month} 날짜 선택`}>
      {['일', '월', '화', '수', '목', '금', '토'].map(day => <span className="weekday" key={day}>{day}</span>)}
      {monthCells(month).map(cell => <button key={cell.key} disabled={!cell.selectable} className={`${cell.inMonth ? '' : 'outside'} ${cell.key === today ? 'today' : ''}`} aria-label={`${cell.key}${cell.key === today ? ' 오늘' : ''}, 일정 ${counts.get(cell.key) || 0}개`} aria-current={cell.key === today ? 'date' : undefined} aria-pressed={selected === cell.key} onClick={() => { setSelected(cell.key); if (!cell.inMonth) setMonth(cell.key.slice(0, 7)); }}><span>{cell.day}</span><small aria-hidden="true">{counts.has(cell.key) ? '●' : '\u00a0'}</small></button>)}
    </div>
    {!loaded && !error && <p role="status">일정을 불러오고 있어요.</p>}
    {error && <div role="alert" className="stack"><p className="error">{error}</p>{!loaded && <button onClick={load}>다시 불러오기</button>}</div>}
    <section className="stack" aria-label="선택한 날짜의 일정">
      <div className="row wrap"><h3 className="grow">{selected} 일정</h3><button disabled={!loaded || busy} onClick={() => handleAction('add')}>일정 추가</button></div>
      {loaded && !selectedEvents.length && <p className="muted">등록된 일정이 없습니다.</p>}
      <ul className="stack">{selectedEvents.map(event => <li className="row panel" key={event.id}><p className="grow prose">{event.content}</p><button disabled={busy} aria-label={`${event.content} 삭제`} onClick={() => save(events.filter(item => item.id !== event.id))}>삭제</button></li>)}</ul>
    </section>
    {editing && <div className="stack panel" role="group" aria-label="일정 추가">
      <label>날짜<input type="date" required min="0001-01-01" max="9999-12-31" value={itemDate} disabled={busy} onChange={e => setItemDate(e.target.value)} /></label>
      <label>내용<input ref={input} required maxLength={500} value={content} disabled={busy} onChange={e => setContent(e.target.value)} placeholder="일정을 입력하세요" onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { if (!busy && content.trim() && itemDate) submit(event); }; }} /></label>
      <div className="row wrap"><button type="button" className="primary" disabled={busy || !content.trim() || !itemDate} onClick={submit}>{busy ? '저장 중…' : '저장'}</button><button type="button" disabled={busy} onClick={() => setEditing(false)}>취소</button></div>
    </div>}
  </main>;
}
sdk.ready.then(() => createRoot(document.getElementById('root')).render(<Calendar />));
