// Lock screen state (#98).
//
// - lock() / unlock()
// - Ctrl+Alt+L locks (browsers can't see Win+L: the OS handles it first)
// - The locked state is kept in sessionStorage, so reloading the tab
//   doesn't skip the lock screen.
// - Idle timeout: lock after `idleMinutes` without mouse/keyboard/touch
//   activity (from Settings → Security; 0 means "Never"). The countdown
//   pauses while the screen is already locked.

import { useCallback, useEffect, useState } from 'react';

export const LOCK_STORAGE_KEY = 'orbitos-locked';
export const DEFAULT_IDLE_MINUTES = 10;
export const IDLE_ACTIVITY_EVENTS = [
  'pointermove',
  'pointerdown',
  'keydown',
  'touchstart',
  'wheel',
];

const readLocked = () => {
  try {
    return window.sessionStorage.getItem(LOCK_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeLocked = (locked) => {
  try {
    if (locked) window.sessionStorage.setItem(LOCK_STORAGE_KEY, '1');
    else window.sessionStorage.removeItem(LOCK_STORAGE_KEY);
  } catch {
    // Storage blocked (private mode etc.): the lock still works in memory.
  }
};

export const isLockShortcut = (event) =>
  event.ctrlKey &&
  event.altKey &&
  !event.shiftKey &&
  !event.metaKey &&
  event.key?.toLowerCase() === 'l';

export default function useLockScreen({
  enabled = true,
  idleMinutes = DEFAULT_IDLE_MINUTES,
} = {}) {
  const [locked, setLocked] = useState(false);

  // Read after mount so server and client render the same markup.
  useEffect(() => {
    if (enabled && readLocked()) setLocked(true);
  }, [enabled]);

  const lock = useCallback(() => {
    writeLocked(true);
    setLocked(true);
  }, []);

  const unlock = useCallback(() => {
    writeLocked(false);
    setLocked(false);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      if (isLockShortcut(event)) {
        event.preventDefault();
        lock();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, lock]);

  // Idle timeout: lock after `idleMinutes` without activity. Paused while
  // already locked; 0 (or anything non-positive) means "Never".
  useEffect(() => {
    if (!enabled || locked) return undefined;
    const minutes = Number(idleMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return undefined;

    let timer;
    let lastArm = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lock, minutes * 60 * 1000);
    };
    const onActivity = () => {
      // Throttle: pointermove fires constantly, and re-arming a timeout
      // more often than every few seconds buys nothing.
      const now = Date.now();
      if (now - lastArm < 5000) return;
      lastArm = now;
      arm();
    };

    lastArm = Date.now();
    arm();
    IDLE_ACTIVITY_EVENTS.forEach((type) =>
      window.addEventListener(type, onActivity, { passive: true }),
    );
    return () => {
      window.clearTimeout(timer);
      IDLE_ACTIVITY_EVENTS.forEach((type) =>
        window.removeEventListener(type, onActivity),
      );
    };
  }, [enabled, locked, idleMinutes, lock]);

  return { locked, lock, unlock };
}
