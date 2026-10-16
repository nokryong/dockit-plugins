import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Div, Input, Pagination, Radio, Select, SoonUIDesign, Typography, defaultTheme, darkTheme } from 'sud-ui';
import { PiCheckFatFill } from 'react-icons/pi';
import { TbLoader2, TbPhoto } from 'react-icons/tb';
import 'sud-ui/dist/index.css';
import './style.css';
import { createSearchClient, PAGE_SIZE } from './search.mjs';

const sdk = window.Dockit;
const searchImages = createSearchClient(sdk);
const inputProps = { size: 'sm', shadow: 'none', color: 'white-1', border: false, style: { width: '100%', minWidth: 0 } };
const colors = [
  ['red', '빨강', '#FF0000', 'white-10'], ['orange', '주황', '#FFA500', 'black-10'],
  ['yellow', '노랑', '#FFFF00', 'black-10'], ['green', '초록', '#008000', 'white-10'],
  ['turquoise', '청록', '#40E0D0', 'black-10'], ['blue', '파랑', '#0000FF', 'white-10'],
  ['lilac', '연보라', '#E6E6FA', 'black-10'], ['pink', '분홍', '#FFC0CB', 'black-10'],
  ['white', '흰색', '#FFFFFF', 'black-10'], ['gray', '회색', '#606060', 'white-10'],
  ['black', '검정', '#000000', 'white-10'], ['brown', '갈색', '#A52A2A', 'white-10'],
];
const report = error => sdk.notify(error.message || '이미지 검색에 실패했습니다.').catch(() => {});
const smallProps = { size: 'sm', color: 'black-10', background: 'transparent', border: false };

function SearchImage({ image }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    let alive = true;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      sdk.images.load(image.webformatURL).then(value => { if (alive) setSrc(value); }).catch(() => { if (alive) setFailed(true); });
    }, { rootMargin: '200px' });
    observer.observe(ref.current);
    return () => { alive = false; observer.disconnect(); };
  }, [image.webformatURL]);
  const preview = async () => {
    setOpening(true);
    try {
      await sdk.images.preview({
        url: image.largeImageURL, alt: image.tags, caption: image.tags,
        author: image.user, authorImage: image.userImageURL,
        authorUrl: `https://pixabay.com/users/${encodeURIComponent(image.user)}-${image.user_id}/`,
        sourceUrl: image.pageURL, filename: `pixabay-${image.id}`, likes: image.likes,
      });
    } catch (error) { report(error); }
    finally { setOpening(false); }
  };
  return <button ref={ref} type="button" aria-label={`${image.tags} 미리보기`} disabled={opening} onClick={preview} className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-0 bg-transparent p-0 disabled:cursor-wait" style={{ aspectRatio: `${image.webformatWidth || 4} / ${image.webformatHeight || 3}` }}>
    {src ? <img src={src} alt={image.tags} className="block h-full w-full object-contain" /> : failed ? <TbPhoto size={24} /> : <TbLoader2 className="animate-spin" size={20} />}
    {opening && <span className="absolute inset-0 flex items-center justify-center bg-black/20"><TbLoader2 className="animate-spin text-white" size={24} /></span>}
  </button>;
}

function ImageSearch() {
  const [theme, setTheme] = useState(sdk.theme);
  const [wide, setWide] = useState(window.innerWidth >= 220);
  const [credential, setCredential] = useState(null);
  const [configuring, setConfiguring] = useState(false);
  const [term, setTerm] = useState('');
  const [type, setType] = useState('all');
  const [color, setColor] = useState('none');
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  const timer = useRef(null);
  const resultsRef = useRef(null);
  useEffect(() => sdk.onThemeChange(setTheme), []);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 220px)');
    const update = () => setWide(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => { sdk.credentials.status('pixabay').then(setCredential).catch(report); }, []);
  const configure = useCallback(async () => {
    setConfiguring(true);
    try { const status = await sdk.credentials.configure('pixabay'); if (status) setCredential(status); }
    catch (error) { report(error); }
    finally { setConfiguring(false); }
  }, []);
  useEffect(() => sdk.onAction(id => { if (id === 'key') configure(); }), [configure]);
  useEffect(() => {
    sdk.setActions([{ id: 'key', label: 'Pixabay API Key 설정', icon: 'key', disabled: configuring }]).catch(report);
  }, [configuring]);

  const search = useCallback(async (nextPage = 1) => {
    clearTimeout(timer.current);
    const current = ++sequence.current;
    if (!term.trim() || !credential?.configured) { setLoading(false); setResult(null); return; }
    setLoading(true);
    try {
      const response = await searchImages({ q: term, type, color, page: nextPage }, credential.revision);
      if (sequence.current !== current) return;
      setResult(response); setPage(nextPage);
      resultsRef.current?.scrollTo({ top: 0 });
    } catch (error) { if (sequence.current === current) { setResult(null); report(error); } }
    finally { if (sequence.current === current) setLoading(false); }
  }, [term, type, color, credential?.configured, credential?.revision]);
  useEffect(() => {
    timer.current = setTimeout(() => search(1), 500);
    return () => { clearTimeout(timer.current); sequence.current++; };
  }, [search]);

  const baseTheme = theme.isDarkMode ? darkTheme : defaultTheme;
  const palette = { ...baseTheme, colors: theme.colors, body: { ...baseTheme.body, backgroundColor: 'transparent' } };
  return <SoonUIDesign theme={palette} darkTheme={palette} isDarkMode={theme.isDarkMode}>
    <div className="flex w-full min-w-0 flex-col gap-2 p-0.5">
      <div className="grid min-w-0 grid-cols-1 gap-2 min-[220px]:grid-cols-[minmax(0,1fr)_104px]">
        <Input {...inputProps} ariaLabel="이미지 검색어" value={term} onChange={event => setTerm(event.target.value.slice(0, 100))} placeholder="검색할 단어를 입력하세요" onEnter={() => search(1)} background={`${theme.name}-1`} />
        <Select {...inputProps} ariaLabel="이미지 종류" value={type} onChange={setType} options={[{ value: 'all', label: '전체' }, { value: 'photo', label: '사진' }, { value: 'illustration', label: '일러스트' }, { value: 'vector', label: '벡터' }]} dropdownStyle={{ boxShadow: '0 4px 6px -1px #0003', maxHeight: `min(160px, calc(100vh - ${wide ? 56 : 100}px))` }} background={`${theme.name}-1`} />
      </div>
      <Div className="flex flex-col gap-2 rounded-2xl p-2.5" background="cool-gray-2">
        <Radio.Group ariaLabel="이미지 색상" options={[{ value: 'none', label: <Typography size="xs" color="white-1">전체</Typography> }, { value: 'transparent', label: <Typography size="xs" color="white-1">투명 배경</Typography> }, { value: 'grayscale', label: <Typography size="xs" color="white-1">흑백</Typography> }]} direction="horizontal" gap={8} value={color} onChange={setColor} />
        <div className="grid w-full grid-cols-6 gap-2 min-[220px]:grid-cols-12">
          {colors.map(([value, label, hex, iconColor]) => <Button key={value} ariaLabel={label} disabled={value === color} onClick={() => setColor(value)} shape="circle" style={{ width: '100%', minWidth: 0, height: 'auto', aspectRatio: '1', padding: 0, background: hex }} color={iconColor} shadow="sm" border={false} icon={value === color ? <PiCheckFatFill size={10} /> : undefined} />)}
        </div>
      </Div>
      {credential && !credential.configured && <div className="flex items-center justify-between gap-2">
        <Button {...smallProps} disabled={configuring} onClick={configure}><Typography size="xs" className="underline">API Key 설정</Typography></Button>
        <Button {...smallProps} onClick={() => sdk.openExternal('https://pixabay.com/api/docs/').catch(report)}><Typography size="xs" className="underline">키 발급</Typography></Button>
      </div>}
      {loading && <div role="status" aria-label="이미지 검색 중" className="flex justify-center py-1"><TbLoader2 className="animate-spin" size={20} /></div>}
      {result && <div ref={resultsRef} aria-label="이미지 검색 결과" className="flex max-h-[300px] min-w-0 flex-col gap-2 overflow-y-auto">
        <Typography as="div" className="text-right" color="cool-gray-7" size="sm">{result.totalHits ? `총 ${result.totalHits}건` : '검색결과가 없습니다.'}</Typography>
        {result.hits.map(image => <SearchImage key={image.id} image={image} />)}
      </div>}
      {result?.totalHits > PAGE_SIZE && <Pagination className={wide ? '' : '[&>span]:hidden'} align="center" total={result.totalHits} pageSize={PAGE_SIZE} current={page} onChange={nextPage => search(nextPage)} maxVisibleButtons={wide ? 3 : 1} showFirstLast={wide} activeStyle={{ background: `${theme.name}-7`, color: `${theme.name}-1`, size: 'sm', shadow: 'sm' }} defaultStyle={{ background: `${theme.name}-1`, color: `${theme.name}-7`, size: 'sm', shadow: 'sm' }} />}
      <div className="flex justify-end"><Button {...smallProps} onClick={() => sdk.openExternal('https://pixabay.com/').catch(report)}><Typography size="xs" className="underline">Pixabay</Typography></Button></div>
    </div>
  </SoonUIDesign>;
}

sdk.ready.then(() => createRoot(document.getElementById('root')).render(<ImageSearch />));
