/**
 * @fileoverview AppContext - Global state management for window and app operations
 *
 * This context manages the global state for all applications and windows in the OS.
 * It uses the Redux pattern with useReducer for predictable state updates.
 *
 * Features:
 * - Window lifecycle management (open, close, minimize, maximize)
 * - Window resize and position tracking
 * - Z-index management for window layering
 * - Active window tracking
 * - State persistence and synchronization
 */

import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

/**
 * Initial state for the application context
 * @typedef {Object} AppState
 * @property {Array} openApps - Array of currently open applications
 * @property {string|null} activeApp - ID of the currently active application
 * @property {number} nextZIndex - Next available z-index for window layering
 */
const initialState = {
  openApps: [],
  activeApp: null,
  nextZIndex: 1000,
};

/**
 * Reducer function for managing application state
 * Implements the Redux pattern for predictable state updates
 *
 * @param {AppState} state - Current application state
 * @param {Object} action - Action object with type and payload
 * @returns {AppState} New application state
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'OPEN_APP':
      // Check if app is already open
      if (state.openApps.find((app) => app.id === action.payload.id)) {
        return {
          ...state,
          activeApp: action.payload.id,
          openApps: state.openApps.map((app) =>
            app.id === action.payload.id
              ? { ...app, zIndex: state.nextZIndex }
              : app,
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }
      // Add new app with default window properties
      return {
        ...state,
        openApps: [
          ...state.openApps,
          {
            ...action.payload,
            zIndex: state.nextZIndex,
            size: { width: 600, height: 400 },
            position: {
              x: 100 + Math.random() * 200,
              y: 100 + Math.random() * 100,
            },
            minimized: false,
            maximized: false,
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
            ? { ...app, zIndex: state.nextZIndex }
            : app,
        ),
        nextZIndex: state.nextZIndex + 1,
      };

    case 'MINIMIZE_APP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload
            ? { ...app, minimized: !app.minimized }
            : app,
        ),
      };

    case 'MAXIMIZE_APP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.id
            ? {
                ...app,
                maximized: !app.maximized,
                // Store previous size and position for restore
                previousSize: app.maximized ? app.previousSize : app.size,
                previousPosition: app.maximized
                  ? app.previousPosition
                  : app.position,
                // Set maximized size and position
                size: app.maximized
                  ? app.previousSize
                  : {
                      width: window.innerWidth,
                      height: window.innerHeight - 64,
                    },
                position: app.maximized ? app.previousPosition : { x: 0, y: 0 },
              }
            : app,
        ),
      };

    case 'RESIZE_APP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.id
            ? {
                ...app,
                size: action.payload.size,
                position: action.payload.position,
              }
            : app,
        ),
      };

    case 'MOVE_APP':
      return {
        ...state,
        openApps: state.openApps.map((app) =>
          app.id === action.payload.id
            ? {
                ...app,
                position: action.payload.position,
              }
            : app,
        ),
      };

    default:
      return state;
  }
}

/**
 * AppProvider component that provides the application context
 * Wraps the entire application to provide global state management
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} AppProvider component
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook to access the application context
 * Provides access to global state and dispatch function
 *
 * @returns {Object} Context value with state and dispatch
 * @throws {Error} If used outside of AppProvider
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
