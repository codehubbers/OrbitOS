/**
 * @fileoverview ResizeHandle Component - Individual resize handle for window resizing
 *
 * This component renders a single resize handle that allows users to resize windows
 * from a specific direction. It provides visual feedback and handles mouse events
 * for resize operations.
 *
 * Features:
 * - Visual resize handle with appropriate cursor
 * - Mouse event handling for resize operations
 * - Hover effects and visual feedback
 * - Accessibility support
 * - Performance optimized with proper event handling
 */

import React, { memo } from 'react';

/**
 * @typedef {Object} ResizeHandleProps
 * @property {string} direction - Resize direction (e.g., 'top-left', 'bottom-right')
 * @property {Function} onMouseDown - Mouse down event handler
 * @property {boolean} [disabled=false] - Whether the handle is disabled
 * @property {string} [className=''] - Additional CSS classes
 * @property {Object} [style={}] - Additional inline styles
 */

/**
 * ResizeHandle component for window resizing
 *
 * @param {ResizeHandleProps} props - Component props
 * @returns {JSX.Element} ResizeHandle component
 */
const ResizeHandle = ({
  direction,
  onMouseDown,
  disabled = false,
  className = '',
  style = {},
}) => {
  /**
   * Get the appropriate cursor style for the resize direction
   * @param {string} direction - Resize direction
   * @returns {string} CSS cursor value
   */
  const getCursor = (direction) => {
    const cursorMap = {
      'top-left': 'nw-resize',
      'top-right': 'ne-resize',
      'bottom-left': 'sw-resize',
      'bottom-right': 'se-resize',
      top: 'n-resize',
      bottom: 's-resize',
      left: 'w-resize',
      right: 'e-resize',
    };
    return cursorMap[direction] || 'default';
  };

  /**
   * Get the appropriate CSS classes for the resize direction
   * @param {string} direction - Resize direction
   * @returns {string} CSS class string
   */
  const getHandleClasses = (direction) => {
    const baseClasses =
      'absolute bg-blue-500/10 hover:bg-blue-500/30 transition-colors duration-150 border border-blue-500/20';
    const sizeClasses = {
      'top-left': 'w-4 h-4 top-0 left-0 cursor-nw-resize',
      'top-right': 'w-4 h-4 top-0 right-0 cursor-ne-resize',
      'bottom-left': 'w-4 h-4 bottom-0 left-0 cursor-sw-resize',
      'bottom-right': 'w-4 h-4 bottom-0 right-0 cursor-se-resize',
      top: 'h-1.5 top-0 left-0 right-0 cursor-n-resize',
      bottom: 'h-1.5 bottom-0 left-0 right-0 cursor-s-resize',
      left: 'w-1.5 left-0 top-0 bottom-0 cursor-w-resize',
      right: 'w-1.5 right-0 top-0 bottom-0 cursor-e-resize',
    };

    return `${baseClasses} ${sizeClasses[direction] || ''}`;
  };

  /**
   * Handle mouse down event
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseDown = (event) => {
    if (disabled) return;

    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();

    // Call the parent handler
    if (onMouseDown) {
      onMouseDown(direction, event);
    }
  };

  /**
   * Handle mouse enter event for visual feedback
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseEnter = (event) => {
    if (disabled) return;

    // Add visual feedback
    event.target.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
  };

  /**
   * Handle mouse leave event
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseLeave = (event) => {
    if (disabled) return;

    // Remove visual feedback
    event.target.style.backgroundColor = 'transparent';
  };

  return (
    <div
      className={`${getHandleClasses(direction)} ${className} pointer-events-auto`}
      style={{
        cursor: getCursor(direction),
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Resize window from ${direction}`}
      aria-disabled={disabled}
      data-direction={direction}
      data-testid={`resize-handle-${direction}`}
    />
  );
};

export default memo(ResizeHandle);
