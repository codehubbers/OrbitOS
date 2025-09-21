import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

const availableApps = [
  { id: 'notes', name: 'Notes', icon: '📝', component: 'notes' },
  { id: 'browser', name: 'Browser', icon: '🌐', component: 'browser' },
  { id: 'settings', name: 'Settings', icon: '⚙️', component: 'settings' },
];

export default function Taskbar() {
  const { state, dispatch } = useApp();
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Mark as mounted after initial render
  }, []);

  useEffect(() => {
    if (mounted) {
      const updateTime = () => setCurrentTime(new Date().toLocaleTimeString());
      updateTime(); // Set initial time after mount
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const openApp = (app) => {
    dispatch({ type: 'OPEN_APP', payload: app });
    setShowStartMenu(false);
  };

  const focusApp = (appId) => {
    const app = state.openApps.find((a) => a.id === appId);
    if (app.minimized) {
      dispatch({ type: 'MINIMIZE_APP', payload: appId });
    }
    dispatch({ type: 'SET_ACTIVE_APP', payload: appId });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white h-12 flex items-center px-4 z-50">
      <div className="relative">
        <button
          onClick={() => setShowStartMenu(!showStartMenu)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
        >
          Start
        </button>
        {showStartMenu && (
          <div className="absolute bottom-12 left-0 bg-gray-700 rounded-lg shadow-lg p-2 min-w-48">
            {availableApps.map((app) => (
              <button
                key={app.id}
                onClick={() => openApp(app)}
                className="w-full text-left px-3 py-2 hover:bg-gray-600 rounded flex items-center space-x-2"
              >
                <span>{app.icon}</span>
                <span>{app.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center space-x-2 ml-4">
        {state.openApps.map((app) => (
          <button
            key={app.id}
            onClick={() => focusApp(app.id)}
            className={`px-3 py-1 rounded text-sm ${
              state.activeApp === app.id
                ? 'bg-gray-600'
                : 'bg-gray-700 hover:bg-gray-600'
            } ${app.minimized ? 'opacity-60' : ''}`}
          >
            {app.icon} {app.name}
          </button>
        ))}
      </div>

      <div className="text-sm" data-testid="clock">
        {mounted ? currentTime : ''}
      </div>
    </div>
  );
}
