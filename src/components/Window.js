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
import SnapService from '@/system/services/SnapService';

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
  const [snapPreview, setSnapPreview] = useState(null);

  // Snap-to-edge constants
  const TASKBAR_HEIGHT = 64;
  const SNAP_THRESHOLD = 32; // pixels

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
  // Use app.size/position when maximized, otherwise use resize hook values
  const size = useMemo(
    () => (app.maximized ? app.size : resizeSize),
    [
      app.maximized,
      app.size.width,
      app.size.height,
      resizeSize.width,
      resizeSize.height,
    ],
  );
  const position = useMemo(
    () => (app.maximized ? app.position : resizePosition),
    [
      app.maximized,
      app.position.x,
      app.position.y,
      resizePosition.x,
      resizePosition.y,
    ],
  );

  /** Handle window drag start */
  const handleMouseDown = (e) => {
    // Don't start drag if resizing or maximized
    if (isResizing || app.maximized) return;

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

        // Update snap preview overlay
        const preview = SnapService.getPreviewLayout(
          constrainedPosition,
          size,
          { threshold: SNAP_THRESHOLD, taskbarHeight: TASKBAR_HEIGHT },
        );
        setSnapPreview(preview ? { layout: preview } : null);
      } else if (isResizing) {
        handleResize(e);
        setSnapPreview(null);
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
      // Evaluate snap-to-edge on drag end via SnapService
      const region = SnapService.getRegion(position, size, {
        threshold: SNAP_THRESHOLD,
        taskbarHeight: TASKBAR_HEIGHT,
      });
      if (region) {
        const layout = SnapService.getLayout(region, {
          taskbarHeight: TASKBAR_HEIGHT,
        });
        if (layout?.maximize) {
          if (!app.maximized) {
            dispatch({ type: 'MAXIMIZE_APP', payload: { id: app.id } });
          }
        } else if (layout?.size && layout?.position) {
          // Ensure we are not in maximized state
          if (app.maximized) {
            // Restore first by toggling maximize off
            dispatch({ type: 'MAXIMIZE_APP', payload: { id: app.id } });
          }
          // Sync local resize state so the UI updates immediately
          updateWindow(layout.size, layout.position);
          dispatch({
            type: 'RESIZE_APP',
            payload: {
              id: app.id,
              size: layout.size,
              position: layout.position,
            },
          });
        }
      } else {
        // No snap target: commit final position
        dispatch({
          type: 'MOVE_APP',
          payload: {
            id: app.id,
            position: position,
          },
        });
      }
      // Clear preview after mouse up
      setSnapPreview(null);
    }
    if (isResizing) {
      endResize();
    }
  }, [
    isDragging,
    isResizing,
    position.x,
    position.y,
    size.width,
    size.height,
    app.maximized,
    dispatch,
    app.id,
    endResize,
    position,
    size,
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

  /** Handle double click on title bar for maximize/restore */
  const handleTitleBarDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleMaximize();
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
      {snapPreview?.layout && (
        <div className="fixed inset-0 pointer-events-none z-[9998]">
          <div
            className="absolute border-2 border-sky-400/80 bg-sky-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.1)]"
            style={{
              left: snapPreview.layout.position.x,
              top: snapPreview.layout.position.y,
              width: snapPreview.layout.size.width,
              height: snapPreview.layout.size.height,
            }}
          />
        </div>
      )}
      {/* Title Bar */}
      <div
        className="window-title-bar"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
      >
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
