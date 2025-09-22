/**
 * @fileoverview Base Resize Strategy - Base class for all resize strategies
 *
 * This module contains the base class for all resize strategies implementing
 * the Strategy Pattern for window resizing operations.
 */

/**
 * Base class for all resize strategies
 * Implements the Strategy Pattern interface
 */
export default class BaseResizeStrategy {
  /**
   * Calculates new window state based on resize parameters
   * @param {Object} params - Resize parameters
   * @returns {Object} New window state
   */
  calculate(params) {
    throw new Error('calculate method must be implemented by subclass');
  }

  /**
   * Validates and constrains the calculated size and position
   * @param {Object} size - Calculated size {width, height}
   * @param {Object} position - Calculated position {x, y}
   * @param {Object} minSize - Minimum size constraints
   * @param {Object} maxSize - Maximum size constraints
   * @returns {Object} Constrained window state
   */
  constrain(size, position, minSize, maxSize) {
    const constrainedSize = {
      width: Math.max(minSize.width, Math.min(maxSize.width, size.width)),
      height: Math.max(minSize.height, Math.min(maxSize.height, size.height)),
    };

    const constrainedPosition = {
      x: Math.max(0, position.x),
      y: Math.max(0, position.y),
    };

    return {
      size: constrainedSize,
      position: constrainedPosition,
    };
  }
}
