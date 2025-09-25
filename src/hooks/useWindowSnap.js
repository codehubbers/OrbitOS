/**
 * @fileoverview useWindowSnap - Hook to encapsulate drag/snap preview logic
 */

import { useCallback, useState } from 'react';
import SnapService from '@/system/services/SnapService';
import { TASKBAR_HEIGHT, SNAP_THRESHOLD } from '@/system/config/window';

export default function useWindowSnap({
  taskbarHeight = TASKBAR_HEIGHT,
  threshold = SNAP_THRESHOLD,
  updateWindow,
  dispatch,
  appId,
  isMaximized,
}) {
  const [snapPreview, setSnapPreview] = useState(null);

  const updatePreviewFor = useCallback(
    (position, size) => {
      const preview = SnapService.getPreviewLayout(position, size, {
        threshold,
        taskbarHeight,
      });
      setSnapPreview(preview || null);
    },
    [threshold, taskbarHeight],
  );

  const applySnapIfAny = useCallback(
    (position, size) => {
      const region = SnapService.getRegion(position, size, {
        threshold,
        taskbarHeight,
      });
      if (!region) return false;
      const layout = SnapService.getLayout(region, { taskbarHeight });
      if (!layout) return false;

      if (layout.maximize) {
        const fullSize = {
          width: window.innerWidth,
          height: window.innerHeight - taskbarHeight,
        };
        const fullPos = { x: 0, y: 0 };
        updateWindow(fullSize, fullPos);
        dispatch({
          type: 'RESIZE_APP',
          payload: { id: appId, size: fullSize, position: fullPos },
        });
        return true;
      }

      if (layout.size && layout.position) {
        if (isMaximized) {
          dispatch({ type: 'MAXIMIZE_APP', payload: { id: appId } });
        }
        updateWindow(layout.size, layout.position);
        dispatch({
          type: 'RESIZE_APP',
          payload: { id: appId, size: layout.size, position: layout.position },
        });
        return true;
      }
      return false;
    },
    [threshold, taskbarHeight, updateWindow, dispatch, appId, isMaximized],
  );

  const clearPreview = useCallback(() => setSnapPreview(null), []);

  return { snapPreview, updatePreviewFor, applySnapIfAny, clearPreview };
}
