// src/system/services/NotificationRegistry.js
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [queue, setQueue] = useState([]);

  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => {
      if (prev.length < 5) {
        return [...prev, notification];
      } else {
        setQueue(q => [...q, notification]);
        return prev;
      }
    });
  };
  
  const removeNotification = (id) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      
      // If there's space and items in queue, move one from queue to notifications
      if (filtered.length < 5 && queue.length > 0) {
        const nextNotification = { ...queue[0], id: Date.now() };
        setQueue(q => q.slice(1));
        return [...filtered, nextNotification];
      }
      
      return filtered;
    });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationToaster notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationItem = ({ notification, theme, onRemove }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(notification.duration - 500);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now() + 500);
  
  useEffect(() => {
    setTimeLeft(notification.duration - 500);
    startTimeRef.current = Date.now() + 500;
    setIsExiting(false);
    setIsPaused(false);
  }, [notification.id, notification.duration]);
  
  useEffect(() => {
    const updateTimer = () => {
      if (!isPaused && !isExiting) {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, notification.duration - 500 - elapsed);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          setIsExiting(true);
          setTimeout(() => onRemove(notification.id), 300);
          return;
        }
      }
      timerRef.current = requestAnimationFrame(updateTimer);
    };
    
    const timer = setTimeout(() => {
      timerRef.current = requestAnimationFrame(updateTimer);
    }, 500);
    
    return () => {
      clearTimeout(timer);
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isPaused, isExiting, notification.id, notification.duration, onRemove]);
  
  const secondsLeft = Math.ceil(timeLeft / 1000);
  const progressPercent = (timeLeft / (notification.duration - 500)) * 100;
  const borderOpacity = Math.max(0.1, progressPercent / 100);
  
  const formatMessage = (message) => {
    if (message.length <= 50) return message;
    
    const firstLine = message.substring(0, 50);
    const remaining = message.substring(50);
    
    if (remaining.length <= 47) {
      return `${firstLine}\n${remaining}`;
    }
    
    const secondLine = remaining.substring(0, 47) + '...';
    return `${firstLine}\n${secondLine}`;
  };
  
  return (
    <div
      className={`relative px-8 py-4 rounded-lg ${theme.notification} shadow-lg flex items-center gap-4 overflow-hidden`}
      style={{
        animation: isExiting ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.5s ease-out',
        minWidth: '300px',
        border: `2px solid rgba(59, 130, 246, ${borderOpacity})`
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        startTimeRef.current = Date.now() - (notification.duration - 500 - timeLeft);
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, rgba(59, 130, 246, 0.5) ${100 - progressPercent}%, transparent ${100 - progressPercent}%)`
        }}
      />
      <div className="flex-1 relative z-10 ml-2">
        <div className="whitespace-pre-line text-sm leading-5">
          {formatMessage(notification.message)}
        </div>
      </div>
      <div className="flex flex-col items-center border-l border-gray-400 pl-4 pr-2 relative z-10">
        <svg className="w-5 h-5 text-gray-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-mono text-gray-600">{secondsLeft}s</span>
      </div>
    </div>
  );
};

const NotificationToaster = ({ notifications, onRemove }) => {
  const { theme } = useTheme();
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          theme={theme}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};