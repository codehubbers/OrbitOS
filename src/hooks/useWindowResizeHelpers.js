/**
 * @fileoverview Window Resize Helpers - Utility functions for window resizing
 *
 * This module contains helper functions and utilities for window resize operations.
 * Extracted from useWindowResize hook to keep components under 200 lines.
 */

import ResizeStrategyRegistry from '@/system/services/ResizeStrategies';

/**
 * @typedef {Object} WindowDimensions
 * @property {number} width - Window width in pixels
 * @property {number} height - Window height in pixels
 */

/**
 * @typedef {Object} WindowPosition
 * @property {number} x - Window X position in pixels
 * @property {number} y - Window Y position in pixels
 */

/**
 * @typedef {Object} WindowConstraints
 * @property {WindowDimensions} minSize - Minimum window size
 * @property {WindowDimensions} maxSize - Maximum window size
 */

/**
 * @typedef {Object} ResizeState
 * @property {WindowDimensions} size - Current window size
 * @property {WindowPosition} position - Current window position
 * @property {boolean} isResizing - Whether window is currently being resized
 * @property {string|null} resizeDirection - Current resize direction
 */

/**
 * Get current window bounds for collision detection
 * @param {WindowPosition} position - Window position
 * @param {WindowDimensions} size - Window size
 * @returns {Object} Window bounds {left, top, right, bottom}
 */
export const getWindowBounds = (position, size) => {
  return {
    left: position.x,
    top: position.y,
    right: position.x + size.width,
    bottom: position.y + size.height,
  };
};

/**
 * Check if window is within screen bounds
 * @param {WindowPosition} position - Window position
 * @param {WindowDimensions} size - Window size
 * @param {Object} screenBounds - Screen bounds {width, height}
 * @returns {boolean} True if window is within screen bounds
 */
export const isWithinScreenBounds = (position, size, screenBounds) => {
  const bounds = getWindowBounds(position, size);
  return (
    bounds.left >= 0 &&
    bounds.top >= 0 &&
    bounds.right <= screenBounds.width &&
    bounds.bottom <= screenBounds.height
  );
};

/**
 * Calculate new window state based on resize parameters
 * @param {string} direction - Resize direction
 * @param {number} deltaX - Mouse movement delta in X direction
 * @param {number} deltaY - Mouse movement delta in Y direction
 * @param {WindowDimensions} currentSize - Current window size
 * @param {WindowPosition} currentPosition - Current window position
 * @param {WindowConstraints} constraints - Size constraints
 * @returns {Object} New window state {size, position}
 */
export const calculateResizeState = (
  direction,
  deltaX,
  deltaY,
  currentSize,
  currentPosition,
  constraints,
) => {
  try {
    const strategy = ResizeStrategyRegistry.getStrategy(direction);
    return strategy.calculate({
      deltaX,
      deltaY,
      currentSize,
      currentPosition,
      minSize: constraints.minSize,
      maxSize: constraints.maxSize,
    });
  } catch (error) {
    console.warn(
      `Error calculating resize state for direction ${direction}:`,
      error,
    );
    return { size: currentSize, position: currentPosition };
  }
};

/**
 * Validate resize direction
 * @param {string} direction - Resize direction to validate
 * @returns {boolean} True if direction is valid
 */
export const isValidResizeDirection = (direction) => {
  return ResizeStrategyRegistry.getAvailableDirections().includes(direction);
};

/**
 * Get available resize directions
 * @returns {string[]} Array of available directions
 */
export const getAvailableResizeDirections = () => {
  return ResizeStrategyRegistry.getAvailableDirections();
};

/**
 * Default window constraints
 */
export const DEFAULT_CONSTRAINTS = {
  minSize: { width: 200, height: 150 },
  maxSize: { width: 1200, height: 800 },
};

/**
 * Default window size
 */
export const DEFAULT_WINDOW_SIZE = { width: 600, height: 400 };

/**
 * Default window position
 */
export const DEFAULT_WINDOW_POSITION = { x: 100, y: 100 };
