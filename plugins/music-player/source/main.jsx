import { t as uiText, translateMessage, useLanguage } from '../../../shared/i18n.jsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Card, Div, Tag, Typography } from 'sud-ui';
import { IoFolderOpenOutline, IoMusicalNotesOutline, IoPause, IoPlay, IoPlayBack, IoPlayForward, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';
import { PiMusicNotesFill, PiNumberOneBold, PiRepeatBold, PiRepeatOnceBold } from 'react-icons/pi';
import { PluginRoot, report, sdk, useActions, useDockitTheme, useFooter } from '../../../shared/dockit.jsx';
import { clampVolume, createPlaylist, folderFiles, nextIndex, normalizeSettings, trackTitle } from './player.mjs';
import '../../../shared/base.css';
import './style.css';

const REPEAT = {
  all: { next: 'one', get label(){ return uiText("전체 반복"); }, Icon: PiRepeatBold },
  one: { next: 'off', get label(){ return uiText("한 곡 반복"); }, Icon: PiNumberOneBold },
  off: { next: 'all', get label(){ return uiText("목록 한 번"); }, Icon: PiRepeatOnceBold },
};

function MusicPlayer() {
  const language = useLanguage();
  const theme = useDockitTheme();
  const [tracks, setTracks] = useState([]);
  const [folder, setFolder] = useState('');
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [settings, setSettings] = useState(normalizeSettings(null));
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef(null), input = useRef(null), request = useRef(0);
  const playlist = useRef(null), tracksRef = useRef([]), indexRef = useRef(-1), mounted = useRef(false);
  if (!playlist.current) playlist.current = createPlaylist(URL);
  useEffect(() => {
    mounted.current = true;
    const element = audio.current, registry = playlist.current;
    sdk.storage.get('settings').then(value => { if (mounted.current) { setSettings(normalizeSettings(value)); setSettingsLoaded(true); } }).catch(failure => { if (mounted.current) { setError(uiText("설정을 불러오지 못했습니다. 기본값으로 재생할 수 있어요.")); report(failure); } });
    return () => { mounted.current = false; request.current++; element.pause(); element.removeAttribute('src'); element.load(); registry.clear(); };
  }, []);
  useEffect(() => {
    audio.current.volume = settings.volume; audio.current.muted = settings.muted;
    if (!settingsLoaded) return;
    const timer = setTimeout(() => sdk.storage.set('settings', settings).catch(failure => { if (mounted.current) { setError(uiText("설정을 저장하지 못했습니다.")); report(failure); } }), 250);
    return () => clearTimeout(timer);
  }, [settings, settingsLoaded]);
  const openFolder = useCallback(id => { if (id === 'folder') input.current?.click(); }, []);
  const actions = useMemo(() => { void language; return ([{ id: 'folder', label: uiText("음악 폴더 선택"), icon: 'plus' }]); }, [language]);
  useActions(actions, openFolder);
  useFooter(tracks.length ? (tracks.length === 1 ? uiText("{0} · 1곡", folder || uiText("음악 폴더")) : uiText("{0} · {1}곡", folder || uiText("음악 폴더"), tracks.length)) : uiText("음악 폴더를 선택해주세요"));
  const play = async () => {
    const token = ++request.current;
    try { await audio.current.play(); }
    catch (failure) { if (mounted.current && token === request.current && failure.name !== 'AbortError') { setPlaying(false); setError(uiText("이 파일을 재생할 수 없습니다.")); report(new Error(uiText("오디오 재생에 실패했습니다."))); } }
  };
  const select = (next, autoPlay = true) => {
    const track = tracksRef.current[next]; if (!track) return;
    request.current++; const element = audio.current; element.pause();
    indexRef.current = next; setIndex(next); setError('');
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
  const pickFolder = event => {
    try {
      const picked = folderFiles(event.target.files);
      if (!picked.files.length) return;
      request.current++; audio.current.pause(); audio.current.removeAttribute('src'); audio.current.load();
      playlist.current.clear();
      const added = playlist.current.add(picked.files);
      tracksRef.current = added; setTracks(added); setFolder(picked.folder);
      indexRef.current = -1; setIndex(-1);
      if (added.length) { select(0, false); setError(''); }
      else setError(uiText("이 폴더에 재생할 수 있는 오디오 파일이 없습니다."));
    } catch (failure) { setError(uiText("폴더를 불러오지 못했습니다.")); report(failure); }
    finally { event.target.value = ''; }
  };
  const current = tracks[index];
  const color = theme.name, repeat = REPEAT[settings.repeat];
  const volume = settings.muted ? 0 : settings.volume;
  const colors = theme.colors || {};
  const accent = colors[color]?.[7], track = theme.isDarkMode ? colors.white?.[10] : colors.white?.[4];
  const fill = value => ({ '--thumb': accent, background: `linear-gradient(to right, ${accent} ${value}%, ${track} ${value}%)` });
  return <PluginRoot theme={theme}>
    <main className={`music${theme.isDarkMode ? ' dark' : ''}`} aria-label={uiText("음악 플레이어")}>
      <input ref={input} type="file" webkitdirectory="" multiple hidden onChange={pickFolder} />
      {error && <div role="alert"><Typography size="sm" color="volcano">{translateMessage(error)}</Typography></div>}
      <Card width="100%" shadow="none" border={false}>
        <div className="player">
          <Div className="thumb" shadow="sm" color={color}><PiMusicNotesFill size={40} /></Div>
          <Typography color={`${color}-7`} className="title">{current ? trackTitle(current.name) : uiText("음악 폴더를 선택해주세요")}</Typography>
          <div className="controls">
            <Button size="sm" colorType="text" icon={<repeat.Icon />} title={uiText("반복: {0}", repeat.label)} ariaLabel={uiText("반복: {0}", repeat.label)} disabled={!settingsLoaded} onClick={() => setSettings(value => ({ ...value, repeat: repeat.next }))} />
            <Button size="sm" colorType="text" icon={<IoPlayBack />} ariaLabel={uiText("이전 곡")} disabled={!tracks.length} onClick={() => move(-1)} />
            <Button size="sm" colorType="text" icon={playing ? <IoPause size={20} /> : <IoPlay size={20} />} ariaLabel={playing ? uiText("일시정지") : uiText("재생")} disabled={!tracks.length} onClick={toggle} />
            <Button size="sm" colorType="text" icon={<IoPlayForward />} ariaLabel={uiText("다음 곡")} disabled={!tracks.length} onClick={() => move(1)} />
            <Button size="sm" colorType="text" icon={<IoFolderOpenOutline />} title={uiText("음악 폴더 선택")} ariaLabel={uiText("음악 폴더 선택")} onClick={() => input.current?.click()} />
          </div>
        </div>
      </Card>
      <Card width="100%" shadow="sm" border={false}>
        <div className="list">
          {tracks.length ? tracks.map((item, i) => <Tag key={item.id} className="track" style={{ width: '100%' }} colorType={index === i ? color : 'gray'}>
            <Typography size="sm" weight="medium" className="name">{i + 1}. {trackTitle(item.name)}</Typography>
            <Button size="sm" colorType="text" icon={<IoPlay />} ariaLabel={uiText("{0} 재생", trackTitle(item.name))} onClick={() => select(i)} />
          </Tag>) : <div className="empty">
            <IoMusicalNotesOutline size={32} className="text-gray-400" />
            <Typography size="sm" color="cool-gray-7">{uiText("음악 폴더를 선택하면 그 안의 곡을 재생합니다.")}</Typography>
            <Button size="sm" background={`${color}-1`} color={`${color}-8`} border={false} icon={<IoFolderOpenOutline />} onClick={() => input.current?.click()}>{uiText("폴더 선택")}</Button>
          </div>}
        </div>
      </Card>
      <div className="volume">
        <Button size="sm" colorType="text" icon={settings.muted ? <IoVolumeMute /> : <IoVolumeHigh />} ariaLabel={settings.muted ? uiText("음소거 해제") : uiText("음소거")} disabled={!settingsLoaded} onClick={() => setSettings(value => ({ ...value, muted: !value.muted }))} />
        <input type="range" className="slider" min="0" max="1" step="0.01" value={volume} aria-label={uiText("음량")} disabled={!settingsLoaded} style={fill(volume * 100)} onChange={e => setSettings(value => ({ ...value, volume: clampVolume(Number(e.target.value)), muted: false }))} />
        <Typography size="xs" color="cool-gray-6">{Math.round(volume * 100)}%</Typography>
      </div>
      <audio ref={audio} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={ended} onError={() => { if (!audio.current?.getAttribute('src')) return; setPlaying(false); setError(uiText("이 오디오 형식을 재생할 수 없습니다.")); report(new Error(uiText("오디오 파일을 재생할 수 없습니다."))); }} />
    </main>
  </PluginRoot>;
}
sdk.ready.then(() => createRoot(document.getElementById('root')).render(<MusicPlayer />));
