import { t as uiText, translateMessage, useLanguage } from '../../../shared/i18n.jsx';
// Port of dockit/app/LIB/components/panel/CalendarWidget.js.
// Events live in plugin storage instead of the account API, the add dialog opens inline above the
// calendar because a modal cannot leave the widget frame, and holidays are not shown.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Calendar, DatePicker, Divider, Input, Tag, Typography } from 'sud-ui';
import { TriangleLeft, TriangleRight } from 'sud-icons';
import dayjs from 'dayjs';
import { PluginRoot, inputProps, report, sdk, shadowSm, useActions, useDockitTheme } from '../../../shared/dockit.jsx';
import { EVENTS_KEY, addEvent, normalizeEvents } from './calendar.mjs';
import '../../../shared/base.css';

const englishCalendar = {
  weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  months: Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2026, month, 1))),
  yearFormat: value => String(value.year()),
  monthFormat: value => String(value.month() + 1),
  today: 'Today',
};

function CalendarWidget() {
  const language = useLanguage();
  const theme = useDockitTheme();
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState(dayjs());
  const [openAddModal, setOpenAddModal] = useState(false);
  const [itemContent, setItemContent] = useState('');
  const [itemDate, setItemDate] = useState(dayjs());
  const [calendarError, setCalendarError] = useState(null);
  const eventsRef = useRef([]);

  useEffect(() => {
    let alive = true;
    sdk.storage.get(EVENTS_KEY).then(value => {
      if (!alive) return;
      const list = normalizeEvents(value);
      eventsRef.current = list; setEvents(list); setLoaded(true);
    }).catch(error => {
      if (!alive) return;
      setCalendarError(uiText("일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
      report(error);
    });
    return () => { alive = false; };
  }, []);

  const save = async next => {
    await sdk.storage.set(EVENTS_KEY, next);
    eventsRef.current = next; setEvents(next);
  };

  const openAdd = useCallback(id => { if (id === 'add') { setItemDate(date); setOpenAddModal(true); } }, [date]);
  const actions = useMemo(() => { void language; return ([{ id: 'add', label: uiText("일정 추가"), icon: 'plus', disabled: !loaded }]); }, [loaded, language]);
  useActions(actions, openAdd);

  const handlePrev = () => setDate(value => value.subtract(1, 'month').startOf('month'));
  const handleNext = () => setDate(value => value.add(1, 'month').startOf('month'));
  const monthLabel = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long' }).format(date.toDate());

  const handleAddItem = async () => {
    if (itemContent === '' || !itemDate) return;
    try {
      const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await save(addEvent(eventsRef.current, { id, date: dayjs(itemDate).format('YYYY-MM-DD'), content: itemContent }));
      setOpenAddModal(false);
      setItemContent('');
      setItemDate(dayjs());
      setCalendarError(null);
      sdk.notify(uiText("일정이 추가되었습니다."), 'info').catch(() => {});
    } catch (error) {
      setCalendarError(uiText("일정을 저장하지 못했습니다. 입력값은 유지됩니다."));
      report(error);
    }
  };

  const handleDeleteEvent = async id => {
    try {
      await save(eventsRef.current.filter(event => event.id !== id));
      setCalendarError(null);
    } catch (error) {
      setCalendarError(uiText("일정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요."));
      report(error);
    }
  };

  const todayEvents = events.filter(event => dayjs(event.date).isSame(date, 'day'));

  return (
    <PluginRoot theme={theme}>
      <div className="w-full flex flex-col gap-2 p-0.5">
        {openAddModal && (
          <div className="flex flex-col gap-2 p-3 rounded-xl" style={shadowSm.style}>
            <Typography pretendard="SB" size="lg">{uiText("일정추가")}</Typography>
            <Input placeholder={uiText("내용")} value={itemContent} onChange={e => setItemContent(e.target.value)} {...inputProps} background={`${theme.name}-1`} />
            <DatePicker placeholder={uiText("날짜")} locale={language} value={itemDate} onChange={value => setItemDate(value)} {...inputProps} background={`${theme.name}-1`} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button className="shrink-0 whitespace-nowrap" onClick={() => setOpenAddModal(false)} colorType="danger" size="sm" border={false} {...shadowSm}>{uiText("취소")}</Button>
              <Button className="shrink-0 whitespace-nowrap" onClick={handleAddItem} disabled={itemContent === '' || !itemDate} colorType="primary" size="sm" border={false} {...shadowSm}>{uiText("추가")}</Button>
            </div>
          </div>
        )}
        <Calendar
          value={date}
          locale={language === 'en' ? englishCalendar : 'ko'}
          items={events}
          onChange={value => setDate(dayjs(value))}
          size="miniView"
          headerRender={
            <div className="flex justify-center items-center w-full">
              <Button onClick={handlePrev} size="sm" colorType="text" icon={<TriangleLeft size={15} />} ariaLabel={uiText("이전 달")} />
              <Typography as="span" gmarket="Medium">
                {monthLabel}
              </Typography>
              <Button onClick={handleNext} size="sm" colorType="text" icon={<TriangleRight size={15} />} ariaLabel={uiText("다음 달")} />
            </div>
          }
        />
        <Divider />
        {calendarError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <Typography color="red-7" size="sm">{translateMessage(calendarError)}</Typography>
          </div>
        )}
        <div className="flex flex-col gap-2 items-center">
          <Typography gmarket="Medium" className="text-center">{uiText("{0} 일정", date.format('YYYY/MM/DD'))}</Typography>
          <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[80px]">
            {todayEvents.map((event, index) => (
              <Tag key={event.id} colorType={index % 2 === 0 ? theme.name : 'blue'} closeable onClose={() => handleDeleteEvent(event.id)}>
                <Typography size="sm">● {event.content}</Typography>
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </PluginRoot>
  );
}

sdk.ready.then(() => createRoot(document.getElementById('root')).render(<CalendarWidget />));
