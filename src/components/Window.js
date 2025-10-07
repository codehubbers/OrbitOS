import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import SnapPreview from '@/system/components/SnapPreview';
import WindowTitleBar from '@/system/components/WindowTitleBar';
import { useWindowResize } from '@/hooks/useWindowResize';
import useWindowDrag from '@/hooks/useWindowDrag';
import useWindowSnap from '@/hooks/useWindowSnap';
import ResizeHandles from '@/system/components/ResizeHandles';
import { TASKBAR_HEIGHT, SNAP_THRESHOLD } from '@/system/config/window';

export default function Window({ app, children }) {
  const { dispatch } = useApp();
  const { theme } = useTheme();
  const [isMaximized, setIsMaximized] = useState(false);
  const savedState = useRef({ position: null, size: null });

  // Initialize hooks
  const initialPosition = {
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 100,
  };
  const initialSize = { width: 600, height: 400 };

  const {
    size,
    position,
    isResizing,
    startResize,
    handleResize,
    endResize,
    updateWindow,
  } = useWindowResize({
    size: initialSize,
    position: initialPosition,
  });

  const { snapPreview, updatePreviewFor, applySnapIfAny, clearPreview } =
    useWindowSnap({
      updateWindow,
      dispatch,
      appId: app.id,
      isMaximized,
    });

  const {
    isDragging,
    handleMouseDown: dragMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useWindowDrag({
    app,
    position,
    size,
    isResizing,
    isMaximized,
    handleResize,
    endResize,
    updateWindow,
    dispatch,
    applySnapIfAny,
    clearPreview,
    updatePreviewFor,
  });

  const handleMouseDown = (e) => {
    dragMouseDown(e);
  };

  const handleResizeStart = (direction, e) => {
    e.stopPropagation();
    startResize(direction, e);
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_APP', payload: app.id });
  };

  const handleMinimize = () => {
    dispatch({ type: 'MINIMIZE_APP', payload: { appId: app.id } });
  };

  const handleToggleAlwaysOnTop = () => {
    dispatch({ type: 'TOGGLE_ALWAYS_ON_TOP', payload: { appId: app.id } });
  };

  const handleToggleMaximize = () => {
    if (isMaximized) {
      // Restore window
      if (
        savedState.current &&
        savedState.current.size &&
        savedState.current.position
      ) {
        clearPreview();
        updateWindow(savedState.current.size, savedState.current.position);
        setIsMaximized(false);
      }
    } else {
      // Maximize window
      savedState.current = {
        position: { x: Math.round(position.x), y: Math.round(position.y) },
        size: {
          width: Math.round(size.width),
          height: Math.round(size.height),
        },
      };

      const maximizedSize = {
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
      };
      const maximizedPosition = { x: 0, y: 0 };
      updateWindow(maximizedSize, maximizedPosition);
      setIsMaximized(true);
    }
  };

  // Global event listeners are handled by the hooks

  return (
    <>
      <SnapPreview layout={snapPreview} />
      <AnimatePresence>
        {!app.isMinimized && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute ${theme.window.bg} ${theme.window.border} border rounded-lg shadow-lg overflow-hidden`}
            style={{
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
              zIndex: app.alwaysOnTop ? 10000 + app.zIndex : app.zIndex,
            }}
          >
            {/* Window Header */}
            <WindowTitleBar
              app={app}
              theme={theme}
              isMaximized={isMaximized}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleToggleMaximize}
              onMinimize={handleMinimize}
              onMaximize={handleToggleMaximize}
              onClose={handleClose}
              onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
            />

            {/* Window Content */}
            <div className="flex-1 overflow-hidden">
              <div
                className={`p-4 h-full overflow-auto ${theme.window.content}`}
              >
                {children}
              </div>
            </div>

            {/* Resize Handles */}
            {!isMaximized && (
              <ResizeHandles
                onResizeStart={handleResizeStart}
                disabled={false}
                showHandles={true}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
