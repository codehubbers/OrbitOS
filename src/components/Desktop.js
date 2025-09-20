// src/components/Desktop.js

import { useApp } from '@/context/AppContext';
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
  notes: NotesApp,      // 'notes' (lowercase) matches 'notes' in NotesApp.js
  browser: BrowserApp,
  settings: SettingsApp
};


export default function Desktop() {
  const { state } = useApp();

  // --- (ADDED) ---
  // We now get our list of apps dynamically from the single source of truth.
  const desktopApps = AppRegistry.getAllApps();


  // --- (UNCHANGED) ---
  // This function works perfectly as is.
  const renderAppContent = (app) => {
    const AppComponent = appComponents[app.component];
    return AppComponent ? <AppComponent /> : <div>App not found</div>;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-400 to-purple-600 relative overflow-hidden">
      {/* --- (UNCHANGED) --- */}
      {/* This mapping logic still works because our new `app` objects from the AppRegistry */}
      {/* have the same properties (id, name, etc.) as the old hardcoded objects. */}
      {desktopApps.map((app, index) => (
        <AppIcon
          key={app.id}
          app={app}
          position={{ x: 50, y: 50 + index * 100 }}
        />
      ))}

      {/* --- (UNCHANGED) --- */}
      {/* This logic is based on the global context and doesn't need to change. */}
      {state.openApps.map(app => (
        <Window key={app.id} app={app}>
          {renderAppContent(app)}
        </Window>
      ))}
      
      <Taskbar />
    </div>
  );
}