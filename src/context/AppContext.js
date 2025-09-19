import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  openApps: [],
  activeApp: null,
  nextZIndex: 1000
};

function appReducer(state, action) {
  switch (action.type) {
    case 'OPEN_APP':
      if (state.openApps.find(app => app.id === action.payload.id)) {
        return {
          ...state,
          activeApp: action.payload.id,
          openApps: state.openApps.map(app =>
            app.id === action.payload.id ? { ...app, zIndex: state.nextZIndex } : app
          ),
          nextZIndex: state.nextZIndex + 1
        };
      }
      return {
        ...state,
        openApps: [...state.openApps, { ...action.payload, zIndex: state.nextZIndex }],
        activeApp: action.payload.id,
        nextZIndex: state.nextZIndex + 1
      };
    case 'CLOSE_APP':
      return {
        ...state,
        openApps: state.openApps.filter(app => app.id !== action.payload),
        activeApp: state.activeApp === action.payload ? null : state.activeApp
      };
    case 'SET_ACTIVE_APP':
      return {
        ...state,
        activeApp: action.payload,
        openApps: state.openApps.map(app =>
          app.id === action.payload ? { ...app, zIndex: state.nextZIndex } : app
        ),
        nextZIndex: state.nextZIndex + 1
      };
    case 'MINIMIZE_APP':
      return {
        ...state,
        openApps: state.openApps.map(app =>
          app.id === action.payload ? { ...app, minimized: !app.minimized } : app
        )
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