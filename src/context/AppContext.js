import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  openApps: [],
  activeApp: null,
  nextZIndex: 1000,
  theme: 'light',
  windowGroups: [], // Array of window groups
  activeGroup: null, // Currently active group
  tabGroups: [], // Array of tab groups
};

function appReducer(state, action) {
  switch (action.type) {
    case 'OPEN_APP':
      if (state.openApps.find((app) => app.id === action.payload.id)) {
        return {
          ...state,
          activeApp: action.payload.id,
          openApps: state.openApps.map((app) =>
            app.id === action.payload.id
              ? {
                  ...app,
                  zIndex: state.nextZIndex,
                  alwaysOnTop: app.alwaysOnTop || false, // Ensure alwaysOnTop is defined
                }
              : app,
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }
      return {
        ...state,
        openApps: [
          ...state.openApps,
          {
            ...action.payload,
            zIndex: state.nextZIndex,
            alwaysOnTop: action.payload.alwaysOnTop || false, // Use provided alwaysOnTop or default to false
            groupId: action.payload.groupId || null, // Use provided groupId or default to null
          },
        ],
        activeApp: action.payload.id,
        nextZIndex: state.nextZIndex + 1,
      };
    case 'CLOSE_APP':
      return {
        ...state,
        openApps: state.openApps.filter((app) => app.id !== action.payload),
        activeApp: state.activeApp === action.payload ? null : state.activeApp,
      };
    case 'SET_ACTIVE_APP':
      return {
        ...state,
        activeApp: action.payload,
        openApps: state.openApps.map((app) =>
          app.id === action.payload
            ? { ...app, zIndex: state.nextZIndex, minimized: false }
            : app,
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    case 'MINIMIZE_APP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.appId // ✅ Consistent payload
            ? { ...app, isMinimized: true } // ✅ Use isMinimized
            : app,
        ),
        activeApp:
          state.activeApp === action.payload.appId ? null : state.activeApp,
      };

    case 'RESTORE_APP': // ✅ Add missing action
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.appId
            ? { ...app, isMinimized: false }
            : app,
        ),
        activeApp: action.payload.appId,
      };

    case 'TOGGLE_APP':
      const targetApp = state.openApps.find((app) => app.id === action.payload);
      if (!targetApp) return state;

      if (state.activeApp === action.payload && !targetApp.isMinimized) {
        // App is active and not minimized -> minimize it
        return {
          ...state,
          activeApp: null,
          openApps: state.openApps.map((app) =>
            app.id === action.payload ? { ...app, isMinimized: true } : app,
          ),
        };
      } else {
        // App is minimized or not active -> focus and restore it
        return {
          ...state,
          activeApp: action.payload,
          openApps: state.openApps.map((app) =>
            app.id === action.payload
              ? { ...app, zIndex: state.nextZIndex, isMinimized: false }
              : app,
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }
    case 'TOGGLE_ALWAYS_ON_TOP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.appId
            ? {
                ...app,
                alwaysOnTop: !app.alwaysOnTop,
              }
            : app,
        ),
      };
    case 'CREATE_WINDOW_GROUP':
      return {
        ...state,
        windowGroups: [...state.windowGroups, action.payload.group],
        openApps: state.openApps.map((app) =>
          action.payload.windowIds.includes(app.id)
            ? { ...app, groupId: action.payload.group.id }
            : app,
        ),
      };
    case 'DESTROY_WINDOW_GROUP':
      return {
        ...state,
        windowGroups: state.windowGroups.filter(
          (group) => group.id !== action.payload.groupId,
        ),
        openApps: state.openApps
          .filter((app) => app.id !== `tab-manager-${action.payload.groupId}`) // Remove Tab Manager
          .map((app) =>
            app.groupId === action.payload.groupId
              ? { ...app, groupId: null }
              : app,
          ),
        activeGroup:
          state.activeGroup === action.payload.groupId
            ? null
            : state.activeGroup,
      };
    case 'ADD_WINDOW_TO_GROUP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.windowId
            ? {
                ...app,
                groupId: action.payload.groupId,
                tabGroupId: action.payload.tabGroupId,
              }
            : app,
        ),
        windowGroups: state.windowGroups.map((group) =>
          group.id === action.payload.groupId
            ? {
                ...group,
                windows: group.windows.includes(action.payload.windowId)
                  ? group.windows
                  : [...group.windows, action.payload.windowId],
              }
            : group,
        ),
        tabGroups: state.tabGroups.map((group) =>
          group.id === action.payload.tabGroupId
            ? {
                ...group,
                windows: group.windows.includes(action.payload.windowId)
                  ? group.windows
                  : [...group.windows, action.payload.windowId],
              }
            : group,
        ),
      };
    case 'REMOVE_WINDOW_FROM_GROUP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.windowId
            ? { ...app, groupId: null, tabGroupId: null }
            : app,
        ),
        windowGroups: state.windowGroups.map((group) =>
          group.id === action.payload.groupId
            ? {
                ...group,
                windows: group.windows.filter(
                  (id) => id !== action.payload.windowId,
                ),
              }
            : group,
        ),
        tabGroups: state.tabGroups.map((group) =>
          group.id === action.payload.tabGroupId
            ? {
                ...group,
                windows: group.windows.filter(
                  (id) => id !== action.payload.windowId,
                ),
              }
            : group,
        ),
      };
    case 'UPDATE_WINDOW_GROUP':
      return {
        ...state,
        windowGroups: state.windowGroups.map((group) =>
          group.id === action.payload.groupId
            ? { ...group, ...action.payload.updates }
            : group,
        ),
      };
    case 'SET_ACTIVE_GROUP':
      return {
        ...state,
        activeGroup: action.payload.groupId,
      };
    case 'CREATE_TAB_GROUP':
      return {
        ...state,
        tabGroups: [...state.tabGroups, action.payload.tabGroup],
        openApps: state.openApps.map((app) =>
          action.payload.windowIds.includes(app.id)
            ? { ...app, tabGroupId: action.payload.tabGroup.id }
            : app,
        ),
      };
    case 'DESTROY_TAB_GROUP':
      return {
        ...state,
        tabGroups: state.tabGroups.filter(
          (group) => group.id !== action.payload.tabGroupId,
        ),
        openApps: state.openApps.map((app) =>
          app.tabGroupId === action.payload.tabGroupId
            ? { ...app, tabGroupId: null }
            : app,
        ),
      };
    case 'UPDATE_TAB_GROUP':
      return {
        ...state,
        tabGroups: state.tabGroups.map((group) =>
          group.id === action.payload.tabGroupId
            ? action.payload.tabGroup
            : group,
        ),
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
