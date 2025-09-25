/**
 * @fileoverview Window Component - Main window component with resize functionality
 *
 * Renders a draggable and resizable window with modern window management features.
 * Integrates Strategy Pattern for resize operations with complete window experience.
 */

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useWindowResize } from '@/hooks/useWindowResize';
import ResizeHandles from '@/system/components/ResizeHandles';
import SnapPreview from '@/system/components/SnapPreview';
import useWindowSnap from '@/hooks/useWindowSnap';
import useWindowDrag from '@/hooks/useWindowDrag';
import WindowTitleBar from '@/system/components/WindowTitleBar';
import {
  TASKBAR_HEIGHT,
  SNAP_THRESHOLD,
  DEFAULT_CONSTRAINTS,
  DEFAULT_WINDOW_POSITION,
  DEFAULT_WINDOW_SIZE,
} from '@/system/config/window';

/**
 * Window component with advanced resize functionality
 * @param {Object} props - Component props
 * @returns {JSX.Element} Window component
 */
export default function Window({ app, children }) {
  const { dispatch } = useApp();

  const [snapPreview, setSnapPreview] = useState(null);

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
    size: app.size || DEFAULT_WINDOW_SIZE,
    position: app.position || DEFAULT_WINDOW_POSITION,
    constraints: {
      minSize: DEFAULT_CONSTRAINTS.minSize,
      maxSize: DEFAULT_CONSTRAINTS.maxSize,
    },
    onResize: (newState, direction) => {
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
    onResizeEnd: (finalState) => {
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
  });

  // Snap hook (requires updateWindow from useWindowResize)
  const {
    snapPreview: hookPreview,
    updatePreviewFor,
    applySnapIfAny,
    clearPreview,
  } = useWindowSnap({
    taskbarHeight: TASKBAR_HEIGHT,
    threshold: SNAP_THRESHOLD,
    updateWindow,
    dispatch,
    appId: app.id,
    isMaximized: app.maximized,
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

  // Drag hook
  const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } =
    useWindowDrag({
      app,
      position,
      size,
      isResizing,
      handleResize,
      endResize,
      updateWindow,
      dispatch,
      applySnapIfAny,
      clearPreview,
      updatePreviewFor,
    });

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

  // Global listeners handled in useWindowDrag

  // Don't render if minimized
  if (app.minimized) return null;

  return (
    <div
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
      <SnapPreview layout={hookPreview || snapPreview} />
      <WindowTitleBar
        app={app}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />

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
