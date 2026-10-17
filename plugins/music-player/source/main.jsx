import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { sdk, report, useActions, useFooter, useTheme } from './runtime.mjs';
import { clampVolume, createPlaylist, formatTime, nextIndex, normalizeSettings } from './player.mjs';
import './style.css';

function MusicPlayer() {
  useTheme();
  const [tracks, setTracks] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0), [duration, setDuration] = useState(0);
  const [settings, setSettings] = useState(normalizeSettings(null));
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef(null), input = useRef(null), request = useRef(0);
  const playlist = useRef(null), tracksRef = useRef([]), indexRef = useRef(-1), mounted = useRef(false);
  if (!playlist.current) playlist.current = createPlaylist(URL);
  useEffect(() => {
    mounted.current = true;
    const element = audio.current, registry = playlist.current;
    sdk.storage.get('settings').then(value => { if (mounted.current) { setSettings(normalizeSettings(value)); setSettingsLoaded(true); } }).catch(failure => { if (mounted.current) { setError('설정을 불러오지 못했습니다. 기본값으로 재생할 수 있어요.'); report(failure); } }).finally(() => { if (mounted.current) setSettingsReady(true); });
    return () => { mounted.current = false; request.current++; element.pause(); element.removeAttribute('src'); element.load(); registry.clear(); };
  }, []);
  useEffect(() => {
    audio.current.volume = settings.volume; audio.current.muted = settings.muted;
    if (!settingsLoaded) return;
    const timer = setTimeout(() => sdk.storage.set('settings', settings).catch(failure => { if (mounted.current) { setError('설정을 저장하지 못했습니다.'); report(failure); } }), 250);
    return () => clearTimeout(timer);
  }, [settings, settingsLoaded]);
  const openFiles = useCallback(id => { if (id === 'add') input.current?.click(); }, []);
  const actions = useMemo(() => [{ id: 'add', label: '오디오 파일 추가', icon: 'plus' }], []);
  useActions(actions, openFiles);
  useFooter(`재생목록 ${tracks.length}곡 · 파일은 이 창에서만 유지됩니다`);
  const updateTracks = next => { tracksRef.current = next; setTracks(next); };
  const play = async () => {
    const token = ++request.current;
    try { await audio.current.play(); }
    catch (failure) { if (mounted.current && token === request.current && failure.name !== 'AbortError') { setPlaying(false); setError('이 파일을 재생할 수 없습니다. 다른 오디오 파일을 선택해주세요.'); report(new Error('오디오 재생에 실패했습니다.')); } }
  };
  const select = (next, autoPlay = true) => {
    const track = tracksRef.current[next]; if (!track) return;
    request.current++; const element = audio.current; element.pause();
    indexRef.current = next; setIndex(next); setTime(0); setDuration(0); setError('');
    element.src = track.url; element.load();
    if (autoPlay) play();
  };
  const toggle = () => {
    if (indexRef.current < 0) { select(0); return; }
    if (!audio.current.paused) { request.current++; audio.current.pause(); } else { setError(''); play(); }
  };
  const move = direction => select(nextIndex(indexRef.current, tracksRef.current.length, direction));
  const ended = () => {
    const next = nextIndex(indexRef.current, tracksRef.current.length, 1, settings.repeat, true);
    if (next < 0) { setPlaying(false); return; }
    if (next === indexRef.current) { audio.current.currentTime = 0; play(); } else select(next);
  };
  const addFiles = event => {
    try {
      const files = Array.from(event.target.files || []);
      const added = playlist.current.add(files); updateTracks([...tracksRef.current, ...added]);
      if (indexRef.current < 0 && added.length) select(0, false);
      if (added.length < files.length) { setError('비어 있거나 지원되지 않는 파일을 제외했습니다.'); sdk.notify('일부 파일을 추가하지 못했습니다.', 'warning').catch(() => {}); }
      else setError('');
    } catch (failure) { setError('파일을 추가하지 못했습니다.'); report(failure); }
    event.target.value = '';
  };
  const remove = id => {
    const old = tracksRef.current, removedIndex = old.findIndex(track => track.id === id), active = indexRef.current;
    if (removedIndex < 0) return;
    const next = old.filter(track => track.id !== id);
    if (removedIndex === active) {
      request.current++; audio.current.pause(); audio.current.removeAttribute('src'); audio.current.load();
      setTime(0); setDuration(0); indexRef.current = -1; setIndex(-1);
    }
    playlist.current.remove(id); updateTracks(next);
    if (removedIndex === active && next.length) select(Math.min(active, next.length - 1), false);
    else if (removedIndex < active) { indexRef.current = active - 1; setIndex(active - 1); }
  };
  const current = tracks[index];
  return <main aria-label="음악 플레이어">
    <label>오디오 파일 추가<input ref={input} type="file" multiple accept="audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.opus,.aif,.aiff,.webm" onChange={addFiles} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <section className="panel stack" aria-label="재생 제어">
      <h2 className="prose">{current?.name || '음악을 추가해주세요'}</h2>
      <div className="row wrap"><button disabled={!tracks.length} onClick={() => move(-1)}>이전</button><button className="primary" disabled={!tracks.length} onClick={toggle}>{playing ? '일시정지' : '재생'}</button><button disabled={!tracks.length} onClick={() => move(1)}>다음</button></div>
      <label>재생 위치<input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(time, duration || 0)} disabled={!current || !duration} aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`} onChange={e => { const value = Number(e.target.value); audio.current.currentTime = value; setTime(value); }} /></label>
      <small className="muted">{formatTime(time)} / {formatTime(duration)}</small>
      <div className="row wrap"><label className="grow">반복<select disabled={!settingsReady} value={settings.repeat} onChange={e => setSettings(value => ({ ...value, repeat: e.target.value }))}><option value="off">목록 한 번</option><option value="all">전체 반복</option><option value="one">한 곡 반복</option></select></label><button disabled={!settingsReady} aria-pressed={settings.muted} onClick={() => setSettings(value => ({ ...value, muted: !value.muted }))}>{settings.muted ? '음소거 해제' : '음소거'}</button></div>
      <label>음량 {Math.round((settings.muted ? 0 : settings.volume) * 100)}%<input type="range" min="0" max="1" step="0.01" value={settings.volume} disabled={!settingsReady} onChange={e => setSettings(value => ({ ...value, volume: clampVolume(Number(e.target.value)), muted: false }))} /></label>
    </section>
    <section className="stack" aria-label="재생목록"><h3>재생목록</h3>{!tracks.length && <p className="muted">내 기기의 오디오 파일을 선택해주세요.</p>}
      <ul className="playlist stack">{tracks.map((track, i) => <li className="row" key={track.id}><button className="grow track" aria-pressed={index === i} onClick={() => select(i)}>{i + 1}. {track.name}</button><button aria-label={`${track.name} 목록에서 제거`} onClick={() => remove(track.id)}>제거</button></li>)}</ul>
    </section>
    <audio ref={audio} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} onEnded={ended} onError={() => { setPlaying(false); setError('이 오디오 형식을 재생할 수 없습니다. 다른 파일을 선택해주세요.'); report(new Error('오디오 파일을 재생할 수 없습니다.')); }} />
  </main>;
}
sdk.ready.then(() => createRoot(document.getElementById('root')).render(<MusicPlayer />));
