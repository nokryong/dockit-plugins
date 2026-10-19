import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { english, translate, translateMessage } from '../shared/messages.mjs';

test('translations keep placeholders, filenames and unknown result text intact', () => {
  for (const [source, value] of Object.entries(english)) {
    const parameters = text => [...text.matchAll(/\{\d+\}/g)].map(match => match[0]).sort();
    assert.deepEqual(parameters(value), parameters(source), source);
  }
  assert.equal(translate('en', '{0} 재생', '한국어 노래'), 'Play 한국어 노래');
  assert.equal(translate('ko', '{0} 재생', '한국어 노래'), '한국어 노래 재생');
  assert.equal(translateMessage('en', '저장된 일정을 읽을 수 없습니다.'), 'Could not read the saved events.');
  assert.equal(translateMessage('ko', 'Could not read the saved events.'), '저장된 일정을 읽을 수 없습니다.');
  assert.equal(translateMessage('en', '사용자가 입력한 일정'), '사용자가 입력한 일정');
});

test('all official plugins keep their IDs and storage permissions and publish English metadata', async () => {
  for (const name of ['dice', 'calendar', 'dictionary', 'image-search', 'music-player']) {
    const manifest = JSON.parse(await fs.readFile(new URL(`../plugins/${name}/manifest.json`, import.meta.url), 'utf8'));
    assert.equal(manifest.id, `dockit.${name}`);
    assert.ok(manifest.locales.en.name);
    assert.ok(manifest.locales.en.description);
    for (const widget of manifest.widgets) assert.ok(manifest.locales.en.widgets[widget.id]);
    assert.ok(!manifest.permissions.includes('documents'));
  }
});
