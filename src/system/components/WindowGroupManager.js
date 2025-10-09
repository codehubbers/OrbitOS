/**
 * @fileoverview Window Group Manager - UI component for window grouping
 *
 * Provides UI for managing window groups with drag-and-drop functionality.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import useWindowGrouping from '@/hooks/useWindowGrouping';

const WindowGroupManager = ({ isVisible, onClose }) => {
  const { state, dispatch } = useApp();
  const [groupName, setGroupName] = useState('');

  const {
    isGrouping,
    selectedWindows,
    startGrouping,
    endGrouping,
    addWindowToSelection,
    removeWindowFromSelection,
    clearSelection,
    createGroup,
    destroyGroup,
    handleGroupMouseDown,
  } = useWindowGrouping({
    windows: state.openApps,
    dispatch,
  });

  const handleCreateGroup = useCallback(() => {
    if (selectedWindows.length < 2) return;

    const group = createGroup(groupName || null);
    if (group) {
      setGroupName('');
      clearSelection();
    }
  }, [selectedWindows, groupName, createGroup, clearSelection]);

  const handleDestroyGroup = useCallback(
    (groupId) => {
      destroyGroup(groupId);
    },
    [destroyGroup],
  );

  if (!isVisible) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        width: '100vw',
        height: '100vh',
        margin: 0,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          zIndex: 10000,
          position: 'relative',
          margin: 'auto',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Window Group Manager
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Grouping Controls */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={isGrouping ? endGrouping : startGrouping}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isGrouping
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isGrouping ? 'Stop Grouping' : 'Start Grouping'}
            </button>

            {isGrouping && (
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Group name (optional)"
                  value={groupName}
                  onChange={(e) => {
                    e.stopPropagation();
                    setGroupName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      handleCreateGroup();
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.target.focus();
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  style={{
                    zIndex: 10001,
                    position: 'relative',
                  }}
                />
                <button
                  onClick={handleCreateGroup}
                  disabled={selectedWindows.length < 2}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group ({selectedWindows.length})
                </button>
              </div>
            )}
          </div>

          {isGrouping && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Click on windows to select them for grouping. Selected:{' '}
              {selectedWindows.length}
            </div>
          )}
        </div>

        {/* Open Windows */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Available Windows
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {state.openApps
              .filter((app) => !app.groupId) // Only show windows that are not in any group
              .map((app) => (
                <motion.div
                  key={app.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedWindows.includes(app.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={(e) => handleGroupMouseDown(e, app.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {app.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Available
                  </div>
                </motion.div>
              ))}
          </div>

          {state.openApps.filter((app) => !app.groupId).length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              All windows are already in groups
            </div>
          )}
        </div>

        {/* Existing Groups */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Window Groups
          </h3>
          <div className="space-y-3">
            {state.windowGroups.map((group) => (
              <motion.div
                key={group.id}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {group.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.windows.length} windows
                    </p>
                  </div>
                  <button
                    onClick={() => handleDestroyGroup(group.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {group.windows.map((windowId) => {
                    const window = state.openApps.find(
                      (app) => app.id === windowId,
                    );
                    return window ? (
                      <span
                        key={windowId}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded flex items-center gap-1"
                      >
                        {window.name}
                        <button
                          onClick={() => {
                            dispatch({
                              type: 'REMOVE_WINDOW_FROM_GROUP',
                              payload: { windowId, groupId: group.id },
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                          title="Remove from group"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>

                {/* Add windows to group */}
                <div className="flex flex-wrap gap-2">
                  {state.openApps
                    .filter(
                      (app) => !app.groupId && !group.windows.includes(app.id),
                    )
                    .map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          dispatch({
                            type: 'ADD_WINDOW_TO_GROUP',
                            payload: { windowId: app.id, groupId: group.id },
                          });
                        }}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        title="Add to group"
                      >
                        + {app.name}
                      </button>
                    ))}
                </div>
              </motion.div>
            ))}

            {state.windowGroups.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No window groups created yet
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WindowGroupManager;
