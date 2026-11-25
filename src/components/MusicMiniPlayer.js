// src/components/MusicMiniPlayer.js

import { motion } from 'framer-motion';
import { useMusic } from '@/context/MusicContext';
import { useApp } from '@/context/AppContext';
import MusicPlayerApp from '@/system/apps/MusicPlayerApp';

/**
 * Taskbar mini-player. Appears once playback has started and keeps
 * controls available while the Music Player window is minimised or closed.
 */
export default function MusicMiniPlayer() {
  const { currentTrack, isPlaying, hasStarted, togglePlay, next, previous } =
    useMusic();
  const { dispatch } = useApp();

  if (!hasStarted || !currentTrack) return null;

  const openPlayer = () => {
    dispatch({ type: 'OPEN_APP', payload: MusicPlayerApp });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/10 border border-white/20"
      data-testid="music-mini-player"
    >
      <button
        onClick={openPlayer}
        className="flex items-center space-x-2 max-w-40 hover:bg-white/10 rounded px-1 py-0.5"
        title="Open Music Player"
      >
        <span className={isPlaying ? 'animate-pulse' : ''}>🎵</span>
        <span className="text-white text-xs font-medium truncate">
          {currentTrack.title} — {currentTrack.artist}
        </span>
      </button>
      <button
        onClick={previous}
        className="text-white/80 hover:text-white text-sm px-1"
        title="Previous"
        aria-label="Previous track"
      >
        ⏮
      </button>
      <button
        onClick={togglePlay}
        className="text-white hover:scale-110 transition-transform text-sm px-1"
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button
        onClick={next}
        className="text-white/80 hover:text-white text-sm px-1"
        title="Next"
        aria-label="Next track"
      >
        ⏭
      </button>
    </motion.div>
  );
}
