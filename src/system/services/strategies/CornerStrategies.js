/**
 * @fileoverview Corner Resize Strategies - Corner resize implementations
 *
 * This module contains resize strategies for corner-based resizing operations.
 */

import BaseResizeStrategy from './BaseResizeStrategy';

/**
 * Strategy for resizing from the top-left corner
 */
export class TopLeftResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaX, deltaY, currentSize, currentPosition, minSize, maxSize } =
      params;

    const newSize = {
      width: currentSize.width - deltaX,
      height: currentSize.height - deltaY,
    };

    const newPosition = {
      x: currentPosition.x + deltaX,
      y: currentPosition.y + deltaY,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}

/**
 * Strategy for resizing from the top-right corner
 */
export class TopRightResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaX, deltaY, currentSize, currentPosition, minSize, maxSize } =
      params;

    const newSize = {
      width: currentSize.width + deltaX,
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
 * Strategy for resizing from the bottom-left corner
 */
export class BottomLeftResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaX, deltaY, currentSize, currentPosition, minSize, maxSize } =
      params;

    const newSize = {
      width: currentSize.width - deltaX,
      height: currentSize.height + deltaY,
    };

    const newPosition = {
      x: currentPosition.x + deltaX,
      y: currentPosition.y,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}

/**
 * Strategy for resizing from the bottom-right corner
 */
export class BottomRightResizeStrategy extends BaseResizeStrategy {
  calculate(params) {
    const { deltaX, deltaY, currentSize, currentPosition, minSize, maxSize } =
      params;

    const newSize = {
      width: currentSize.width + deltaX,
      height: currentSize.height + deltaY,
    };

    const newPosition = {
      x: currentPosition.x,
      y: currentPosition.y,
    };

    return this.constrain(newSize, newPosition, minSize, maxSize);
  }
}
