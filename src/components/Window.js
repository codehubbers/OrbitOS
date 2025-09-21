import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';

export default function Window({ app, children }) {
  const { dispatch } = useApp();
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
    dispatch({ type: 'MINIMIZE_APP', payload: app.id });
  };

  if (app.minimized) return null;

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
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
        className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex justify-between items-center window-drag"
        onMouseDown={handleMouseDown}
      >
        <span className="font-medium text-gray-800">{app.name}</span>
        <div className="flex space-x-2">
          <button
            onClick={handleMinimize}
            className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-600"
          />
          <button
            onClick={handleClose}
            className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"
          />
        </div>
      </div>
      <div className="p-4 h-full overflow-auto">{children}</div>
    </div>
  );
}
