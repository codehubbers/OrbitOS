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
      'absolute bg-blue-500/20 hover:bg-blue-500/40 transition-colors duration-150 border-2 border-blue-500/40 pointer-events-auto z-50';
    const sizeClasses = {
      'top-left': 'w-6 h-6 top-0 left-0',
      'top-right': 'w-6 h-6 top-0 right-0',
      'bottom-left': 'w-6 h-6 bottom-0 left-0',
      'bottom-right': 'w-6 h-6 bottom-0 right-0',
      top: 'h-2 top-0 left-0 right-0',
      bottom: 'h-2 bottom-0 left-0 right-0',
      left: 'w-2 left-0 top-0 bottom-0',
      right: 'w-2 right-0 top-0 bottom-0',
    };

    return `${baseClasses} ${sizeClasses[direction] || ''}`;
  };

  /**
   * Handle mouse down event
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseDown = (event) => {
    console.log(
      'ResizeHandle: Mouse down on',
      direction,
      'disabled:',
      disabled,
    );

    if (disabled) return;

    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();

    // Call the parent handler
    if (onMouseDown) {
      console.log('ResizeHandle: Calling onMouseDown for', direction);
      onMouseDown(direction, event);
    } else {
      console.log('ResizeHandle: No onMouseDown handler provided');
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        cursor: getCursor(direction),
        backgroundColor: 'transparent',
        border: 'none',
        zIndex:
          direction.includes('top') ||
          direction.includes('bottom') ||
          direction.includes('left') ||
          direction.includes('right')
            ? 9990
            : 9999,
        pointerEvents: 'auto',
        // Corner handles - fixed size
        ...(direction.includes('top') &&
          direction.includes('left') && {
            top: '0',
            left: '0',
            width: '0.7rem',
            height: '0.7rem',
          }),
        ...(direction.includes('top') &&
          direction.includes('right') && {
            top: '0',
            right: '0',
            width: '0.7rem',
            height: '0.7rem',
          }),
        ...(direction.includes('bottom') &&
          direction.includes('left') && {
            bottom: '0',
            left: '0',
            width: '0.7rem',
            height: '0.7rem',
          }),
        ...(direction.includes('bottom') &&
          direction.includes('right') && {
            bottom: '0',
            right: '0',
            width: '0.7rem',
            height: '0.7rem',
          }),
        // Edge handles - full width/height
        ...(direction === 'top' && {
          top: '0',
          left: '0.7rem',
          right: '0.7rem',
          height: '0.5rem',
        }),
        ...(direction === 'bottom' && {
          bottom: '0',
          left: '0.7rem',
          right: '0.7rem',
          height: '0.5rem',
        }),
        ...(direction === 'left' && {
          left: '0',
          top: '0.7rem',
          bottom: '0.7rem',
          width: '0.5rem',
        }),
        ...(direction === 'right' && {
          right: '0',
          top: '0.7rem',
          bottom: '0.7rem',
          width: '0.5rem',
        }),
        ...style,
      }}
      onMouseDown={handleMouseDown}
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
