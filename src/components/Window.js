import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import SnapPreview from '@/system/components/SnapPreview';
import WindowTitleBar from '@/system/components/WindowTitleBar';
import WindowGroupIndicator from '@/system/components/WindowGroupIndicator';
import { useWindowResize } from '@/hooks/useWindowResize';
import useWindowDrag from '@/hooks/useWindowDrag';
import useWindowSnap from '@/hooks/useWindowSnap';
import ResizeHandles from '@/system/components/ResizeHandles';
import TabManagerService from '@/system/services/TabManagerService';
import { TASKBAR_HEIGHT } from '@/system/config/window';

export default function Window({ app, children }) {
  const { state, dispatch } = useApp();
  const { theme } = useTheme();

  const [isMaximized, setIsMaximized] = useState(false);

  const savedState = useRef({
    position: null,
    size: null,
  });

  // Find the group this window belongs to.
  const group = state.windowGroups.find((g) => g.windows.includes(app.id));

  // Grouped windows are rendered by the group manager instead.
  const isGrouped = group !== undefined;

  const initialPosition = {
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 100,
  };

  const initialSize = {
    width: 600,
    height: app.id === 'settings' ? 350 : 400,
  };

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

  const { handleMouseDown: dragMouseDown } = useWindowDrag({
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

  // Handle title bar dragging and activation.
  const handleMouseDown = (event) => {
    if (isMaximized && state.activeApp !== app.id) {
      dispatch({
        type: 'SET_ACTIVE_APP',
        payload: app.id,
      });
    }

    dragMouseDown(event);
    event.stopPropagation();
  };

  // Activate a window when its content is clicked.
  const handleWindowContentMouseDown = () => {
    if (state.activeApp !== app.id) {
      dispatch({
        type: 'SET_ACTIVE_APP',
        payload: app.id,
      });
    }
  };

  // Activate the window before resizing.
  const handleResizeStart = (direction, event) => {
    if (state.activeApp !== app.id) {
      dispatch({
        type: 'SET_ACTIVE_APP',
        payload: app.id,
      });
    }

    event.stopPropagation();
    startResize(direction, event);
  };

  const handleClose = () => {
    if (TabManagerService.isTabManager(app)) {
      const targetGroup = state.windowGroups.find((g) => g.id === app.groupId);

      const actions = TabManagerService.handleTabManagerClose({
        appId: app.id,
        groupId: app.groupId,
        group: targetGroup,
        dispatch,
      });

      actions.forEach((action) => dispatch(action));
    } else {
      dispatch({
        type: 'CLOSE_APP',
        payload: app.id,
      });
    }
  };

  const handleMinimize = () => {
    dispatch({
      type: 'MINIMIZE_APP',
      payload: {
        appId: app.id,
      },
    });
  };

  const handleToggleAlwaysOnTop = () => {
    dispatch({
      type: 'TOGGLE_ALWAYS_ON_TOP',
      payload: {
        appId: app.id,
      },
    });
  };

  const handleToggleMaximize = () => {
    if (isMaximized) {
      // Restore the previous window dimensions and position.
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
      // Save the current window state.
      savedState.current = {
        position: {
          x: Math.round(position.x),
          y: Math.round(position.y),
        },
        size: {
          width: Math.round(size.width),
          height: Math.round(size.height),
        },
      };

      const maximizedSize = {
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
      };

      const maximizedPosition = {
        x: 0,
        y: 0,
      };

      updateWindow(maximizedSize, maximizedPosition);
      setIsMaximized(true);
    }
  };

  return (
    <>
      <SnapPreview layout={snapPreview} />

      <AnimatePresence>
        {!app.isMinimized && !isGrouped && (
          <motion.div
            initial={{
              scale: 0.8,
              opacity: 0,
              y: 50,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.8,
              opacity: 0,
              y: 50,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            className={`absolute ${theme.window.bg} ${theme.window.border} border rounded-lg shadow-lg overflow-hidden`}
            style={{
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
              zIndex: app.alwaysOnTop ? 10000 + app.zIndex : app.zIndex,
            }}
          >
            {group && <WindowGroupIndicator window={app} group={group} />}

            {/* Window title bar */}
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

            {/* Window content */}
            <div
              className={`flex-1 ${theme.window.content} ${theme.window.scrollbar}`}
              style={{
                height: 'calc(100% - 40px)',
                overflow: 'hidden',
              }}
              onMouseDown={handleWindowContentMouseDown}
            >
              {children}
            </div>

            {/* Window resize handles */}
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
