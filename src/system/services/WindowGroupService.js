/**
 * @fileoverview Window Group Service - Manages window grouping operations
 *
 * Provides window grouping functionality using Strategy Pattern,
 * similar to SnapService and ResizeStrategies architecture.
 */

class WindowGroupService {
  constructor() {
    this.DEFAULT_GROUP_THRESHOLD = 50; // pixels
    this.DEFAULT_GROUP_OFFSET = 10; // pixels
  }

  /**
   * Detect if two windows should be grouped
   * @param {Object} window1 - First window {id, position, size}
   * @param {Object} window2 - Second window {id, position, size}
   * @param {Object} options - Options {threshold, offset}
   * @returns {boolean} True if windows should be grouped
   */
  shouldGroupWindows(window1, window2, options = {}) {
    const threshold = options.threshold ?? this.DEFAULT_GROUP_THRESHOLD;
    const offset = options.offset ?? this.DEFAULT_GROUP_OFFSET;

    // Calculate distance between window centers
    const center1 = {
      x: window1.position.x + window1.size.width / 2,
      y: window1.position.y + window1.size.height / 2,
    };
    const center2 = {
      x: window2.position.x + window2.size.width / 2,
      y: window2.position.y + window2.size.height / 2,
    };

    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2),
    );

    return distance <= threshold;
  }

  /**
   * Calculate group layout for multiple windows
   * @param {Array} windows - Array of window objects
   * @param {Object} options - Layout options
   * @returns {Object} Group layout {position, size, windows}
   */
  calculateGroupLayout(windows, options = {}) {
    if (windows.length === 0) return null;
    if (windows.length === 1) {
      // For single window, use default position/size if not available
      const window = windows[0];
      return {
        position: window.position || { x: 100, y: 100 },
        size: window.size || { width: 600, height: 400 },
        windows,
      };
    }

    const offset = options.offset ?? this.DEFAULT_GROUP_OFFSET;

    // Calculate bounding box with fallback values
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    windows.forEach((window, index) => {
      // Use default position/size if not available
      const position = window.position || {
        x: 100 + index * 50,
        y: 100 + index * 50,
      };
      const size = window.size || { width: 600, height: 400 };

      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + size.width);
      maxY = Math.max(maxY, position.y + size.height);
    });

    return {
      position: { x: minX - offset, y: minY - offset },
      size: {
        width: maxX - minX + offset * 2,
        height: maxY - minY + offset * 2,
      },
      windows: windows,
    };
  }

  /**
   * Arrange windows in a group formation
   * @param {Array} windows - Array of window objects
   * @param {string} formation - 'cascade', 'tile', 'stack'
   * @param {Object} options - Formation options
   * @returns {Array} Array of window positions
   */
  arrangeWindowsInGroup(windows, formation = 'cascade', options = {}) {
    const offset = options.offset ?? this.DEFAULT_GROUP_OFFSET;
    const basePosition = options.basePosition || { x: 100, y: 100 };

    switch (formation) {
      case 'cascade':
        return this.arrangeCascade(windows, basePosition, offset);
      case 'tile':
        return this.arrangeTile(windows, basePosition, offset);
      case 'stack':
        return this.arrangeStack(windows, basePosition, offset);
      default:
        return this.arrangeCascade(windows, basePosition, offset);
    }
  }

  /**
   * Arrange windows in cascade formation
   * @private
   */
  arrangeCascade(windows, basePosition, offset) {
    return windows.map((window, index) => ({
      ...window,
      position: {
        x: basePosition.x + index * offset,
        y: basePosition.y + index * offset,
      },
      size: window.size || { width: 600, height: 400 },
    }));
  }

  /**
   * Arrange windows in tile formation
   * @private
   */
  arrangeTile(windows, basePosition, offset) {
    const cols = Math.ceil(Math.sqrt(windows.length));
    const rows = Math.ceil(windows.length / cols);
    const tileWidth = 300;
    const tileHeight = 200;

    return windows.map((window, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      return {
        ...window,
        position: {
          x: basePosition.x + col * (tileWidth + offset),
          y: basePosition.y + row * (tileHeight + offset),
        },
        size: { width: tileWidth, height: tileHeight },
      };
    });
  }

  /**
   * Arrange windows in stack formation
   * @private
   */
  arrangeStack(windows, basePosition, offset) {
    return windows.map((window, index) => ({
      ...window,
      position: {
        x: basePosition.x + index * offset,
        y: basePosition.y,
      },
      size: window.size || { width: 600, height: 400 },
    }));
  }
}

export default new WindowGroupService();
