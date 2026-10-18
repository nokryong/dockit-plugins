import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampVolume, createPlaylist, formatTime, folderFiles, isAudioFile, nextIndex, normalizeSettings, trackTitle } from '../plugins/music-player/source/player.mjs';

test('player handles manual navigation and natural end separately for each repeat mode', () => {
  assert.equal(nextIndex(-1, 0), -1); assert.equal(nextIndex(-1, 3), 0);
  assert.equal(nextIndex(0, 3, -1), 2); assert.equal(nextIndex(2, 3), 0);
  assert.equal(nextIndex(2, 3, 1, 'off', true), -1);
  assert.equal(nextIndex(1, 3, 1, 'one', true), 1);
  assert.equal(nextIndex(1, 3, 1, 'one', false), 2);
  assert.equal(nextIndex(0, 1, 1, 'all', true), 0);
});
test('only settings persistable shape is returned and times/volume are finite', () => {
  assert.deepEqual(normalizeSettings({ volume: 4, muted: true, repeat: 'one', tracks: [{ url: 'blob:secret' }] }), { volume: 1, muted: true, repeat: 'one' });
  assert.deepEqual(normalizeSettings(null), { volume: .5, muted: false, repeat: 'all' });
  assert.equal(clampVolume(NaN), .5); assert.equal(clampVolume(-1), 0); assert.equal(clampVolume('0.2'), .5);
  assert.equal(formatTime(125.9), '2:05'); assert.equal(formatTime(Infinity), '0:00');
});
test('playlist creates session URLs only for audio and revokes them on remove/clear', () => {
  const created = [], revoked = [];
  const playlist = createPlaylist({ createObjectURL: file => { created.push(file.name); return `blob:${created.length}`; }, revokeObjectURL: url => revoked.push(url) });
  const files = [{ name: 'a.mp3', size: 12, type: '' }, { name: 'b.unknown', size: 50, type: 'audio/mpeg' }, { name: 'photo.png', size: 20, type: 'image/png' }, { name: 'empty.mp3', size: 0 }];
  const tracks = playlist.add(files);
  assert.equal(tracks.length, 2); assert.equal(isAudioFile(files[2]), false);
  playlist.remove(tracks[0].id); playlist.remove(tracks[0].id); playlist.clear(); playlist.clear();
  assert.deepEqual(revoked, ['blob:1', 'blob:2']);
});
test('playlist cleans up partially created URLs when allocation fails', () => {
  const revoked = []; let calls = 0;
  const playlist = createPlaylist({ createObjectURL: () => { if (++calls === 2) throw new Error('allocation'); return 'blob:first'; }, revokeObjectURL: value => revoked.push(value) });
  assert.throws(() => playlist.add([{ name: 'a.mp3', size: 1 }, { name: 'b.mp3', size: 1 }]), /allocation/);
  playlist.clear(); assert.deepEqual(revoked, ['blob:first']);
});

test('folder files are sorted by relative path and titles drop extension and trailing ids', () => {
  const file = (webkitRelativePath) => ({ name: webkitRelativePath.split('/').pop(), webkitRelativePath });
  const picked = folderFiles([file('Lofi/b/10.mp3'), file('Lofi/a 2.mp3'), file('Lofi/a 10.mp3')]);
  assert.equal(picked.folder, 'Lofi');
  assert.deepEqual(picked.files.map(item => item.webkitRelativePath), ['Lofi/a 2.mp3', 'Lofi/a 10.mp3', 'Lofi/b/10.mp3']);
  assert.equal(folderFiles([]).folder, '');
  assert.equal(trackTitle('lofizoo_music-ask-206714.mp3'), 'lofizoo music ask');
  assert.equal(trackTitle('123.mp3'), '123');
});
