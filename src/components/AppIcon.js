// src/components/AppIcon.js
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNotification } from '@/system/services/NotificationRegistry';

const GRID_SIZE = 150; // 120px icon + 30px margin
const MARGIN = 30; // Margin from edges

export default function AppIcon({ app, position, onPositionChange, allApps }) {
  const { dispatch } = useApp();
  const { showNotification } = useNotification();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState(position);
  const [originalPos, setOriginalPos] = useState(position);
  const [isInvalidArea, setIsInvalidArea] = useState(false);
  const [gridDimensions, setGridDimensions] = useState({ cols: 10, rows: 8 });
  const [clickCount, setClickCount] = useState(0);
  const [holdTimer, setHoldTimer] = useState(null);
  const [canDrag, setCanDrag] = useState(false);
  const [wasDragged, setWasDragged] = useState(false);
  const dragRef = useRef(null);
  const clickTimer = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const availableWidth = window.innerWidth - MARGIN * 2;
      const availableHeight = window.innerHeight - 64 - MARGIN * 2; // 64px for taskbar
      setGridDimensions({
        cols: Math.floor(availableWidth / GRID_SIZE),
        rows: Math.floor(availableHeight / GRID_SIZE),
      });
    }
  }, []);

  useEffect(() => {
    setCurrentPos(position);
    setOriginalPos(position);
  }, [position]);

  const openApp = () => {
    dispatch({ type: 'OPEN_APP', payload: app });
    dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
  };

  const handleClick = () => {
    if (isDragging || canDrag || wasDragged) return;

    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    clickTimer.current = setTimeout(() => {
      if (newCount === 1) {
        // Single click - show guidance notification (only if not dragged)
        if (!wasDragged) {
          showNotification(
            'Double-click to open • Hold 0.3s to drag',
            'info',
            5000,
          );
        }
      } else if (newCount >= 2) {
        // Double click - open app (no notification)
        openApp();
      }
      setClickCount(0);
    }, 300);
  };

  const isValidPosition = (x, y) => {
    // Check if position is within any valid grid cell
    const col = Math.round((x - MARGIN) / GRID_SIZE);
    const row = Math.round((y - MARGIN) / GRID_SIZE);

    return (
      col >= 0 &&
      row >= 0 &&
      col < gridDimensions.cols &&
      row < gridDimensions.rows
    );
  };

  const snapToGrid = (x, y) => {
    // Find nearest grid position
    const col = Math.round((x - MARGIN) / GRID_SIZE);
    const row = Math.round((y - MARGIN) / GRID_SIZE);

    // Clamp to valid grid bounds
    const clampedCol = Math.max(0, Math.min(col, gridDimensions.cols - 1));
    const clampedRow = Math.max(0, Math.min(row, gridDimensions.rows - 1));

    return {
      x: MARGIN + clampedCol * GRID_SIZE,
      y: MARGIN + clampedRow * GRID_SIZE,
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setWasDragged(false);
    setOriginalPos(currentPos);
    setDragStart({ x: e.clientX - currentPos.x, y: e.clientY - currentPos.y });

    // Start hold timer for drag mode
    const timer = setTimeout(() => {
      setCanDrag(true);
      setIsDragging(true);
      setWasDragged(true);
    }, 300);

    setHoldTimer(timer);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !canDrag) return;
    const newPos = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setCurrentPos(newPos);
    setIsInvalidArea(!isValidPosition(newPos.x, newPos.y));
  };

  const handleMouseUp = () => {
    // Clear hold timer if mouse is released before 0.3s
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }

    if (!isDragging) {
      setCanDrag(false);
      // Reset drag flag after a short delay to allow click detection
      setTimeout(() => setWasDragged(false), 100);
      return;
    }

    setIsDragging(false);
    setCanDrag(false);
    setIsInvalidArea(false);

    // If in invalid area, return to original position
    if (!isValidPosition(currentPos.x, currentPos.y)) {
      setCurrentPos(originalPos);
      setTimeout(() => setWasDragged(false), 100);
      return;
    }

    const snappedPos = snapToGrid(currentPos.x, currentPos.y);

    // Check if another icon is at this position
    const targetIcon = allApps?.find(
      (otherApp) =>
        otherApp.id !== app.id &&
        Math.abs(otherApp.position.x - snappedPos.x) < 60 &&
        Math.abs(otherApp.position.y - snappedPos.y) < 60,
    );

    if (targetIcon && onPositionChange) {
      // Swap positions
      onPositionChange(app.id, snappedPos);
      onPositionChange(targetIcon.id, originalPos);
    } else if (onPositionChange) {
      onPositionChange(app.id, snappedPos);
    }

    setCurrentPos(snappedPos);
    // Reset drag flag after drag operation completes
    setTimeout(() => setWasDragged(false), 100);
  };

  const isImagePath = app.icon.startsWith('/');

  return (
    <>
      {/* Grid overlay when dragging */}
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {/* Valid grid areas */}
          {Array.from({ length: gridDimensions.rows }, (_, row) =>
            Array.from({ length: gridDimensions.cols }, (_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border-2 border-dashed border-white/50"
                style={{
                  left: MARGIN + col * GRID_SIZE,
                  top: MARGIN + row * GRID_SIZE,
                  width: GRID_SIZE,
                  height: GRID_SIZE,
                }}
              />
            )),
          )}
          {/* Invalid margin areas - blinking red */}
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse opacity-30" />
          <div
            className="absolute bg-red-500/20 animate-pulse"
            style={{ left: 0, top: 0, width: MARGIN, height: '100%' }}
          />
          <div
            className="absolute bg-red-500/20 animate-pulse"
            style={{ right: 0, top: 0, width: MARGIN, height: '100%' }}
          />
          <div
            className="absolute bg-red-500/20 animate-pulse"
            style={{ left: 0, top: 0, width: '100%', height: MARGIN }}
          />
          <div
            className="absolute bg-red-500/20 animate-pulse"
            style={{ left: 0, bottom: 64, width: '100%', height: MARGIN }}
          />
        </div>
      )}

      <div
        ref={dragRef}
        className={`absolute flex flex-col items-center p-2 rounded-lg w-28 text-center cursor-pointer group ${
          isDragging ? 'z-50 scale-110' : 'z-10'
        } ${isInvalidArea ? 'animate-pulse' : ''}`}
        style={{
          top: currentPos.y,
          left: currentPos.x,
          transition: isDragging ? 'none' : 'all 0.2s ease',
          filter: isInvalidArea
            ? 'hue-rotate(0deg) saturate(2) brightness(1.5)'
            : 'none',
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Icon container with a modern shadow and hover effect */}
        <div className="relative w-16 h-16 p-1 rounded-xl bg-white/20 shadow-lg transition-transform duration-150 group-hover:scale-110">
          {isImagePath ? (
            <img
              src={app.icon}
              alt={`${app.name} icon`}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-5xl flex items-center justify-center h-full">
              {app.icon}
            </span>
          )}
          {/* Shortcut indicator */}
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-full border border-gray-300 flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Clean text with a drop shadow to make it readable on any wallpaper */}
        <span
          className="text-white text-sm font-medium mt-2"
          style={{ textShadow: '0px 1px 4px rgba(0,0,0,0.7)' }}
        >
          {app.name}
        </span>
      </div>
    </>
  );
}
