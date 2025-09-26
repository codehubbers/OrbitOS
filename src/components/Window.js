import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import SnapPreview from './SnapPreview';

export default function Window({ app, children }) {
  const { dispatch } = useApp();
  const { theme } = useTheme();
  const [position, setPosition] = useState({
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 100,
  });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [snapZone, setSnapZone] = useState(null);
  const dragRef = useRef({ startX: 0, startY: 0 });
  const resizeRef = useRef({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });
  const savedState = useRef({ position: null, size: null });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    if (isMaximized) {
      // When dragging a maximized window, restore it and center under cursor
      const restoredWidth = savedState.current?.size?.width || 600;
      const newX = e.clientX - restoredWidth / 2;
      dragRef.current = {
        startX: restoredWidth / 2,
        startY: e.clientY,
      };
    } else {
      dragRef.current = {
        startX: e.clientX - position.x,
        startY: e.clientY - position.y,
      };
    }
    dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
  };

  const getSnapZone = (clientX, clientY) => {
    const threshold = 20;
    const cornerThreshold = 50;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const midHeight = windowHeight / 2;

    // Top edge - maximize
    if (clientY <= threshold) return 'maximize';

    // Corner zones (halves)
    if (clientX <= cornerThreshold && clientY <= cornerThreshold) return 'left';
    if (clientX >= windowWidth - cornerThreshold && clientY <= cornerThreshold)
      return 'right';
    if (clientX <= cornerThreshold && clientY >= windowHeight - cornerThreshold)
      return 'left';
    if (
      clientX >= windowWidth - cornerThreshold &&
      clientY >= windowHeight - cornerThreshold
    )
      return 'right';

    // Quarter zones (middle areas on left/right)
    if (
      clientX <= threshold &&
      clientY > cornerThreshold &&
      clientY < midHeight
    )
      return 'top-left';
    if (
      clientX <= threshold &&
      clientY >= midHeight &&
      clientY < windowHeight - cornerThreshold
    )
      return 'bottom-left';
    if (
      clientX >= windowWidth - threshold &&
      clientY > cornerThreshold &&
      clientY < midHeight
    )
      return 'top-right';
    if (
      clientX >= windowWidth - threshold &&
      clientY >= midHeight &&
      clientY < windowHeight - cornerThreshold
    )
      return 'bottom-right';

    // Edge zones (full halves)
    if (clientX <= threshold) return 'left';
    if (clientX >= windowWidth - threshold) return 'right';

    return null;
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      if (isMaximized) {
        // Restore window when starting to drag from maximized state
        setPosition(savedState.current.position);
        setSize(savedState.current.size);
        setIsMaximized(false);
      }

      const newX = e.clientX - dragRef.current.startX;
      const newY = Math.max(0, e.clientY - dragRef.current.startY);
      setPosition({ x: newX, y: newY });

      // Update snap preview
      const zone = getSnapZone(e.clientX, e.clientY);
      setSnapZone(zone);
    }
    if (isResizing) {
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      let newWidth = resizeRef.current.startWidth;
      let newHeight = resizeRef.current.startHeight;

      if (resizeDirection.includes('right')) newWidth += deltaX;
      if (resizeDirection.includes('bottom')) newHeight += deltaY;

      setSize({
        width: Math.max(300, newWidth),
        height: Math.max(200, newHeight),
      });
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging && snapZone) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight - 50;

      switch (snapZone) {
        case 'maximize':
          handleMaximize();
          break;
        case 'left':
          setPosition({ x: 0, y: 0 });
          setSize({ width: windowWidth / 2, height: windowHeight });
          break;
        case 'right':
          setPosition({ x: windowWidth / 2, y: 0 });
          setSize({ width: windowWidth / 2, height: windowHeight });
          break;
        case 'top-left':
          setPosition({ x: 0, y: 0 });
          setSize({ width: windowWidth / 2, height: windowHeight / 2 });
          break;
        case 'top-right':
          setPosition({ x: windowWidth / 2, y: 0 });
          setSize({ width: windowWidth / 2, height: windowHeight / 2 });
          break;
        case 'bottom-left':
          setPosition({ x: 0, y: windowHeight / 2 });
          setSize({ width: windowWidth / 2, height: windowHeight / 2 });
          break;
        case 'bottom-right':
          setPosition({ x: windowWidth / 2, y: windowHeight / 2 });
          setSize({ width: windowWidth / 2, height: windowHeight / 2 });
          break;
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
    setSnapZone(null);
  };

  const handleResizeStart = (direction, e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_APP', payload: app.id });
  };

  const handleMinimize = () => {
    dispatch({ type: 'MINIMIZE_APP', payload: { appId: app.id } });
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(savedState.current.position);
      setSize(savedState.current.size);
      setIsMaximized(false);
    } else {
      savedState.current = { position, size };
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 50 });
      setIsMaximized(true);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = (e) => handleMouseUp(e);

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, position, size]);

  return (
    <>
      <SnapPreview snapZone={snapZone} />
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
            <div className="flex-1 overflow-hidden">
              <div
                className={`p-4 h-full overflow-auto ${theme.window.content}`}
              >
                {children}
              </div>
            </div>

            {/* Resize handles */}
            {!isMaximized && (
              <>
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart('bottom-right', e)}
                />
                <div
                  className="absolute bottom-0 left-0 right-3 h-1 cursor-s-resize"
                  onMouseDown={(e) => handleResizeStart('bottom', e)}
                />
                <div
                  className="absolute top-0 bottom-3 right-0 w-1 cursor-e-resize"
                  onMouseDown={(e) => handleResizeStart('right', e)}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
