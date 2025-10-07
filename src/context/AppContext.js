import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  openApps: [],
  activeApp: null,
  nextZIndex: 1000,
  theme: 'light',
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
            alwaysOnTop: false, // Initialize alwaysOnTop as false
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

      if (state.activeApp === action.payload && !targetApp.minimized) {
        // App is active and not minimized -> minimize it
        return {
          ...state,
          activeApp: null,
          openApps: state.openApps.map((app) =>
            app.id === action.payload ? { ...app, minimized: true } : app,
          ),
        };
      } else {
        // App is minimized or not active -> focus and maximize it
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
