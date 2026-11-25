// src/pages/apps/musicplayer.js

import { useEffect, useRef, useState } from 'react';
import {
  useMusic,
  isAudioFile,
  MAX_AUDIO_UPLOAD_BYTES,
} from '@/context/MusicContext';
import { useTheme } from '@/context/ThemeContext';

const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Bonus: Web Audio API visualiser driven by the global analyser node.
 * Falls back to a gentle idle animation when the analyser is unavailable.
 */
function Visualiser({ isPlaying, getAnalyser }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = getAnalyser();
    const dataArray = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : null;
    let t = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const bars = 32;
      const barWidth = width / bars;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        t += 0.03;
      }

      for (let i = 0; i < bars; i++) {
        let value;
        if (analyser && isPlaying) {
          value = dataArray[i % dataArray.length] / 255;
        } else {
          // Idle fallback wave
          value = isPlaying
            ? 0.2
            : 0.08 + 0.05 * Math.abs(Math.sin(t + i * 0.4));
        }
        const barHeight = Math.max(2, value * height * 0.9);
        const hue = 260 - (i / bars) * 60;
        ctx.fillStyle = `hsl(${hue}, 80%, 65%)`;
        ctx.beginPath();
        ctx.roundRect(
          i * barWidth + barWidth * 0.2,
          height - barHeight,
          barWidth * 0.6,
          barHeight,
          2,
        );
        ctx.fill();
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, getAnalyser]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={80}
      className="w-full h-20 rounded-lg"
      aria-hidden="true"
    />
  );
}

/**
 * "My Files" tab: lists audio files from the user's files (/api/files,
 * audio mime types) so they can be added to the playlist, and uploads
 * local audio files into the user's files.
 */
function LibraryPanel({ theme }) {
  const { addTrack, playlist } = useMusic();
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const scanFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/files?meta=1');
      if (!res.ok) throw new Error('Failed to load your files');
      const data = await res.json();
      setFiles((data.files || []).filter(isAudioFile));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanFiles();
  }, []);

  const addFileTrack = (file) => {
    addTrack({
      id: `file-${file._id}`,
      title: (file.name || 'Untitled').replace(/\.[^/.]+$/, ''),
      artist: 'My Files',
      album: 'OrbitOS Files',
      src: `/api/files/${file._id}`,
    });
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!isAudioFile({ name: file.name, mimeType: file.type })) {
      setError('Please choose an audio file (mp3, wav, ogg, m4a, flac…).');
      return;
    }
    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      setError(
        `"${file.name}" is too large. The maximum upload size is ${
          MAX_AUDIO_UPLOAD_BYTES / (1024 * 1024)
        } MB.`,
      );
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            content: e.target.result,
            mimeType: file.type || 'audio/mpeg',
          }),
        });
        if (!res.ok) {
          throw new Error(
            res.status === 413
              ? 'Upload failed: the file is too large.'
              : 'Upload failed',
          );
        }
        const data = await res.json();
        addFileTrack(data.file);
        scanFiles();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`px-3 py-1.5 rounded-lg text-sm ${theme.app.button}`}
        >
          ⬆️ Upload audio
        </button>
        <button
          onClick={scanFiles}
          className={`px-3 py-1.5 rounded-lg text-sm ${theme.app.button}`}
        >
          ↻ Refresh
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleUpload}
          aria-label="Upload audio file"
        />
      </div>
      {error && (
        <div
          className="mb-2 px-3 py-2 rounded-lg bg-red-500/15 text-red-600 text-xs"
          role="alert"
        >
          {error}
        </div>
      )}
      <div
        className={`flex-1 min-h-0 rounded-xl border ${theme.app.table} overflow-y-auto`}
      >
        {loading ? (
          <div className={`px-3 py-4 text-sm ${theme.app.text_subtle}`}>
            Scanning your files…
          </div>
        ) : !files || files.length === 0 ? (
          <div className={`px-3 py-4 text-sm ${theme.app.text_subtle}`}>
            No audio files found. Upload one to get started.
          </div>
        ) : (
          files.map((file) => {
            const added = playlist.some((t) => t.id === `file-${file._id}`);
            return (
              <div
                key={file._id}
                className="w-full flex items-center space-x-3 px-3 py-2"
              >
                <span className="text-lg">🎧</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {file.name}
                  </span>
                  <span
                    className={`block text-xs ${theme.app.text_subtle} truncate`}
                  >
                    {file.mimeType || 'audio'}
                  </span>
                </span>
                <button
                  onClick={() => addFileTrack(file)}
                  disabled={added}
                  className={`px-2 py-1 rounded text-xs ${theme.app.button} disabled:opacity-50`}
                >
                  {added ? 'Added ✓' : '+ Add'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MusicPlayer() {
  const {
    playlist,
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    error,
    togglePlay,
    playTrack,
    next,
    previous,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    getAnalyser,
  } = useMusic();
  const { theme } = useTheme();
  const [tab, setTab] = useState('playlist');

  const repeatIcon = repeat === 'one' ? '🔂' : '🔁';
  const repeatActive = repeat !== 'off';

  return (
    <div
      className={`flex flex-col h-full ${theme.app.bg} ${theme.app.text} p-4 select-none`}
    >
      {/* Now playing */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-4xl shadow-lg shrink-0">
          🎷
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold truncate">
            {currentTrack?.title || 'Nothing playing'}
          </div>
          <div className={`text-sm ${theme.app.text_subtle} truncate`}>
            {currentTrack?.artist || '—'}
          </div>
          <div className={`text-xs ${theme.app.text_subtle} truncate`}>
            {currentTrack?.album || ''}
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mb-3 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-600 text-xs"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Visualiser */}
      <Visualiser isPlaying={isPlaying} getAnalyser={getAnalyser} />

      {/* Seek bar */}
      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="w-full accent-purple-500"
          aria-label="Seek"
        />
        <div
          className={`flex justify-between text-xs ${theme.app.text_subtle}`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center space-x-6 my-3 text-2xl">
        <button
          onClick={toggleShuffle}
          className={`text-lg ${shuffle ? 'text-purple-500' : theme.app.text_subtle} hover:scale-110 transition-transform`}
          title="Shuffle"
          aria-label="Shuffle"
          aria-pressed={shuffle}
        >
          🔀
        </button>
        <button
          onClick={previous}
          className="hover:scale-110 transition-transform"
          title="Previous"
          aria-label="Previous track"
        >
          ⏮️
        </button>
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition-transform"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button
          onClick={next}
          className="hover:scale-110 transition-transform"
          title="Next"
          aria-label="Next track"
        >
          ⏭️
        </button>
        <button
          onClick={cycleRepeat}
          className={`text-lg ${repeatActive ? 'text-purple-500' : theme.app.text_subtle} hover:scale-110 transition-transform`}
          title={`Repeat: ${repeat}`}
          aria-label={`Repeat mode ${repeat}`}
        >
          {repeatIcon}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={toggleMute}
          className="text-lg"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 accent-purple-500"
          aria-label="Volume"
        />
      </div>

      {/* Playlist / My Files tabs */}
      <div className="flex space-x-1 mb-2">
        {[
          { id: 'playlist', label: 'Playlist' },
          { id: 'library', label: 'My Files' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-purple-600 text-white' : `${theme.app.button}`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' ? (
        <LibraryPanel theme={theme} />
      ) : (
        <div
          className={`flex-1 min-h-0 rounded-xl border ${theme.app.table} overflow-y-auto`}
        >
          <div
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${theme.app.tableHeader}`}
          >
            Playlist
          </div>
          {playlist.length === 0 && (
            <div className={`px-3 py-4 text-sm ${theme.app.text_subtle}`}>
              Your playlist is empty. Open <strong>My Files</strong> to upload
              audio or add tracks you already have.
            </div>
          )}
          {playlist.map((track, index) => {
            const isCurrent = index === currentIndex;
            return (
              <button
                key={track.id}
                onClick={() => playTrack(index)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left transition-colors ${
                  isCurrent
                    ? 'bg-purple-500/15 text-purple-600'
                    : theme.app.dropdown_item_hover
                }`}
              >
                <span className="text-lg">
                  {isCurrent && isPlaying ? '🎶' : '🎵'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {track.title}
                  </span>
                  <span
                    className={`block text-xs ${theme.app.text_subtle} truncate`}
                  >
                    {track.artist}
                  </span>
                </span>
                {isCurrent && (
                  <span className="text-xs text-purple-500 font-semibold">
                    Now playing
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
