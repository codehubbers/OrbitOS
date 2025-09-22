/**
 * @fileoverview Edge Resize Strategies - Edge resize implementations
 *
 * This module contains resize strategies for edge-based resizing operations.
 */

import BaseResizeStrategy from './BaseResizeStrategy';

/**
 * Strategy for resizing from the top edge
 */
export class TopResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaY, currentSize, currentPosition, minSize, maxSize } = params;

    const newSize = {
      width: currentSize.width,
      height: currentSize.height - deltaY,
    };

    const newPosition = {
      x: currentPosition.x,
      y: currentPosition.y + deltaY,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}

/**
 * Strategy for resizing from the bottom edge
 */
export class BottomResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaY, currentSize, currentPosition, minSize, maxSize } = params;

    const newSize = {
      width: currentSize.width,
      height: currentSize.height + deltaY,
    };

    const newPosition = {
      x: currentPosition.x,
      y: currentPosition.y,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}

/**
 * Strategy for resizing from the left edge
 */
export class LeftResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaX, currentSize, currentPosition, minSize, maxSize } = params;

    const newSize = {
      width: currentSize.width - deltaX,
      height: currentSize.height,
    };

    const newPosition = {
      x: currentPosition.x + deltaX,
      y: currentPosition.y,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}

/**
 * Strategy for resizing from the right edge
 */
export class RightResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaX, currentSize, currentPosition, minSize, maxSize } = params;

    const newSize = {
      width: currentSize.width + deltaX,
      height: currentSize.height,
    };

    const newPosition = {
      x: currentPosition.x,
      y: currentPosition.y,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}
