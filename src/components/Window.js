import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Window({ app, children }) {
  const { dispatch } = useApp();
  const { theme } = useTheme();
  const [position, setPosition] = useState({
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_APP', payload: app.id });
  };

  const handleMinimize = () => {
    dispatch({ type: 'MINIMIZE_APP', payload: { appId: app.id } });
  };

  return (
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
            width: 600,
            height: 400,
            zIndex: app.zIndex,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className={`${theme.window.header} px-3 py-2 flex justify-between items-center window-drag border-b`}
            style={{ height: '32px' }}
            onMouseDown={handleMouseDown}
          >
            <span className={`font-medium text-sm ${theme.window.text}`}>
              {app.name}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="w-3 h-3 bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors"
                title="Minimize"
              />
              <button
                className="w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600"
                title="Maximize"
              />
              <button
                onClick={handleClose}
                className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"
                title="Close"
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className={`p-4 h-full overflow-auto ${theme.window.content}`}>
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
