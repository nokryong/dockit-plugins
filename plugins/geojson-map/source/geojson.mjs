export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_POINTS = 150000;
const MAX_FEATURES = 10000;
const VIEWBOX = 500;
export function normalizeGeoJSON(value) {
  if (!value || typeof value !== 'object') throw new Error('GeoJSON 형식을 확인해주세요.');
  const features = value.type === 'FeatureCollection' ? value.features : value.type === 'Feature' ? [value] : [{ type: 'Feature', geometry: value }];
  if (!Array.isArray(features) || features.length > MAX_FEATURES) throw new Error('지도 객체는 최대 10,000개까지 열 수 있습니다.');
  let points = 0, skipped = 0;
  const polygons = [];
  const ring = coordinates => {
    if (!Array.isArray(coordinates) || coordinates.length < 4) throw new Error('다각형의 좌표가 올바르지 않습니다.');
    const result = coordinates.map(point => {
      if (++points > MAX_POINTS) throw new Error('좌표는 최대 150,000개까지 열 수 있습니다.');
      if (!Array.isArray(point) || point.length < 2 || !point.slice(0, 2).every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1e12)) throw new Error('유효하지 않은 좌표가 있습니다.');
      return point.slice(0, 2);
    });
    const first = result[0], last = result.at(-1);
    if (first[0] !== last[0] || first[1] !== last[1]) throw new Error('다각형의 시작점과 끝점이 같아야 합니다.');
    return result;
  };
  const polygon = coordinates => {
    if (!Array.isArray(coordinates) || !coordinates.length) throw new Error('다각형 좌표가 비어 있습니다.');
    return coordinates.map(ring);
  };
  for (const [index, feature] of features.entries()) {
    if (feature?.type !== 'Feature') throw new Error('GeoJSON Feature 형식을 확인해주세요.');
    const geometry = feature.geometry;
    if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) { skipped++; continue; }
    if (!Array.isArray(geometry.coordinates) || !geometry.coordinates.length) throw new Error('다각형 좌표가 비어 있습니다.');
    const parts = geometry.type === 'Polygon' ? [polygon(geometry.coordinates)] : geometry.coordinates.map(polygon);
    const label = feature.properties?.name ?? feature.properties?.NAME ?? feature.properties?.SIG_KOR_NM;
    polygons.push({ label: typeof label === 'string' ? label.slice(0, 200) : `영역 ${index + 1}`, polygons: parts });
  }
  if (!polygons.length) throw new Error('표시할 Polygon 또는 MultiPolygon이 없습니다.');
  return { features: polygons, points, skipped };
}
export function readGeoJSON(text) {
  let value; try { value = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw new Error('JSON 파일을 읽을 수 없습니다.'); }
  return normalizeGeoJSON(value);
}
export function boundsOf(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY };
}
export function renderMap(data, threshold = 1) {
  const bounds = boundsOf((function* () { for (const feature of data.features) for (const polygon of feature.polygons) for (const ring of polygon) yield* ring; })());
  const width = bounds.maxX - bounds.minX || 1, height = bounds.maxY - bounds.minY || 1;
  const scale = (VIEWBOX - 20) / Math.max(width, height, Number.EPSILON);
  const cx = (bounds.minX + bounds.maxX) / 2, cy = (bounds.minY + bounds.maxY) / 2;
  const ratio = Math.max(0, Math.min(100, Number(threshold) || 0)) / 100;
  const project = ([x, y]) => `${+((x - cx) * scale + VIEWBOX / 2).toFixed(2)} ${+(-(y - cy) * scale + VIEWBOX / 2).toFixed(2)}`;
  const paths = data.features.map(feature => {
    // Filter an entire polygon using its outer ring; keep all holes with it.
    const visible = feature.polygons.filter(([outer]) => { const b = boundsOf(outer); return !((b.maxX - b.minX) / width < ratio && (b.maxY - b.minY) / height < ratio); });
    const d = visible.map(polygon => polygon.map(ring => ring.map((point, i) => `${i ? 'L' : 'M'}${project(point)}`).join(' ') + ' Z').join(' ')).join(' ');
    return { label: feature.label, d };
  }).filter(path => path.d);
  return { paths, bounds };
}
export function svgMarkup(paths, { fill, stroke, strokeWidth }) {
  if (![fill, stroke].every(color => /^#[0-9a-f]{6}$/i.test(color)) || !Number.isFinite(strokeWidth) || strokeWidth < 0 || strokeWidth > 5) throw new Error('지도 스타일을 확인해주세요.');
  // All path data comes from finite numeric coordinates, never from source strings.
  if (!paths.every(path => /^[MLZ0-9 .-]*$/.test(path.d))) throw new Error('지도 경로를 확인해주세요.');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><g fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" fill-rule="evenodd">${paths.map(path => `<path d="${path.d}"/>`).join('')}</g></svg>`;
}
