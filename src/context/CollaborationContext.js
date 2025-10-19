import { createContext, useContext, useEffect, useReducer } from 'react';
import { useNotification } from '@/system/services/NotificationRegistry';
import io from 'socket.io-client';

const CollaborationContext = createContext();

const collaborationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_ACTIVE_USERS':
      return { ...state, activeUsers: action.payload };
    case 'SET_DOCUMENT_CONTENT':
      return { ...state, documentContent: action.payload };
    case 'UPDATE_PRESENCE':
      return {
        ...state,
        presence: {
          ...state.presence,
          [action.payload.userId]: {
            ...action.payload,
            lastSeen: new Date(),
          },
        },
      };
    default:
      return state;
  }
};

export const CollaborationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(collaborationReducer, {
    socket: null,
    activeUsers: [],
    documentContent: null,
    presence: {},
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      path: '/api/socket/io',
      auth: { token: localStorage.getItem('token') },
    });

    socket.on('connect', () => {
      dispatch({ type: 'SET_SOCKET', payload: socket });
    });

    socket.on('user-joined', (data) => {
      showNotification(`User joined the document`, 'info');
      dispatch({ type: 'UPDATE_PRESENCE', payload: data });
    });

    socket.on('user-active', (data) => {
      dispatch({ type: 'UPDATE_PRESENCE', payload: data });
    });

    return () => socket.disconnect();
  }, [showNotification]);

  const joinDocument = (documentId) => {
    if (state.socket) {
      state.socket.emit('join-document', documentId);
    }
  };

  const sendDocumentChange = (documentId, delta, version) => {
    if (state.socket) {
      state.socket.emit('document-change', { documentId, delta, version });
    }
  };

  const sendUserActivity = (documentId, activity, position) => {
    if (state.socket) {
      state.socket.emit('user-activity', { documentId, activity, position });
    }
  };

  return (
    <CollaborationContext.Provider
      value={{
        ...state,
        joinDocument,
        sendDocumentChange,
        sendUserActivity,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error(
      'useCollaboration must be used within CollaborationProvider',
    );
  }
  return context;
};
