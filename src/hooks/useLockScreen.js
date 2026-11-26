// Lock screen state (#98).
//
// - lock() / unlock()
// - Ctrl+Alt+L locks (browsers can't see Win+L: the OS handles it first)
// - The locked state is kept in sessionStorage, so reloading the tab
//   doesn't skip the lock screen.
//
// TODO(#98, help wanted): idle timeout. Lock after N minutes without
// mouse/keyboard/touch activity, N from Settings (default 10, "Never" allowed).

import { useCallback, useEffect, useState } from 'react';

export const LOCK_STORAGE_KEY = 'orbitos-locked';

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

export default function useLockScreen({ enabled = true } = {}) {
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

  return { locked, lock, unlock };
}
