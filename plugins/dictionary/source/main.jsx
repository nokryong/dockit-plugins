import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sdk, report, useActions, useFooter, useTheme } from './runtime.mjs';
import { PAGE_SIZE, searchDictionary } from './dictionary.mjs';
import './style.css';

function Dictionary() {
  useTheme();
  const [term, setTerm] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sequence = useRef(0);
  const input = useRef(null);
  useEffect(() => () => { sequence.current++; }, []);
  const clear = useCallback(() => { sequence.current++; setTerm(''); setResult(null); setError(''); setLoading(false); input.current?.focus(); }, []);
  const actions = useMemo(() => [{ id: 'clear', label: '검색 지우기', icon: 'refresh' }], []);
  useActions(actions, clear);
  useFooter(result ? `우리말샘 · 총 ${result.total}건 · ${Math.min(visible, result.items.length)}건 표시` : '우리말샘');
  const search = async event => {
    event?.preventDefault();
    if (!term.trim()) return;
    const current = ++sequence.current;
    setLoading(true); setError(''); setResult(null); setVisible(PAGE_SIZE);
    try { const value = await searchDictionary(sdk, term); if (current === sequence.current) setResult(value); }
    catch (failure) { if (current === sequence.current) { setError(failure.message); report(failure); } }
    finally { if (current === sequence.current) setLoading(false); }
  };
  return <main aria-label="국어사전">
    <form className="row search-form" onSubmit={search}>
      <input ref={input} aria-label="사전 검색어" placeholder="검색할 단어를 입력하세요" maxLength={100} value={term} onChange={e => setTerm(e.target.value)} />
      <button className="primary" disabled={loading || !term.trim()}>검색</button>
    </form>
    {loading && <p role="status">사전을 검색하고 있어요.</p>}
    {error && <div className="stack" role="alert"><p className="error">{error}</p><button onClick={search}>다시 시도</button></div>}
    {!loading && !error && !result && <p className="muted">단어를 입력하면 뜻을 확인할 수 있어요.</p>}
    {result && <div className="stack" aria-live="polite">
      <p className="muted">총 {result.total}건{result.total > result.items.length && ` · 상위 ${result.items.length}건 제공`}</p>
      {!result.items.length && <p>검색 결과가 없습니다.</p>}
      {result.items.slice(0, visible).map((item, index) => <article className="panel stack" key={index}>
        <h2>{item.word}</h2>
        {item.senses.map((sense, i) => <div className="stack" key={i}>
          {(sense.pos || sense.origin) && <small className="muted">{[sense.pos, sense.origin && `[${sense.origin}]`].filter(Boolean).join(' · ')}</small>}
          <p className="prose">{item.senses.length > 1 ? `${i + 1}. ` : ''}{sense.definition}</p>
        </div>)}
      </article>)}
      {visible < result.items.length && <button onClick={() => setVisible(value => value + PAGE_SIZE)}>더보기</button>}
    </div>}
  </main>;
}
sdk.ready.then(() => createRoot(document.getElementById('root')).render(<Dictionary />));
