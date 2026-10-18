import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sdk, report, useActions, useFooter, useTheme } from './runtime.mjs';
import { loadArticle, searchWikipedia } from './wikipedia.mjs';
import './style.css';

function Wikipedia() {
  useTheme();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [article, setArticle] = useState(null);
  const [image, setImage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [failedTitle, setFailedTitle] = useState('');
  const searchId = useRef(0), articleId = useRef(0);
  useEffect(() => () => { searchId.current++; articleId.current++; }, []);
  const clear = useCallback(() => { searchId.current++; articleId.current++; setTerm(''); setResults(null); setArticle(null); setLoading(''); setError(''); }, []);
  const actions = useMemo(() => [{ id: 'clear', label: '검색 지우기', icon: 'refresh' }], []);
  useActions(actions, clear);
  useFooter('한국어 위키백과 · CC BY-SA · 사진은 원문에서 이용 조건 확인');
  useEffect(() => {
    let alive = true; setImage(''); setImageError(false);
    if (article?.thumbnail) sdk.images.load(article.thumbnail).then(src => { if (alive) setImage(src); }).catch(() => { if (alive) setImageError(true); });
    return () => { alive = false; };
  }, [article]);
  const openArticle = async title => {
    const current = ++articleId.current;
    setLoading('문서 요약을 불러오고 있어요.'); setError(''); setArticle(null); setFailedTitle(title);
    try { const data = await loadArticle(sdk, title); if (current === articleId.current) { setArticle(data); setFailedTitle(''); } }
    catch (failure) { if (current === articleId.current) { setError(failure.message); report(failure); } }
    finally { if (current === articleId.current) setLoading(''); }
  };
  const search = async event => {
    event?.preventDefault(); if (!term.trim()) return;
    const current = ++searchId.current; articleId.current++;
    setLoading('문서를 검색하고 있어요.'); setError(''); setFailedTitle(''); setResults(null); setArticle(null);
    try { const data = await searchWikipedia(sdk, term); if (current === searchId.current) setResults(data); }
    catch (failure) { if (current === searchId.current) { setError(failure.message); report(failure); } }
    finally { if (current === searchId.current) setLoading(''); }
  };
  return <main aria-label="위키백과">
    <form className="row search-form" onSubmit={search}><input aria-label="위키백과 검색어" placeholder="검색할 제목을 입력하세요" maxLength={100} value={term} onChange={e => setTerm(e.target.value)} /><button className="primary" disabled={!!loading || !term.trim()}>검색</button></form>
    {loading && <p role="status">{loading}</p>}
    {error && <div role="alert" className="stack"><p className="error">{error}</p><button onClick={() => failedTitle ? openArticle(failedTitle) : search()}>다시 시도</button></div>}
    {!results && !loading && !error && <p className="muted">제목을 검색하고 문서를 골라주세요.</p>}
    {results && <nav aria-label="문서 검색 결과"><ul className="stack">{results.map(item => <li key={item.pageid}><button style={{ width: '100%', textAlign: 'left' }} aria-pressed={article?.title === item.title} disabled={!!loading} onClick={() => openArticle(item.title)}>{item.title}</button></li>)}</ul>{!results.length && <p>검색 결과가 없습니다.</p>}</nav>}
    {article && <article className="panel stack" aria-live="polite">
      <h2>{article.title}</h2>
      {image && <img src={image} alt={`${article.title} 대표 이미지`} style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', alignSelf: 'center' }} />}
      {imageError && <small className="muted">대표 이미지를 불러오지 못했습니다.</small>}
      <p className="prose">{article.extract || '제공되는 요약이 없습니다. 원문을 확인해주세요.'}</p>
      <button className="primary" onClick={() => sdk.openExternal(article.url).catch(report)}>위키백과 원문 열기</button>
    </article>}
  </main>;
}
sdk.ready.then(() => createRoot(document.getElementById('root')).render(<Wikipedia />));
