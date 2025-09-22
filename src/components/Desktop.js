// src/components/Desktop.js

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import AppIcon from './AppIcon';
import Window from './Window';
import Taskbar from './Taskbar';

// --- (CHANGED) ---
// We no longer import the app components here directly for the list.
// We import our new AppRegistry service instead.
import AppRegistry from '@/system/services/AppRegistry';

// These imports are still needed for the 'appComponents' map below.
import NotesApp from '@/pages/apps/notes';
import BrowserApp from '@/pages/apps/browser';
import SettingsApp from '@/pages/apps/settings';
import MonitorApp from '@/pages/apps/monitor';

// --- (REMOVED) ---
// This entire hardcoded array is no longer needed.
// const desktopApps = [
//   { id: 'notes', name: 'Notes', icon: '📝', component: 'notes' },
//   { id: 'browser', name: 'Browser', icon: '🌐', component: 'browser' },
//   { id: 'settings', name: 'Settings', icon: '⚙️', component: 'settings' }
// ];

// --- (UNCHANGED) ---
// This mapping is still essential. It connects the string 'notes' from our
// App class instance to the actual React component NotesApp.
const appComponents = {
  // These keys MUST match the 'component' field in your App definitions.
  notes: NotesApp, // 'notes' (lowercase) matches 'notes' in NotesApp.js
  browser: BrowserApp,
  settings: SettingsApp,
  monitor: MonitorApp,
};

export default function Desktop() {
  const { state } = useApp();
  const { theme } = useTheme();
  const [appPositions, setAppPositions] = useState({});

  // --- (ADDED) ---
  // We now get our list of apps dynamically from the single source of truth.
  const desktopApps = AppRegistry.getAllApps();

  // Initialize positions if not set
  const getAppPosition = (app, index) => {
    if (appPositions[app.id]) {
      return appPositions[app.id];
    }
    const col = index % 3; // 3 columns
    const row = Math.floor(index / 3);
    return {
      x: 30 + col * 150, // 30px margin + grid spacing
      y: 30 + row * 150, // 30px margin + grid spacing
    };
  };

  const handlePositionChange = (appId, newPosition) => {
    setAppPositions((prev) => ({
      ...prev,
      [appId]: newPosition,
    }));
  };

  // --- (UNCHANGED) ---
  // This function works perfectly as is.
  const renderAppContent = (app) => {
    const AppComponent = appComponents[app.component];
    return AppComponent ? <AppComponent /> : <div>App not found</div>;
  };

  return (
    <div
      className={`h-screen w-screen relative overflow-hidden ${theme.desktop}`}
      style={{
        background:
          theme.id === 'light'
            ? 'linear-gradient(to bottom right, #a78bfa, #c084fc)'
            : '#0b132b',
      }}
    >
      {/* --- (UNCHANGED) --- */}
      {/* This mapping logic still works because our new `app` objects from the AppRegistry */}
      {/* have the same properties (id, name, etc.) as the old hardcoded objects. */}
      {desktopApps.map((app, index) => (
        <AppIcon
          key={app.id}
          app={app}
          position={getAppPosition(app, index)}
          onPositionChange={handlePositionChange}
          allApps={desktopApps.map((a, i) => ({
            ...a,
            position: getAppPosition(a, i),
          }))}
        />
      ))}

      {/* --- (UNCHANGED) --- */}
      {/* This logic is based on the global context and doesn't need to change. */}
      {state.openApps.map((app) => (
        <Window key={app.id} app={app}>
          {renderAppContent(app)}
        </Window>
      ))}

      <Taskbar />
    </div>
  );
}
