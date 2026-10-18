export function clampVolume(value, fallback = 0.5) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback; }
export function normalizeSettings(value) {
  return { volume: clampVolume(value?.volume), muted: value?.muted === true, repeat: ['off', 'all', 'one'].includes(value?.repeat) ? value.repeat : 'all' };
}
export function formatTime(value) {
  const seconds = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function nextIndex(index, count, direction = 1, repeat = 'all', ended = false) {
  if (count <= 0) return -1;
  if (index < 0 || index >= count) return direction < 0 ? count - 1 : 0;
  if (ended && repeat === 'one') return index;
  const next = index + direction;
  if (ended && repeat === 'off' && next >= count) return -1;
  return (next + count) % count;
}
export function isAudioFile(file) { return file?.size > 0 && (/^audio\//i.test(file.type || '') || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|aif|aiff|webm)$/i.test(file.name || '')); }
export function createPlaylist(urlApi) {
  const tracks = new Map(); let serial = 0;
  return {
    add(files) {
      const added = [];
      try {
        for (const file of files) {
          if (!isAudioFile(file)) continue;
          const track = { id: `track-${++serial}`, name: file.name, url: urlApi.createObjectURL(file) };
          tracks.set(track.id, track); added.push(track);
        }
        return added;
      } catch (error) { for (const track of added) { urlApi.revokeObjectURL(track.url); tracks.delete(track.id); } throw error; }
    },
    remove(id) { const track = tracks.get(id); if (track) { urlApi.revokeObjectURL(track.url); tracks.delete(id); } },
    clear() { for (const track of tracks.values()) urlApi.revokeObjectURL(track.url); tracks.clear(); },
  };
}
