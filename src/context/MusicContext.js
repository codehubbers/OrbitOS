// src/context/MusicContext.js

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/**
 * The player starts with an empty playlist: OrbitOS does not bundle any
 * music (we can't redistribute copyrighted recordings), so users add
 * tracks from their own files.
 */
export const DEFAULT_PLAYLIST = [];

/** Largest audio file the player will upload (stored base64 in MongoDB). */
export const MAX_AUDIO_UPLOAD_BYTES = 8 * 1024 * 1024;

const REPEAT_MODES = ['off', 'all', 'one'];

/** Audio mime types and extensions recognised when scanning user files. */
export const AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.flac',
  '.aac',
  '.opus',
  '.weba',
];

export function isAudioFile(file) {
  if (!file) return false;
  if (file.mimeType && file.mimeType.startsWith('audio/')) return true;
  const name = (file.name || '').toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

const MusicContext = createContext();

/**
 * Global playback service. Lives at the app root so music keeps playing
 * when the player window is minimised or closed.
 */
export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const [playlist, setPlaylist] = useState(DEFAULT_PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off' | 'all' | 'one'
  const [error, setError] = useState(null);

  // Refs mirrored from state so event handlers never go stale.
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const hasStartedRef = useRef(hasStarted);
  const isPlayingRef = useRef(isPlaying);
  playlistRef.current = playlist;
  currentIndexRef.current = currentIndex;
  shuffleRef.current = shuffle;
  repeatRef.current = repeat;
  hasStartedRef.current = hasStarted;
  isPlayingRef.current = isPlaying;

  const currentTrack = playlist[currentIndex] || null;

  // Create the single audio element once (client-side only).
  useEffect(() => {
    if (audioRef.current) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
      setError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setIsPlaying(false);
      if (!audio.getAttribute('src')) return;
      setError(
        `Couldn't play "${currentTrack?.title || 'this track'}". The file may be missing or in an unsupported format.`,
      );
    };
    const onEnded = () => {
      if (repeatRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      const listLength = playlistRef.current.length;
      let nextIndex;
      if (shuffleRef.current && listLength > 1) {
        do {
          nextIndex = Math.floor(Math.random() * listLength);
        } while (nextIndex === currentIndexRef.current);
      } else {
        nextIndex = currentIndexRef.current + 1;
      }
      if (nextIndex >= listLength) {
        if (repeatRef.current === 'all') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
          audio.currentTime = 0;
          return;
        }
      }
      setCurrentIndex(nextIndex);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load track source whenever the current track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (!audio.src.endsWith(currentTrack.src)) {
      audio.src = currentTrack.src;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
      setError(null);
      if (isPlayingRef.current) {
        audio.play().catch(() => {});
      }
    }
  }, [currentTrack]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    // Nothing to play until the user adds a track.
    if (!audio || playlistRef.current.length === 0) return;
    audio.play().catch(() => {
      /* autoplay restrictions or missing file — error state handles it */
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const playTrack = useCallback(
    (index) => {
      if (index < 0 || index >= playlist.length) return;
      if (index === currentIndexRef.current) {
        play();
        return;
      }
      setCurrentIndex(index);
      setIsPlaying(true); // track-change effect will call play()
      setHasStarted(true);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 0);
    },
    [playlist.length, play],
  );

  const next = useCallback(() => {
    const listLength = playlist.length;
    if (listLength === 0) return;
    let nextIndex;
    if (shuffleRef.current && listLength > 1) {
      do {
        nextIndex = Math.floor(Math.random() * listLength);
      } while (nextIndex === currentIndexRef.current);
    } else {
      nextIndex = (currentIndexRef.current + 1) % listLength;
    }
    const wasPlaying = isPlayingRef.current;
    setCurrentIndex(nextIndex);
    if (wasPlaying) {
      setTimeout(() => audioRef.current?.play().catch(() => {}), 0);
    }
  }, [playlist.length]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    // Restart the track if we're more than 3 seconds in.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const listLength = playlist.length;
    if (listLength === 0) return;
    const prevIndex = (currentIndexRef.current - 1 + listLength) % listLength;
    const wasPlaying = isPlayingRef.current;
    setCurrentIndex(prevIndex);
    if (wasPlaying) {
      setTimeout(() => audioRef.current?.play().catch(() => {}), 0);
    }
  }, [playlist.length]);

  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || Number.isNaN(time)) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((value) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = false;
    }
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (audioRef.current) audioRef.current.muted = nextMuted;
      return nextMuted;
    });
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), []);

  /**
   * Adds a track from the user's files to the playlist.
   * Tracks keep the order they were added in; duplicates (by id) are
   * ignored.
   */
  const addTrack = useCallback((track) => {
    if (!track || !track.id || !track.src) return;
    setPlaylist((prev) =>
      prev.some((t) => t.id === track.id) ? prev : [...prev, track],
    );
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat(
      (prev) =>
        REPEAT_MODES[(REPEAT_MODES.indexOf(prev) + 1) % REPEAT_MODES.length],
    );
  }, []);

  /**
   * Lazily creates a Web Audio AnalyserNode for the visualiser.
   * Returns null when the Web Audio API is unavailable.
   */
  const getAnalyser = useCallback(() => {
    if (analyserRef.current) return analyserRef.current;
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      if (!sourceNodeRef.current) {
        sourceNodeRef.current =
          audioContextRef.current.createMediaElementSource(audio);
      }
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;
      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;
      return analyser;
    } catch {
      return null;
    }
  }, []);

  // Media Session API — OS / keyboard media keys.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator))
      return;
    try {
      if (currentTrack && typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
        });
      }
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('previoustrack', previous);
      navigator.mediaSession.setActionHandler('nexttrack', next);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) seekTo(details.seekTime);
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      /* Media Session not fully supported — ignore */
    }
  }, [currentTrack, isPlaying, play, pause, previous, next, seekTo]);

  const value = {
    playlist,
    currentTrack,
    currentIndex,
    isPlaying,
    hasStarted,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    error,
    play,
    pause,
    togglePlay,
    playTrack,
    next,
    previous,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    addTrack,
    getAnalyser,
  };

  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}
