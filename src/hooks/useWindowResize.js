/**
 * @fileoverview useWindowResize Hook - Custom hook for window resize functionality
 *
 * Manages window resizing operations using Strategy Pattern with local state
 * for performance and global context integration for synchronization.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  calculateResizeState,
  isValidResizeDirection,
  getAvailableResizeDirections,
  DEFAULT_CONSTRAINTS,
  DEFAULT_WINDOW_SIZE,
  DEFAULT_WINDOW_POSITION,
} from './useWindowResizeHelpers';

/**
 * Custom hook for managing window resize functionality
 * @param {Object} initialConfig - Initial configuration
 * @returns {Object} Resize state and control functions
 */
export const useWindowResize = ({
  size: initialSize = DEFAULT_WINDOW_SIZE,
  position: initialPosition = DEFAULT_WINDOW_POSITION,
  constraints = DEFAULT_CONSTRAINTS,
  onResize = null,
  onResizeStart = null,
  onResizeEnd = null,
}) => {
  // Local state for resize operations
  const [resizeState, setResizeState] = useState({
    size: initialSize,
    position: initialPosition,
    isResizing: false,
    resizeDirection: null,
  });

  // Refs for tracking resize operations
  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startSize: { width: 0, height: 0 },
    startPosition: { x: 0, y: 0 },
    lastUpdateTime: 0,
  });

  // Debounce timer for context updates
  const debounceTimer = useRef(null);

  /** Start resize operation */
  const startResize = useCallback(
    (direction, event) => {
      // Validate direction
      if (!isValidResizeDirection(direction)) {
        console.warn(`Invalid resize direction: ${direction}`);
        return;
      }

      // Store initial values
      resizeRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startSize: { ...resizeState.size },
        startPosition: { ...resizeState.position },
        lastUpdateTime: Date.now(),
        isResizing: true,
        resizeDirection: direction,
      };

      // Update state
      setResizeState((prev) => ({
        ...prev,
        isResizing: true,
        resizeDirection: direction,
      }));
      // Callback
      if (onResizeStart) {
        onResizeStart(direction, event);
      }
    },
    [resizeState.size, resizeState.position, onResizeStart],
  );

  /** Handle resize operation during mouse move */
  const handleResize = useCallback(
    (event) => {
      // Check if we're currently resizing using ref to avoid stale closure
      if (!resizeRef.current.isResizing || !resizeRef.current.resizeDirection) {
        return;
      }

      // Calculate deltas
      const deltaX = event.clientX - resizeRef.current.startX;
      const deltaY = event.clientY - resizeRef.current.startY;

      // Calculate new state using helper
      const newState = calculateResizeState(
        resizeRef.current.resizeDirection,
        deltaX,
        deltaY,
        resizeRef.current.startSize,
        resizeRef.current.startPosition,
        constraints,
      );
      // Update local state
      setResizeState((prev) => ({
        ...prev,
        size: newState.size,
        position: newState.position,
      }));

      // Debounced callback for performance
      if (onResize) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          onResize(newState, resizeRef.current.resizeDirection);
        }, 16); // ~60fps
      }
    },
    [constraints, onResize],
  );

  /** End resize operation */
  const endResize = useCallback(
    (event) => {
      if (!resizeRef.current.isResizing) {
        return;
      }

      // Clear debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      // Update ref
      resizeRef.current.isResizing = false;
      resizeRef.current.resizeDirection = null;

      // Update state
      setResizeState((prev) => ({
        ...prev,
        isResizing: false,
        resizeDirection: null,
      }));
      // Callback
      if (onResizeEnd) {
        onResizeEnd(
          {
            size: resizeState.size,
            position: resizeState.position,
          },
          event,
        );
      }
    },
    [resizeState.size, resizeState.position, onResizeEnd],
  );

  /** Update window size and position */
  const updateWindow = useCallback((newSize, newPosition) => {
    setResizeState((prev) => ({
      ...prev,
      size: newSize || prev.size,
      position: newPosition || prev.position,
    }));
  }, []);

  /** Reset window to initial state */
  const resetWindow = useCallback(() => {
    setResizeState({
      size: initialSize,
      position: initialPosition,
      isResizing: false,
      resizeDirection: null,
    });
  }, [initialSize, initialPosition]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    // State
    size: resizeState.size,
    position: resizeState.position,
    isResizing: resizeState.isResizing,
    resizeDirection: resizeState.resizeDirection,

    // Actions
    startResize,
    handleResize,
    endResize,
    updateWindow,
    resetWindow,

    // Constants
    constraints,
    availableDirections: getAvailableResizeDirections(),
  };
};

export default useWindowResize;
