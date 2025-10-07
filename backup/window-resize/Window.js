/**
 * @fileoverview Window Component - Main window component with resize functionality
 *
 * Renders a draggable and resizable window with modern window management features.
 * Integrates Strategy Pattern for resize operations with complete window experience.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useWindowResize } from '@/hooks/useWindowResize';
import ResizeHandles from '@/system/components/ResizeHandles';

/**
 * Window component with advanced resize functionality
 * @param {Object} props - Component props
 * @returns {JSX.Element} Window component
 */
export default function Window({ app, children }) {
  const { dispatch } = useApp();
  const windowRef = useRef(null);

  // Local state for dragging
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  // Window resize hook with context integration
  const {
    size: resizeSize,
    position: resizePosition,
    isResizing,
    resizeDirection,
    startResize,
    handleResize,
    endResize,
    updateWindow,
  } = useWindowResize({
    size: app.size || { width: 600, height: 400 },
    position: app.position || {
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 100,
    },
    constraints: {
      minSize: { width: 200, height: 150 },
      maxSize: {
        width: window.innerWidth - 50,
        height: window.innerHeight - 100,
      },
    },
    onResize: useCallback(
      (newState, direction) => {
        // Update global context with debounced resize
        dispatch({
          type: 'RESIZE_APP',
          payload: {
            id: app.id,
            size: newState.size,
            position: newState.position,
          },
        });
      },
      [dispatch, app.id],
    ),
    onResizeEnd: useCallback(
      (finalState) => {
        // Final context update when resize ends
        dispatch({
          type: 'RESIZE_APP',
          payload: {
            id: app.id,
            size: finalState.size,
            position: finalState.position,
          },
        });
      },
      [dispatch, app.id],
    ),
  });

  // Memoize size and position to prevent unnecessary re-renders
  const size = useMemo(() => resizeSize, [resizeSize.width, resizeSize.height]);
  const position = useMemo(
    () => resizePosition,
    [resizePosition.x, resizePosition.y],
  );

  /** Handle window drag start */
  const handleMouseDown = (e) => {
    // Don't start drag if resizing
    if (isResizing) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
  };

  /** Handle window drag during mouse move */
  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging && !isResizing) {
        const newPosition = {
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY,
        };

        // Constrain to screen bounds
        const constrainedPosition = {
          x: Math.max(
            0,
            Math.min(newPosition.x, window.innerWidth - size.width),
          ),
          y: Math.max(
            0,
            Math.min(newPosition.y, window.innerHeight - size.height - 64),
          ),
        };

        updateWindow(size, constrainedPosition);
      } else if (isResizing) {
        handleResize(e);
      }
    },
    [
      isDragging,
      isResizing,
      size.width,
      size.height,
      updateWindow,
      handleResize,
    ],
  );

  /** Handle window drag end */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Update context with final position
      dispatch({
        type: 'MOVE_APP',
        payload: {
          id: app.id,
          position: position,
        },
      });
    }
    if (isResizing) {
      endResize();
    }
  }, [
    isDragging,
    isResizing,
    position.x,
    position.y,
    dispatch,
    app.id,
    endResize,
  ]);

  /** Handle window close */
  const handleClose = () => {
    dispatch({ type: 'CLOSE_APP', payload: app.id });
  };

  /** Handle window minimize */
  const handleMinimize = () => {
    dispatch({ type: 'MINIMIZE_APP', payload: app.id });
  };

  /** Handle window maximize/restore */
  const handleMaximize = () => {
    dispatch({ type: 'MAXIMIZE_APP', payload: { id: app.id } });
  };

  /** Handle resize start */
  const handleResizeStart = (direction, event) => {
    startResize(direction, event);
  };

  // Global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Don't render if minimized
  if (app.minimized) return null;

  return (
    <div
      ref={windowRef}
      className={`absolute window-container ${isResizing ? 'window-resizing' : ''} ${app.maximized ? 'window-maximize-transition' : 'window-resize-transition'}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: app.zIndex,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Title Bar */}
      <div className="window-title-bar" onMouseDown={handleMouseDown}>
        <span className="window-title">{app.name}</span>
        <div className="window-controls">
          <button
            onClick={handleMinimize}
            className="window-minimize"
            title="Minimize"
            aria-label="Minimize window"
          />
          <button
            onClick={handleMaximize}
            className={app.maximized ? 'window-restore' : 'window-maximize'}
            title={app.maximized ? 'Restore' : 'Maximize'}
            aria-label={app.maximized ? 'Restore window' : 'Maximize window'}
          />
          <button
            onClick={handleClose}
            className="window-close"
            title="Close"
            aria-label="Close window"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="window-content">{children}</div>

      {/* Resize Handles */}
      <ResizeHandles
        onResizeStart={handleResizeStart}
        disabled={app.maximized}
        showHandles={!app.maximized}
      />
    </div>
  );
}
