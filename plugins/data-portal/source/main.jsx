import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Div, Input, Select, SoonUIDesign, Typography, defaultTheme, darkTheme } from 'sud-ui';
import 'sud-ui/dist/index.css';
import './style.css';
import { DATA_TYPES, CULTURE_TYPES, PAGE_SIZE, queryData, previousMonth, populationAges, formatNumber, plainText } from './data.mjs';
import { recordView, countrySections } from './fields.mjs';
import { COUNTRIES } from './countries.mjs';
import districts from './districts.json';

const sdk = window.Dockit;
const report = error => sdk.notify(error.message || '공공데이터 조회에 실패했습니다.', 'danger').catch(() => {});
const districtOptions = Object.entries(districts).map(([value, label]) => ({ value, label }));
const control = { size: 'sm', shadow: 'none', color: 'white-1', border: false, style: { width: '100%', minWidth: 0 } };
const small = { size: 'sm', border: false, shadow: 'none' };

function PortalImage({ url, title, theme, downloadable = false }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    setSrc(''); setFailed(false);
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      sdk.images.load(url).then(value => { if (alive) setSrc(value); }).catch(() => { if (alive) setFailed(true); });
    }, { rootMargin: '120px' });
    observer.observe(ref.current);
    return () => { alive = false; observer.disconnect(); };
  }, [url]);
  return <div ref={ref} className="photo">
    {src ? <button type="button" className="photo-open" aria-label={`${title} 크게 보기`} onClick={() => sdk.images.preview({ url, alt: title, caption: title }).catch(report)}><img src={src} alt={title} /></button> : <Typography as="div" size="xs" color="cool-gray-7">{failed ? '이미지를 불러올 수 없습니다.' : '이미지 불러오는 중…'}</Typography>}
    {src && downloadable && <Button {...small} background={`${theme.name}-2`} onClick={() => sdk.images.download(url, title.slice(0, 60).replace(/[<>:"/\\|?*]/g, '-')).catch(report)}>사진 저장</Button>}
  </div>;
}

function Fields({ fields }) {
  return <dl className="fields">{fields.map(({ label, value }) => <div key={label}><dt><Typography size="xs" color="cool-gray-7">{label}</Typography></dt><dd><Typography as="span" size="sm">{value}</Typography></dd></div>)}</dl>;
}

function Record({ type, item, theme }) {
  const view = recordView(type, item);
  return <Div background={`${theme.name}-1`} className="card">
    {view.image && <PortalImage url={view.image} title={view.title} theme={theme} downloadable={type === 'TOUR_PHOTO'} />}
    <Typography as="h3" size="sm" pretendard="SB">{view.title}</Typography>
    {view.fields.length > 0 && <details><summary>상세정보</summary><Fields fields={view.fields} /></details>}
  </Div>;
}

function Country({ country, theme }) {
  const flag = country.flag;
  const title = plainText(flag?.country_nm || country.general?.country_nm) || '국가 정보';
  return <Div background={`${theme.name}-1`} className="card">
    <Typography as="h3" pretendard="SB">{title}</Typography>
    {flag?.country_eng_nm && <Typography size="xs">{plainText(flag.country_eng_nm)}</Typography>}
    {countrySections(country).map(section => <details key={section.key} open={section.key === 'general'}><summary>{section.title}</summary>{section.fields.length ? <Fields fields={section.fields} /> : <Typography size="xs" color="cool-gray-7">제공된 정보가 없습니다.</Typography>}</details>)}
  </Div>;
}

function Population({ data, theme }) {
  const ages = populationAges(data);
  const max = Math.max(1, ...ages.flatMap(age => [age.male, age.female]));
  const average = Number(data.hhCnt) > 0 && Number.isFinite(Number(data.totNmprCnt)) ? (Number(data.totNmprCnt) / Number(data.hhCnt)).toFixed(1) : '—';
  const ratio = Number(data.femlNmprCnt) > 0 && Number.isFinite(Number(data.maleNmprCnt)) ? (Number(data.maleNmprCnt) / Number(data.femlNmprCnt) * 100).toFixed(1) : '—';
  return <Div background={`${theme.name}-1`} className="card">
    <Typography as="h3" size="sm" pretendard="SB">{[data.ctpvNm, data.sggNm, data.dongNm].map(plainText).filter(Boolean).join(' ') || '인구 정보'}</Typography>
    <Fields fields={[
      { label: '기준월', value: plainText(data.statsYm) || '—' }, { label: '총인구 (명)', value: formatNumber(data.totNmprCnt) },
      { label: '세대 수', value: formatNumber(data.hhCnt) }, { label: '세대당 인구 (명)', value: average },
      { label: '남자 (명)', value: formatNumber(data.maleNmprCnt) }, { label: '여자 (명)', value: formatNumber(data.femlNmprCnt) },
      { label: '여자 100명당 남자 수', value: ratio },
    ]} />
    {ages.length > 0 && <div className="ages" aria-label="연령별 인구 분포">
      <Typography as="h4" size="sm">연령별 인구 분포 (명)</Typography>
      {ages.map(age => <div className="age-row" key={age.label}>
        <Typography size="xs">{age.label}</Typography><div>
          <div className="age-value"><Typography size="xs">남 {formatNumber(age.male)}</Typography><progress aria-label={`${age.label} 남자 ${formatNumber(age.male)}명`} max={max} value={age.male} /></div>
          <div className="age-value female"><Typography size="xs">여 {formatNumber(age.female)}</Typography><progress aria-label={`${age.label} 여자 ${formatNumber(age.female)}명`} max={max} value={age.female} /></div>
        </div>
      </div>)}
    </div>}
  </Div>;
}

function DataPortal() {
  const [theme, setTheme] = useState(sdk.theme);
  const [type, setType] = useState(DATA_TYPES[0].value);
  const [term, setTerm] = useState('');
  const [code, setCode] = useState('');
  const [month, setMonth] = useState(previousMonth());
  const [date, setDate] = useState(() => { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; });
  const [culture, setCulture] = useState('연극');
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const config = DATA_TYPES.find(item => item.value === type);
  useEffect(() => sdk.onThemeChange(setTheme), []);
  useEffect(() => () => { sequence.current++; }, []);
  const search = useCallback(async (query, nextPage = 1) => {
    const current = ++sequence.current;
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await queryData(sdk, { ...query, page: nextPage });
      if (sequence.current !== current) return;
      setResult(response); setSubmitted(query); setPage(nextPage);
    } catch (failure) {
      if (sequence.current === current) { setError(failure.message); report(failure); }
    } finally { if (sequence.current === current) setLoading(false); }
  }, []);
  const currentQuery = { type, term, code, month: month.replace(/-/g, ''), date, culture };
  useEffect(() => sdk.onAction(id => { if (id === 'refresh') search(submitted ?? currentQuery, submitted ? page : 1); }), [search, submitted, type, term, code, month, date, culture, page]);
  useEffect(() => { sdk.setActions([{ id: 'refresh', label: '다시 조회', icon: 'refresh', disabled: loading }]).catch(report); }, [loading]);
  useEffect(() => { sdk.setFooter(`출처: ${config.source}${result ? ` · ${result.totalCount.toLocaleString('ko-KR')}건` : ''}`).catch(report); }, [config, result]);
  const changeType = value => {
    sequence.current++; setType(value); setTerm(''); setCode(''); setResult(null); setSubmitted(null); setPage(1); setError(''); setLoading(false);
  };
  const base = theme.isDarkMode ? darkTheme : defaultTheme;
  const palette = { ...base, colors: theme.colors, body: { ...base.body, backgroundColor: 'transparent' } };
  const input = { ...control, background: `${theme.name}-1` };
  return <SoonUIDesign theme={palette} darkTheme={palette} isDarkMode={theme.isDarkMode}>
    <main className="portal-body" style={{ '--ink': theme.colors?.black?.[10], '--line': theme.colors?.['cool-gray']?.[3], '--surface': theme.colors?.[theme.name]?.[1] }}>
      <label className="field"><Typography size="xs" color="cool-gray-7">데이터 종류</Typography><Select {...input} ariaLabel="데이터 종류" value={type} onChange={changeType} options={DATA_TYPES} dropdownStyle={{ maxHeight: 220 }} /></label>
      <div className="search-form" role="search">
        {config.placeholder && <Input {...input} ariaLabel={config.placeholder} placeholder={config.placeholder} value={term} onChange={event => setTerm(event.target.value.slice(0, 200))} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) search(currentQuery); }} />}
        {type === 'COUNTRY_INFO' && <Select {...input} ariaLabel="국가" searchable placeholder="국가 선택" value={code || null} onChange={setCode} options={COUNTRIES} dropdownStyle={{ maxHeight: 200 }} />}
        {type === 'POPULATION_INFO' && <>
          <Select {...input} ariaLabel="행정동" searchable placeholder="행정동 검색·선택" value={code || null} onChange={setCode} options={districtOptions} dropdownStyle={{ maxHeight: 200 }} />
          <label className="field"><Typography size="xs" color="cool-gray-7">기준월</Typography><input type="month" aria-label="인구 기준월" min="2022-10" max={`${previousMonth().slice(0, 4)}-${previousMonth().slice(4)}`} value={`${month.slice(0, 4)}-${month.slice(-2)}`} onChange={event => setMonth(event.target.value.replace(/-/g, ''))} /></label>
        </>}
        {type === 'NK_TV_SCHEDULE' && <label className="field"><Typography size="xs" color="cool-gray-7">방송일</Typography><input type="date" aria-label="방송일" value={date} onChange={event => setDate(event.target.value)} /></label>}
        {type === 'CULTURE_INFO' && <Select {...input} ariaLabel="공연 종류" value={culture} onChange={setCulture} options={CULTURE_TYPES.map(value => ({ value, label: value }))} dropdownStyle={{ maxHeight: 180 }} />}
        <Button {...small} type="button" disabled={loading} background={`${theme.name}-2`} onClick={() => search(currentQuery)}>조회</Button>
      </div>
      {loading && <Typography as="div" role="status" size="sm">조회 중…</Typography>}
      {error && <Typography as="div" role="alert" size="sm" color="red-7">{error}</Typography>}
      {result && <section aria-label="공공데이터 조회 결과" className="results">
        <Typography as="div" size="xs" color="cool-gray-7">{result.totalCount ? `총 ${formatNumber(result.totalCount)}건` : '검색결과가 없습니다.'}</Typography>
        {result.items.map((item, index) => <Record key={`${page}-${index}`} type={type} item={item} theme={theme} />)}
        {result.totalCount > 0 && result.country && <Country country={result.country} theme={theme} />}
        {result.totalCount > 0 && result.population && <Population data={result.population} theme={theme} />}
        {config.paged && result.totalCount > PAGE_SIZE && <nav className="pager" aria-label="결과 페이지">
          <Button {...small} disabled={loading || page === 1} onClick={() => search(submitted, page - 1)}>이전</Button>
          <Typography size="xs">{page} / {Math.ceil(result.totalCount / PAGE_SIZE)}</Typography>
          <Button {...small} disabled={loading || page * PAGE_SIZE >= result.totalCount} onClick={() => search(submitted, page + 1)}>다음</Button>
        </nav>}
      </section>}
      <div className="source"><Button {...small} background="transparent" onClick={() => sdk.openExternal(config.url).catch(report)}><Typography size="xs" className="underline">{config.source} · 출처</Typography></Button></div>
    </main>
  </SoonUIDesign>;
}

sdk.ready.then(() => createRoot(document.getElementById('root')).render(<DataPortal />)).catch(report);
