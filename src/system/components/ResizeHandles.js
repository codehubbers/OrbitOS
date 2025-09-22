/**
 * @fileoverview ResizeHandles Component - Container for all window resize handles
 *
 * This component renders all resize handles for a window, providing a complete
 * resize interface. It manages the collection of individual resize handles
 * and coordinates their interactions.
 *
 * Features:
 * - Renders all 8 resize handles (corners + edges)
 * - Manages resize handle visibility and state
 * - Coordinates resize operations
 * - Provides consistent styling and behavior
 * - Performance optimized with proper event handling
 */

import React, { memo } from 'react';
import ResizeHandle from './ResizeHandle';

/**
 * @typedef {Object} ResizeHandlesProps
 * @property {Function} onResizeStart - Resize start event handler
 * @property {boolean} [disabled=false] - Whether resize handles are disabled
 * @property {boolean} [showHandles=true] - Whether to show resize handles
 * @property {Array<string>} [enabledDirections] - Array of enabled resize directions
 * @property {string} [className=''] - Additional CSS classes
 * @property {Object} [style={}] - Additional inline styles
 */

/**
 * ResizeHandles component for window resizing
 *
 * @param {ResizeHandlesProps} props - Component props
 * @returns {JSX.Element} ResizeHandles component
 */
const ResizeHandles = ({
  onResizeStart,
  disabled = false,
  showHandles = true,
  enabledDirections = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top',
    'bottom',
    'left',
    'right',
  ],
  className = '',
  style = {},
}) => {
  /**
   * Handle resize start event
   * @param {string} direction - Resize direction
   * @param {MouseEvent} event - Mouse event
   */
  const handleResizeStart = (direction, event) => {
    if (disabled || !onResizeStart) return;
    onResizeStart(direction, event);
  };

  // Don't render if handles are disabled or hidden
  if (disabled || !showHandles) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={style}
      data-testid="resize-handles-container"
    >
      {/* Corner handles */}
      {enabledDirections.includes('top-left') && (
        <ResizeHandle
          direction="top-left"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {enabledDirections.includes('top-right') && (
        <ResizeHandle
          direction="top-right"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {enabledDirections.includes('bottom-left') && (
        <ResizeHandle
          direction="bottom-left"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {enabledDirections.includes('bottom-right') && (
        <ResizeHandle
          direction="bottom-right"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {/* Edge handles */}
      {enabledDirections.includes('top') && (
        <ResizeHandle
          direction="top"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {enabledDirections.includes('bottom') && (
        <ResizeHandle
          direction="bottom"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {enabledDirections.includes('left') && (
        <ResizeHandle
          direction="left"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}

      {enabledDirections.includes('right') && (
        <ResizeHandle
          direction="right"
          onMouseDown={handleResizeStart}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default memo(ResizeHandles);
