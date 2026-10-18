import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_POINTS, normalizeGeoJSON, readGeoJSON, renderMap, svgMarkup } from '../plugins/geojson-map/source/geojson.mjs';

const square = (x, y, size) => [[x, y], [x + size, y], [x + size, y + size], [x, y + size], [x, y]];
const polygon = coordinates => ({ type: 'Polygon', coordinates });
test('GeoJSON projection centers, inverts Y, fits a 500px viewBox, and retains polygon holes', () => {
  const data = normalizeGeoJSON(polygon([square(0, 0, 10), square(4, 4, 2)]));
  const { paths } = renderMap(data, 0);
  assert.match(paths[0].d, /^M10 490 L490 490 L490 10/);
  assert.equal((paths[0].d.match(/M/g) || []).length, 2);
  const markup = svgMarkup(paths, { fill: '#abcdef', stroke: '#ffffff', strokeWidth: .5 });
  assert.match(markup, /fill-rule="evenodd"/); assert.match(markup, /viewBox="0 0 500 500"/);
});
test('MultiPolygon filtering hides small outer polygons without independently dropping holes', () => {
  const data = normalizeGeoJSON({ type: 'MultiPolygon', coordinates: [[square(0, 0, 100), square(40, 40, 1)], [square(101, 0, .1)]] });
  assert.equal((renderMap(data, 0).paths[0].d.match(/M/g) || []).length, 3);
  assert.equal((renderMap(data, 1).paths[0].d.match(/M/g) || []).length, 2);
  assert.equal(data.points, 15);
});
test('GeoJSON supports FeatureCollection, ignores unsupported geometry, and never emits source markup', () => {
  const data = readGeoJSON('\uFEFF' + JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: '<script>alert(1)</script>' }, geometry: polygon([square(0, 0, 1)]) }, { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] } }] }));
  assert.equal(data.skipped, 1); assert.equal(data.features[0].label, '<script>alert(1)</script>');
  assert.doesNotMatch(svgMarkup(renderMap(data, 0).paths, { fill: '#abcdef', stroke: '#ffffff', strokeWidth: 1 }), /script/);
  assert.throws(() => svgMarkup([{ d: '"><script/>' }], { fill: '#abcdef', stroke: '#ffffff', strokeWidth: 1 }), /경로/);
  assert.throws(() => svgMarkup([], { fill: 'url(evil)', stroke: '#ffffff', strokeWidth: 1 }), /스타일/);
});
test('GeoJSON rejects invalid JSON, unclosed rings, nonfinite coordinates and excess points', () => {
  assert.throws(() => readGeoJSON('{'), /JSON/);
  assert.throws(() => normalizeGeoJSON({ type: 'Point', coordinates: [1, 1] }), /Polygon/);
  assert.throws(() => normalizeGeoJSON(polygon([[[0, 0], [1, 0], [1, 1], [0, 1]]])), /시작점/);
  const invalid = square(0, 0, 1); invalid[1][0] = Infinity;
  assert.throws(() => normalizeGeoJSON(polygon([invalid])), /좌표/);
  assert.throws(() => normalizeGeoJSON(polygon([Array.from({ length: MAX_POINTS + 1 }, () => [0, 0])])), /150,000/);
  const degenerate = normalizeGeoJSON(polygon([Array.from({ length: 4 }, () => [2, 2])]));
  assert.doesNotMatch(renderMap(degenerate, 0).paths[0].d, /NaN|Infinity/);
  const tiny = normalizeGeoJSON(polygon([square(0, 0, 1e-320)]));
  assert.doesNotMatch(renderMap(tiny, 0).paths[0].d, /NaN|Infinity/);
});
