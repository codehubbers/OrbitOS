/**
 * @fileoverview Tab Manager - Application for managing tabs of other applications
 *
 * Provides a tabbed interface that shows other applications as tabs.
 * Each tab displays the content of the corresponding application.
 */

import React, { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

// Import app components for tab content rendering
import NotesApp from '@/pages/apps/notes';
import BrowserApp from '@/pages/apps/browser';
import SettingsApp from '@/pages/apps/settings';
import MonitorApp from '@/pages/apps/monitor';
import FilemanagerApp from '@/pages/apps/filemanager';
import Calculator from '@/pages/apps/calculator';

const appComponents = {
  notes: NotesApp,
  browser: BrowserApp,
  settings: SettingsApp,
  monitor: MonitorApp,
  filemanager: FilemanagerApp,
  calculator: Calculator,
};

const TabManager = ({ groupId, onClose }) => {
  const { state, dispatch } = useApp();

  // Get the group and its windows
  const group = state.windowGroups.find((g) => g.id === groupId);
  const tabs = group
    ? state.openApps.filter((app) => group.windows.includes(app.id))
    : [];

  // Get active tab from group or use first tab
  const activeTab =
    group?.activeWindow || (tabs.length > 0 ? tabs[0].id : null);

  const switchTab = useCallback(
    (appId) => {
      if (group) {
        dispatch({
          type: 'UPDATE_WINDOW_GROUP',
          payload: {
            groupId: group.id,
            updates: { activeWindow: appId },
          },
        });
      }
    },
    [group, dispatch],
  );

  const removeTab = useCallback(
    (appId) => {
      // If removing the active tab, switch to first remaining tab
      const remainingTabs = tabs.filter((tab) => tab.id !== appId);
      const newActiveTab =
        remainingTabs.length > 0 ? remainingTabs[0].id : null;

      // Update active tab if needed
      if (activeTab === appId && newActiveTab) {
        dispatch({
          type: 'UPDATE_WINDOW_GROUP',
          payload: {
            groupId: group.id,
            updates: { activeWindow: newActiveTab },
          },
        });
      }

      dispatch({
        type: 'REMOVE_WINDOW_FROM_GROUP',
        payload: {
          windowId: appId,
          groupId: group.id,
          tabGroupId: group.tabGroupId,
        },
      });
    },
    [group, dispatch, tabs, activeTab],
  );

  const getActiveApp = () => {
    return tabs.find((tab) => tab.id === activeTab);
  };

  const renderTabContent = () => {
    const activeApp = getActiveApp();
    if (!activeApp) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-lg font-medium">No tabs open</div>
            <div className="text-sm">Add applications to see them as tabs</div>
          </div>
        </div>
      );
    }

    const AppComponent = appComponents[activeApp.component];
    if (!AppComponent) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <div className="text-lg font-medium">Component not found</div>
            <div className="text-sm">for: {activeApp.component}</div>
          </div>
        </div>
      );
    }

    return <AppComponent />;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex-1 flex overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 border-r border-gray-200 dark:border-gray-600 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-sm font-medium">{tab.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
                className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              >
                ×
              </button>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabManager;
