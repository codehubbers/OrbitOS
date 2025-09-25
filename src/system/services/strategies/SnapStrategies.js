/**
 * @fileoverview Snap Strategies - Strategy Registry for snap layouts
 */

class BaseSnapStrategy {
  computeLayout(params) {
    throw new Error('computeLayout must be implemented');
  }
}

class TopSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    return { maximize: true };
  }
}

class LeftSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    return {
      size: {
        width: Math.floor(viewportWidth / 2),
        height: viewportHeight - taskbarHeight,
      },
      position: { x: 0, y: 0 },
    };
  }
}

class RightSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    return {
      size: {
        width: Math.floor(viewportWidth / 2),
        height: viewportHeight - taskbarHeight,
      },
      position: { x: Math.ceil(viewportWidth / 2), y: 0 },
    };
  }
}

class TopLeftSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    const usableHeight = viewportHeight - taskbarHeight;
    return {
      size: {
        width: Math.floor(viewportWidth / 2),
        height: Math.floor(usableHeight / 2),
      },
      position: { x: 0, y: 0 },
    };
  }
}

class TopRightSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    const usableHeight = viewportHeight - taskbarHeight;
    return {
      size: {
        width: Math.ceil(viewportWidth / 2),
        height: Math.floor(usableHeight / 2),
      },
      position: { x: Math.floor(viewportWidth / 2), y: 0 },
    };
  }
}

class BottomLeftSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    const usableHeight = viewportHeight - taskbarHeight;
    return {
      size: {
        width: Math.floor(viewportWidth / 2),
        height: Math.ceil(usableHeight / 2),
      },
      position: { x: 0, y: Math.floor(usableHeight / 2) },
    };
  }
}

class BottomRightSnapStrategy extends BaseSnapStrategy {
  computeLayout({ viewportWidth, viewportHeight, taskbarHeight }) {
    const usableHeight = viewportHeight - taskbarHeight;
    return {
      size: {
        width: Math.ceil(viewportWidth / 2),
        height: Math.ceil(usableHeight / 2),
      },
      position: {
        x: Math.floor(viewportWidth / 2),
        y: Math.floor(usableHeight / 2),
      },
    };
  }
}

class SnapStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this.strategies.set('top', new TopSnapStrategy());
    this.strategies.set('left', new LeftSnapStrategy());
    this.strategies.set('right', new RightSnapStrategy());
    this.strategies.set('top-left', new TopLeftSnapStrategy());
    this.strategies.set('top-right', new TopRightSnapStrategy());
    this.strategies.set('bottom-left', new BottomLeftSnapStrategy());
    this.strategies.set('bottom-right', new BottomRightSnapStrategy());
  }

  getStrategy(region) {
    const s = this.strategies.get(region);
    if (!s) throw new Error(`Snap strategy not found for region '${region}'`);
    return s;
  }

  getAvailableRegions() {
    return Array.from(this.strategies.keys());
  }
}

export default new SnapStrategyRegistry();
