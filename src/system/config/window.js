/**
 * @fileoverview Window configuration constants
 */

export const TASKBAR_HEIGHT = 64;
export const SNAP_THRESHOLD = 1; // pixels

export const DEFAULT_WINDOW_SIZE = { width: 600, height: 400 };
export const DEFAULT_WINDOW_POSITION = { x: 100, y: 100 };

export const DEFAULT_CONSTRAINTS = {
  minSize: { width: 200, height: 150 },
  // Sensible viewport-based max; components may override
  get maxSize() {
    return { width: window.innerWidth - 50, height: window.innerHeight - 100 };
  },
};
