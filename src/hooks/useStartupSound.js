// src/hooks/useStartupSound.js

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export const STARTUP_SOUND_MP3 = '/sounds/orbitos-startup.mp3';
export const STARTUP_SOUND_OGG = '/sounds/orbitos-startup.ogg';

/**
 * Plays the OrbitOS startup sound ("OrbitOS Theme") once per session,
 * but only when the user has explicitly enabled "Play startup sound"
 * in Settings. The preference is off by default and the sound is never
 * autoplayed without that opt-in; if the browser still blocks playback
 * before the first user gesture, playback is retried once on the next
 * interaction.
 */
export default function useStartupSound() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const playedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user?.preferences?.sound?.startupSound !== true) return;
    if (playedRef.current) return;
    playedRef.current = true;

    const audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.volume = 0.8;

    const mp3 = document.createElement('source');
    mp3.src = STARTUP_SOUND_MP3;
    mp3.type = 'audio/mpeg';
    audio.appendChild(mp3);

    const ogg = document.createElement('source');
    ogg.src = STARTUP_SOUND_OGG;
    ogg.type = 'audio/ogg; codecs="vorbis"';
    audio.appendChild(ogg);

    audio.play().catch(() => {
      // Autoplay restrictions: retry once on the next user gesture.
      // Whichever gesture fires first removes BOTH listeners, so the
      // sound can never be restarted by a later stray key press.
      const retry = () => {
        window.removeEventListener('pointerdown', retry);
        window.removeEventListener('keydown', retry);
        audio.play().catch(() => {});
      };
      window.addEventListener('pointerdown', retry);
      window.addEventListener('keydown', retry);
    });
  }, [isLoading, isAuthenticated, user]);
}
