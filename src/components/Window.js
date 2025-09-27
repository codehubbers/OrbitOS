import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import SnapPreview from '@/system/components/SnapPreview';
import { useWindowResize } from '@/hooks/useWindowResize';
import useWindowDrag from '@/hooks/useWindowDrag';
import useWindowSnap from '@/hooks/useWindowSnap';
import ResizeHandles from '@/system/components/ResizeHandles';

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
    handleResize,
    endResize,
    updateWindow,
    dispatch,
    applySnapIfAny,
    clearPreview,
    updatePreviewFor,
  });

  const handleMouseDown = (e) => {
    if (isMaximized) {
      handleMaximize();
    }
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

  const handleMaximize = () => {
    if (isMaximized) {
      updateWindow(savedState.current.size, savedState.current.position);
      setIsMaximized(false);
    } else {
      savedState.current = { position, size };
      const maximizedSize = {
        width: window.innerWidth,
        height: window.innerHeight - 50,
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
              zIndex: app.zIndex,
            }}
          >
            {/* Window Header */}
            <div
              className={`${theme.window.header} px-3 py-2 flex justify-between items-center window-drag border-b select-none`}
              style={{ height: '32px', userSelect: 'none' }}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleMaximize}
            >
              <span
                className={`font-medium text-sm ${theme.window.text} select-none`}
                style={{ userSelect: 'none' }}
              >
                {app.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMinimize}
                  className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors"
                  title="Minimize"
                />
                <button
                  onClick={handleMaximize}
                  className="w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600"
                  title={isMaximized ? 'Restore' : 'Maximize'}
                />
                <button
                  onClick={handleClose}
                  className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"
                  title="Close"
                />
              </div>
            </div>

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
