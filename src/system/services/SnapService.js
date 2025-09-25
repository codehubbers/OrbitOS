/**
 * @fileoverview Snap Service - Strategy-based snap-to-edge computation
 *
 * Provides region detection and layout computation using a Strategy Pattern,
 * mirroring the structure used for resize strategies.
 */

import SnapStrategyRegistry from './strategies/SnapStrategies';

class SnapService {
  constructor() {
    this.DEFAULT_TASKBAR_HEIGHT = 64;
    this.DEFAULT_THRESHOLD = 32;
  }

  /**
   * Detect snap region based on current window position/size
   * @param {{x:number,y:number}} position
   * @param {{width:number,height:number}} size
   * @param {{threshold?:number, taskbarHeight?:number}} [options]
   * @returns {('top'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right'|null)}
   */
  getRegion(position, size, options = {}) {
    const threshold = options.threshold ?? this.DEFAULT_THRESHOLD;
    const taskbarHeight = options.taskbarHeight ?? this.DEFAULT_TASKBAR_HEIGHT;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const usableHeight = viewportHeight - taskbarHeight;

    const nearLeft = position.x <= threshold;
    const nearRight =
      Math.abs(position.x + size.width - viewportWidth) <= threshold;
    const nearTop = position.y <= threshold;
    const nearBottom =
      Math.abs(position.y + size.height - usableHeight) <= threshold;

    // Corners first (quarters)
    if (nearTop && nearLeft) return 'top-left';
    if (nearTop && nearRight) return 'top-right';
    if (nearBottom && nearLeft) return 'bottom-left';
    if (nearBottom && nearRight) return 'bottom-right';

    // Edges
    if (nearTop) return 'top';
    if (nearLeft) return 'left';
    if (nearRight) return 'right';

    return null;
  }

  /**
   * Compute snap layout for a given region using strategies
   * @param {string} region
   * @param {{taskbarHeight?:number}} [options]
   * @returns {{maximize?:boolean,size?:{width:number,height:number},position?:{x:number,y:number}}|null}
   */
  getLayout(region, options = {}) {
    const taskbarHeight = options.taskbarHeight ?? this.DEFAULT_TASKBAR_HEIGHT;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    try {
      const strategy = SnapStrategyRegistry.getStrategy(region);
      return strategy.computeLayout({
        viewportWidth,
        viewportHeight,
        taskbarHeight,
      });
    } catch (e) {
      console.warn(`SnapService: no strategy for region '${region}'`, e);
      return null;
    }
  }

  /**
   * Compute preview layout directly from position/size
   * Resolves maximize to a concrete rect (viewport minus taskbar)
   * @param {{x:number,y:number}} position
   * @param {{width:number,height:number}} size
   * @param {{threshold?:number, taskbarHeight?:number}} [options]
   * @returns {{size:{width:number,height:number},position:{x:number,y:number}}|null}
   */
  getPreviewLayout(position, size, options = {}) {
    const region = this.getRegion(position, size, options);
    if (!region) return null;
    const layout = this.getLayout(region, options);
    if (!layout) return null;
    if (layout.maximize) {
      const taskbarHeight =
        options.taskbarHeight ?? this.DEFAULT_TASKBAR_HEIGHT;
      return {
        size: {
          width: window.innerWidth,
          height: window.innerHeight - taskbarHeight,
        },
        position: { x: 0, y: 0 },
      };
    }
    if (layout.size && layout.position) return layout;
    return null;
  }

  /**
   * Get list of supported regions
   * @returns {string[]}
   */
  getAvailableRegions() {
    return SnapStrategyRegistry.getAvailableRegions();
  }
}

export default new SnapService();
