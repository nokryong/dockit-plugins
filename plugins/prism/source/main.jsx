import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Div, Input, Select, SoonUIDesign, Typography, defaultTheme, darkTheme } from 'sud-ui';
import 'sud-ui/dist/index.css';
import './style.css';
import { SEARCH_FIELDS, PAGE_SIZE, searchReports, loadReport, reportPageUrl } from './prism.mjs';

const sdk = window.Dockit;
const report = error => sdk.notify(error.message || 'PRISM 요청에 실패했습니다.', 'danger').catch(() => {});
const control = { size: 'sm', shadow: 'none', color: 'white-1', border: false, style: { width: '100%', minWidth: 0 } };
const small = { size: 'sm', border: false, shadow: 'none' };

function Prism() {
  const [theme, setTheme] = useState(sdk.theme);
  const [term, setTerm] = useState('');
  const [field, setField] = useState('research_name');
  const [submitted, setSubmitted] = useState(null);
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const searchSequence = useRef(0);
  const detailSequence = useRef(0);
  useEffect(() => sdk.onThemeChange(setTheme), []);
  useEffect(() => () => { searchSequence.current++; detailSequence.current++; }, []);
  const search = useCallback(async (query, nextPage = 1) => {
    const current = ++searchSequence.current;
    detailSequence.current++;
    setLoading(true); setError(''); setResult(null);
    setSelected(''); setDetail(null); setDetailError(''); setDetailLoading(false);
    try {
      const response = await searchReports(sdk, { ...query, page: nextPage });
      if (searchSequence.current !== current) return;
      setResult(response); setSubmitted(query); setPage(nextPage);
    } catch (failure) {
      if (searchSequence.current === current) { setError(failure.message); report(failure); }
    } finally { if (searchSequence.current === current) setLoading(false); }
  }, []);
  const showDetail = async (id, force = false) => {
    const current = ++detailSequence.current;
    if (selected === id && !force) { setSelected(''); setDetail(null); setDetailLoading(false); setDetailError(''); return; }
    setSelected(id); setDetail(null); setDetailError(''); setDetailLoading(true);
    try {
      const response = await loadReport(sdk, id);
      if (detailSequence.current === current) setDetail(response);
    } catch (failure) {
      if (detailSequence.current === current) { setDetailError(failure.message); report(failure); }
    } finally { if (detailSequence.current === current) setDetailLoading(false); }
  };
  useEffect(() => sdk.onAction(id => { if (id === 'refresh') search(submitted ?? { field, term }, submitted ? page : 1); }), [search, submitted, field, term, page]);
  useEffect(() => { sdk.setActions([{ id: 'refresh', label: '다시 검색', icon: 'refresh', disabled: loading }]).catch(report); }, [loading]);
  useEffect(() => { sdk.setFooter(`출처: PRISM${result ? ` · ${result.totalCount.toLocaleString('ko-KR')}건` : ''}`).catch(report); }, [result]);
  const base = theme.isDarkMode ? darkTheme : defaultTheme;
  const palette = { ...base, colors: theme.colors, body: { ...base.body, backgroundColor: 'transparent' } };
  return <SoonUIDesign theme={palette} darkTheme={palette} isDarkMode={theme.isDarkMode}>
    <main className="prism-body" style={{ '--ink': theme.colors?.black?.[10], '--line': theme.colors?.['cool-gray']?.[3] }}>
      <form className="search-form" onSubmit={event => { event.preventDefault(); search({ field, term }); }}>
        <Input {...control} ariaLabel="정책연구 과제 검색어" placeholder="정책연구 과제 검색" value={term} onChange={event => setTerm(event.target.value.slice(0, 200))} background={`${theme.name}-1`} />
        <Select {...control} ariaLabel="검색 기준" value={field} onChange={setField} options={SEARCH_FIELDS} background={`${theme.name}-1`} dropdownStyle={{ maxHeight: 160 }} />
        <Button {...small} type="submit" disabled={loading} background={`${theme.name}-2`}>검색</Button>
      </form>
      {loading && <Typography as="div" role="status" size="sm">검색 중…</Typography>}
      {error && <Typography as="div" role="alert" size="sm" color="red-7">{error}</Typography>}
      {result && <section className="results" aria-label="정책연구 검색 결과">
        <Typography as="div" size="xs" color="cool-gray-7">{result.totalCount ? `총 ${result.totalCount.toLocaleString('ko-KR')}건` : '검색결과가 없습니다. 다른 검색어나 검색 기준을 선택해 주세요.'}</Typography>
        {result.content.map(research => <Div key={research.research_id} background={`${theme.name}-1`} className="card">
          <button type="button" className="report-title" aria-expanded={selected === research.research_id} aria-controls={`detail-${research.research_id}`} onClick={() => showDetail(research.research_id)}><Typography as="span" size="sm" pretendard="SB">{research.research_name || '제목 없음'}</Typography></button>
          <div className="tags">{[research.issued_year, research.organ_name, research.charge_person_department].filter(Boolean).map((value, index) => <Typography key={index} size="xs" color="cool-gray-8">{value}</Typography>)}</div>
          <Typography as="div" size="xs" color="cool-gray-7">{[research.research_organName, research.researcher_name, research.research_date].filter(Boolean).join(' · ')}</Typography>
          <div id={`detail-${research.research_id}`} hidden={selected !== research.research_id} className="detail">
            {selected === research.research_id && <>
              {detailLoading && <Typography as="div" role="status" size="xs">상세정보 불러오는 중…</Typography>}
              {detailError && <><Typography as="div" role="alert" size="sm" color="red-7">{detailError}</Typography><Button {...small} onClick={() => showDetail(research.research_id, true)}>상세정보 다시 조회</Button></>}
              {detail && <><Typography as="h4" size="sm" pretendard="SB">개요</Typography><Typography as="p" size="sm" className="summary">{detail.summary || '표시할 개요가 없습니다.'}</Typography>{detail.files.length > 0 && <Typography as="div" size="xs" color="cool-gray-7">보고서: {detail.files.join(', ')}</Typography>}</>}
            </>}
          </div>
          <div className="report-link"><Button {...small} background={`${theme.name}-2`} onClick={() => { try { sdk.openExternal(reportPageUrl(research.research_id)).catch(report); } catch (failure) { report(failure); } }}>PRISM에서 보고서 보기</Button></div>
        </Div>)}
        {result.totalCount > PAGE_SIZE && <nav className="pager" aria-label="검색 결과 페이지">
          <Button {...small} disabled={loading || page === 1} onClick={() => search(submitted, page - 1)}>이전</Button>
          <Typography size="xs">{page} / {Math.ceil(result.totalCount / PAGE_SIZE)}</Typography>
          <Button {...small} disabled={loading || page * PAGE_SIZE >= result.totalCount} onClick={() => search(submitted, page + 1)}>다음</Button>
        </nav>}
      </section>}
      <div className="source"><Button {...small} background="transparent" onClick={() => sdk.openExternal('https://www.prism.go.kr/').catch(report)}><Typography size="xs" className="underline">PRISM · 출처</Typography></Button></div>
    </main>
  </SoonUIDesign>;
}

sdk.ready.then(() => createRoot(document.getElementById('root')).render(<Prism />)).catch(report);
