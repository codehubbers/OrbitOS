/**
 * @fileoverview Tab Manager Service - Manages Tab Manager operations
 *
 * Provides Tab Manager functionality following the service architecture pattern.
 * Handles Tab Manager creation, group management, and cleanup operations.
 */

class TabManagerService {
  constructor() {
    this.TAB_MANAGER_PREFIX = 'tab-manager-';
  }

  /**
   * Create Tab Manager app for a group
   * @param {Object} group - Window group object
   * @returns {Object} Tab Manager app configuration
   */
  createTabManagerApp(group) {
    return {
      id: `${this.TAB_MANAGER_PREFIX}${group.id}`,
      name: group.name,
      icon: '📋',
      component: 'tab-manager',
      groupId: group.id,
      position: group.position,
      size: group.size,
    };
  }

  /**
   * Handle Tab Manager close - destroy group and cleanup
   * @param {Object} params - Close parameters
   * @param {string} params.appId - Tab Manager app ID
   * @param {string} params.groupId - Group ID
   * @param {Object} params.group - Group object
   * @param {Function} params.dispatch - Dispatch function
   * @returns {Array} Array of actions to dispatch
   */
  handleTabManagerClose({ appId, groupId, group, dispatch }) {
    const actions = [];

    if (group) {
      // Remove all windows from the group first
      group.windows.forEach((windowId) => {
        actions.push({
          type: 'REMOVE_WINDOW_FROM_GROUP',
          payload: {
            windowId,
            groupId: group.id,
            tabGroupId: group.tabGroupId,
          },
        });
      });

      // Destroy the group
      actions.push({
        type: 'DESTROY_WINDOW_GROUP',
        payload: { groupId: group.id },
      });

      // Destroy the tab group
      actions.push({
        type: 'DESTROY_TAB_GROUP',
        payload: { tabGroupId: group.tabGroupId },
      });
    }

    // Close the Tab Manager app
    actions.push({
      type: 'CLOSE_APP',
      payload: appId,
    });

    return actions;
  }

  /**
   * Check if an app is a Tab Manager
   * @param {Object} app - App object
   * @returns {boolean} True if app is Tab Manager
   */
  isTabManager(app) {
    return (
      app.component === 'tab-manager' &&
      app.id.startsWith(this.TAB_MANAGER_PREFIX)
    );
  }

  /**
   * Get group ID from Tab Manager app ID
   * @param {string} tabManagerId - Tab Manager app ID
   * @returns {string} Group ID
   */
  getGroupIdFromTabManagerId(tabManagerId) {
    return tabManagerId.replace(this.TAB_MANAGER_PREFIX, '');
  }
}

export default new TabManagerService();
