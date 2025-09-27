/**
 * @fileoverview useWindowDrag - Encapsulates drag logic and global listeners
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TASKBAR_HEIGHT } from '@/system/config/window';

export default function useWindowDrag({
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
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const handleMouseDown = useCallback(
    (e) => {
      if (isResizing || isMaximized) return;
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX - position.x,
        startY: e.clientY - position.y,
      };
      dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
    },
    [isResizing, isMaximized, position.x, position.y, dispatch, app.id],
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging && !isResizing) {
        const newPosition = {
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY,
        };

        const constrainedPosition = {
          x: Math.max(
            0,
            Math.min(newPosition.x, window.innerWidth - size.width),
          ),
          y: Math.max(
            0,
            Math.min(
              newPosition.y,
              window.innerHeight - size.height - TASKBAR_HEIGHT,
            ),
          ),
        };

        updateWindow(size, constrainedPosition);
        if (updatePreviewFor) {
          updatePreviewFor(constrainedPosition, size);
        }
      } else if (isResizing) {
        handleResize(e);
        clearPreview();
      }
    },
    [
      isDragging,
      isResizing,
      size.width,
      size.height,
      updateWindow,
      handleResize,
      clearPreview,
      updatePreviewFor,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      const snapped = applySnapIfAny(position, size);
      if (!snapped) {
        dispatch({ type: 'MOVE_APP', payload: { id: app.id, position } });
      }
      clearPreview();
    }
    if (isResizing && endResize) {
      endResize();
    }
  }, [
    isDragging,
    isResizing,
    position,
    size,
    dispatch,
    app.id,
    applySnapIfAny,
    clearPreview,
    endResize,
  ]);

  useEffect(() => {
    const onMove = (e) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return { isDragging, handleMouseDown, handleMouseMove, handleMouseUp };
}
