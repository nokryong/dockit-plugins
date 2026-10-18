import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sdk, report, useActions, useFooter, useTheme } from './runtime.mjs';
import { MAX_FILE_BYTES, readGeoJSON, renderMap, svgMarkup } from './geojson.mjs';
import './style.css';

function GeoJSONMap() {
  const theme = useTheme();
  const [data, setData] = useState(null), [filename, setFilename] = useState('');
  const [threshold, setThreshold] = useState(1);
  const [fill, setFill] = useState(''), [stroke, setStroke] = useState('#ffffff'), [strokeWidth, setStrokeWidth] = useState(0.5);
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const input = useRef(null), reader = useRef(null), sequence = useRef(0);
  useEffect(() => () => { sequence.current++; reader.current?.abort(); }, []);
  const actions = useMemo(() => [{ id: 'open', label: 'GeoJSON 파일 열기', icon: 'plus' }, { id: 'reset', label: '스타일 초기화', icon: 'refresh' }], []);
  const handleAction = useCallback(id => { if (id === 'open') input.current?.click(); if (id === 'reset') { setThreshold(1); setFill(''); setStroke('#ffffff'); setStrokeWidth(0.5); } }, []);
  useActions(actions, handleAction);
  const rendered = useMemo(() => data ? renderMap(data, threshold) : null, [data, threshold]);
  const themeFill = theme.colors?.[theme.name]?.[7];
  const effectiveFill = fill || (/^#[0-9a-f]{6}$/i.test(themeFill || '') ? themeFill : '#147d92');
  const markup = useMemo(() => rendered ? svgMarkup(rendered.paths, { fill: effectiveFill, stroke, strokeWidth }) : '', [rendered, effectiveFill, stroke, strokeWidth]);
  useFooter(data ? `${data.features.length}개 영역 · ${rendered.paths.length}개 표시 · ${data.points.toLocaleString('ko-KR')}개 좌표${data.skipped ? ` · 다각형 외 ${data.skipped}개 제외` : ''}` : 'Polygon · MultiPolygon');
  const open = event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const current = ++sequence.current; reader.current?.abort(); setError(''); setLoading(false);
    if (file.size > MAX_FILE_BYTES) { const failure = new Error('파일은 8 MiB 이하로 선택해주세요.'); setError(failure.message); report(failure); return; }
    if (!/\.(geojson|json)$/i.test(file.name)) { const failure = new Error('.geojson 또는 .json 파일을 선택해주세요.'); setError(failure.message); report(failure); return; }
    setLoading(true); const nextReader = new FileReader(); reader.current = nextReader;
    nextReader.onload = () => {
      if (current !== sequence.current) return;
      try { const next = readGeoJSON(String(nextReader.result)); setData(next); setFilename(file.name); }
      catch (failure) { setError(failure.message); report(failure); }
      finally { setLoading(false); }
    };
    nextReader.onerror = () => { if (current === sequence.current) { setLoading(false); setError('파일을 읽지 못했습니다. 다시 선택해주세요.'); report(new Error('GeoJSON 파일을 읽지 못했습니다.')); } };
    nextReader.readAsText(file);
  };
  return <main aria-label="GeoJSON 지도">
    <label>GeoJSON 파일 열기<input ref={input} type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={open} /></label>
    {loading && <p role="status">지도를 읽고 있어요.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {!data && !loading && <p className="muted">다각형이 담긴 GeoJSON 파일을 선택해주세요.</p>}
    {data && <>
      <h3 className="prose">{filename}</h3>
      <div className="map-options">
        <label>작은 영역 필터 {threshold}%<input type="range" min="0" max="100" step="0.5" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></label>
        <small className="muted">가로·세로가 모두 전체 크기의 이 비율보다 작은 다각형을 숨깁니다.</small>
        <div className="row wrap"><label>채움색<input type="color" value={effectiveFill} onChange={e => setFill(e.target.value)} /></label><label>경계색<input type="color" value={stroke} onChange={e => setStroke(e.target.value)} /></label><label className="grow">경계 두께<input type="number" min="0" max="5" step="0.1" value={strokeWidth} onChange={e => setStrokeWidth(Math.max(0, Math.min(5, Number(e.target.value) || 0)))} /></label></div>
      </div>
      <svg className="map-canvas" viewBox="0 0 500 500" role="img" aria-label={`${filename} 지도`} xmlns="http://www.w3.org/2000/svg">
        <g fill={effectiveFill} stroke={stroke} strokeWidth={strokeWidth} fillRule="evenodd">{rendered.paths.map((path, i) => <path d={path.d} key={i}><title>{path.label}</title></path>)}</g>
      </svg>
      {!rendered.paths.length && <p className="muted">표시할 영역이 없습니다. 필터 비율을 낮춰주세요.</p>}
      <details><summary>SVG 코드</summary><label>SVG 코드 선택<textarea readOnly aria-label="SVG 코드" value={markup} rows={5} onFocus={e => e.target.select()} /></label></details>
    </>}
  </main>;
}
sdk.ready.then(() => createRoot(document.getElementById('root')).render(<GeoJSONMap />));
