/**
 * @fileoverview Resize Strategies Registry - Strategy Pattern registry for window resizing
 *
 * This module provides a registry for all resize strategies implementing
 * the Strategy Pattern for window resizing operations.
 */

import {
  TopLeftResizeStrategy,
  TopRightResizeStrategy,
  BottomLeftResizeStrategy,
  BottomRightResizeStrategy,
} from './strategies/CornerStrategies';

import {
  TopResizeStrategy,
  BottomResizeStrategy,
  LeftResizeStrategy,
  RightResizeStrategy,
} from './strategies/EdgeStrategies';

/**
 * Registry for all resize strategies
 * Implements the Strategy Pattern registry
 */
class ResizeStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  /**
   * Initialize all available resize strategies
   * @private
   */
  initializeStrategies() {
    this.strategies.set('top-left', new TopLeftResizeStrategy());
    this.strategies.set('top-right', new TopRightResizeStrategy());
    this.strategies.set('bottom-left', new BottomLeftResizeStrategy());
    this.strategies.set('bottom-right', new BottomRightResizeStrategy());
    this.strategies.set('top', new TopResizeStrategy());
    this.strategies.set('bottom', new BottomResizeStrategy());
    this.strategies.set('left', new LeftResizeStrategy());
    this.strategies.set('right', new RightResizeStrategy());
  }

  /**
   * Get a resize strategy by direction
   * @param {string} direction - Resize direction
   * @returns {BaseResizeStrategy} Resize strategy instance
   * @throws {Error} If strategy not found
   */
  getStrategy(direction) {
    const strategy = this.strategies.get(direction);
    if (!strategy) {
      throw new Error(`Resize strategy for direction '${direction}' not found`);
    }
    return strategy;
  }

  /**
   * Get all available resize directions
   * @returns {string[]} Array of available directions
   */
  getAvailableDirections() {
    return Array.from(this.strategies.keys());
  }
}

// Export singleton instance
export default new ResizeStrategyRegistry();
