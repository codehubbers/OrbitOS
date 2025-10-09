/**
 * @fileoverview useWindowGrouping - Hook for window grouping functionality
 *
 * Manages window grouping operations using WindowGroupService
 * and integrates with existing window management system.
 */

import { useCallback, useState, useRef } from 'react';
import WindowGroupService from '@/system/services/WindowGroupService';
import TabManagerService from '@/system/services/TabManagerService';

export default function useWindowGrouping({
  windows = [],
  dispatch,
  onGroupCreated = null,
  onGroupDestroyed = null,
}) {
  const [groupingState, setGroupingState] = useState({
    isGrouping: false,
    selectedWindows: [],
    groupPreview: null,
    activeGroup: null,
  });

  const groupingRef = useRef({
    startPosition: null,
    selectionBox: null,
  });

  /**
   * Start window grouping mode
   */
  const startGrouping = useCallback(() => {
    setGroupingState((prev) => ({
      ...prev,
      isGrouping: true,
      selectedWindows: [],
    }));
  }, []);

  /**
   * End window grouping mode
   */
  const endGrouping = useCallback(() => {
    setGroupingState((prev) => ({
      ...prev,
      isGrouping: false,
      selectedWindows: [],
      groupPreview: null,
    }));
  }, []);

  /**
   * Add window to selection for grouping
   */
  const addWindowToSelection = useCallback((windowId) => {
    setGroupingState((prev) => ({
      ...prev,
      selectedWindows: [...prev.selectedWindows, windowId],
    }));
  }, []);

  /**
   * Remove window from selection
   */
  const removeWindowFromSelection = useCallback((windowId) => {
    setGroupingState((prev) => ({
      ...prev,
      selectedWindows: prev.selectedWindows.filter((id) => id !== windowId),
    }));
  }, []);

  /**
   * Clear window selection
   */
  const clearSelection = useCallback(() => {
    setGroupingState((prev) => ({
      ...prev,
      selectedWindows: [],
      groupPreview: null,
    }));
  }, []);

  /**
   * Create group from selected windows (with tabbed interface)
   */
  const createGroup = useCallback(
    (groupName = null) => {
      if (groupingState.selectedWindows.length < 2) return null;

      const selectedWindows = windows.filter((w) =>
        groupingState.selectedWindows.includes(w.id),
      );

      const groupLayout =
        WindowGroupService.calculateGroupLayout(selectedWindows);

      if (!groupLayout) return null;

      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const group = {
        id: groupId,
        name: groupName || `Group ${groupingState.selectedWindows.length}`,
        windows: groupingState.selectedWindows, // Use window IDs, not window objects
        position: groupLayout.position,
        size: groupLayout.size,
        createdAt: Date.now(),
      };

      // Create tab group for the same windows
      const tabGroupId = `tabgroup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tabGroup = {
        id: tabGroupId,
        name: groupName || `Tab Group ${groupingState.selectedWindows.length}`,
        windows: groupingState.selectedWindows,
        activeWindow: groupingState.selectedWindows[0], // First window is active
        position: groupLayout.position,
        size: groupLayout.size,
        createdAt: Date.now(),
      };

      // Dispatch group creation
      dispatch({
        type: 'CREATE_WINDOW_GROUP',
        payload: { group, windowIds: groupingState.selectedWindows },
      });

      // Dispatch tab group creation
      dispatch({
        type: 'CREATE_TAB_GROUP',
        payload: { tabGroup, windowIds: groupingState.selectedWindows },
      });

      // Open Tab Manager for this group using service
      const tabManagerApp = TabManagerService.createTabManagerApp(group);

      dispatch({
        type: 'OPEN_APP',
        payload: tabManagerApp,
      });

      // Callback
      if (onGroupCreated) {
        onGroupCreated(group);
      }

      // Clear selection
      clearSelection();

      return { group, tabGroup };
    },
    [
      groupingState.selectedWindows,
      windows,
      dispatch,
      onGroupCreated,
      clearSelection,
    ],
  );

  /**
   * Destroy window group
   */
  const destroyGroup = useCallback(
    (groupId) => {
      dispatch({
        type: 'DESTROY_WINDOW_GROUP',
        payload: { groupId },
      });

      // Callback
      if (onGroupDestroyed) {
        onGroupDestroyed(groupId);
      }
    },
    [dispatch, onGroupDestroyed],
  );

  /**
   * Add window to existing group
   */
  const addWindowToGroup = useCallback(
    (windowId, groupId, tabGroupId) => {
      dispatch({
        type: 'ADD_WINDOW_TO_GROUP',
        payload: { windowId, groupId, tabGroupId },
      });
    },
    [dispatch],
  );

  /**
   * Remove window from group
   */
  const removeWindowFromGroup = useCallback(
    (windowId, groupId, tabGroupId) => {
      dispatch({
        type: 'REMOVE_WINDOW_FROM_GROUP',
        payload: { windowId, groupId, tabGroupId },
      });
    },
    [dispatch],
  );

  /**
   * Arrange windows in group formation
   */
  const arrangeGroup = useCallback(
    (groupId, formation = 'cascade', options = {}) => {
      dispatch({
        type: 'ARRANGE_GROUP',
        payload: { groupId, formation, options },
      });
    },
    [dispatch],
  );

  /**
   * Handle mouse down for group selection
   */
  const handleGroupMouseDown = useCallback(
    (e, windowId) => {
      if (!groupingState.isGrouping) return;

      e.stopPropagation();

      if (groupingState.selectedWindows.includes(windowId)) {
        removeWindowFromSelection(windowId);
      } else {
        addWindowToSelection(windowId);
      }
    },
    [
      groupingState.isGrouping,
      groupingState.selectedWindows,
      addWindowToSelection,
      removeWindowFromSelection,
    ],
  );

  /**
   * Handle drag to create selection box
   */
  const handleGroupDrag = useCallback(
    (e) => {
      if (!groupingState.isGrouping) return;

      // Implementation for drag selection box
      // This would create a visual selection rectangle
    },
    [groupingState.isGrouping],
  );

  return {
    // State
    isGrouping: groupingState.isGrouping,
    selectedWindows: groupingState.selectedWindows,
    groupPreview: groupingState.groupPreview,
    activeGroup: groupingState.activeGroup,

    // Actions
    startGrouping,
    endGrouping,
    addWindowToSelection,
    removeWindowFromSelection,
    clearSelection,
    createGroup,
    destroyGroup,
    addWindowToGroup,
    removeWindowFromGroup,
    arrangeGroup,

    // Event handlers
    handleGroupMouseDown,
    handleGroupDrag,
  };
}
