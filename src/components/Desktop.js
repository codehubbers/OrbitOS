// src/components/Desktop.js

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import AppIcon from './AppIcon';
import Window from './Window';
import EnhancedWindow from './EnhancedWindow';
import Taskbar from './Taskbar';
import TopBarService from '@/system/services/TopBarService';
import TopBarDropdownService from '@/system/services/TopBarDropdownService';
import TopBarInfoAboutService from '@/system/services/TopBarInfoAboutService';
import WindowTopBarKeyShortcutRegistrationService from '@/system/services/WindowTopBarKeyShortcutRegistrationService';

// --- (CHANGED) ---
// We no longer import the app components here directly for the list.
// We import our new AppRegistry service instead.
import AppRegistry from '@/system/services/AppRegistry';

// These imports are still needed for the 'appComponents' map below.
import NotesApp from '@/pages/apps/notes';
import BrowserApp from '@/pages/apps/browser';
import SettingsApp from '@/pages/apps/settings';
import MonitorApp from '@/pages/apps/monitor';
import FilemanagerApp from '@/pages/apps/filemanager';

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
  filemanager: FilemanagerApp,
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

  // Create services for enhanced apps
  const createAppServices = (app) => {
    if (app.id === 'notes') {
      const topBarService = new TopBarService(
        app.id,
        app.name,
        '/icons/notes.png',
      );
      const dropdownService = new TopBarDropdownService();
      const keyShortcutService =
        new WindowTopBarKeyShortcutRegistrationService();

      // Pre-populate dropdowns to avoid delay
      const menuHandlers = {
        onNew: () => {},
        onOpen: () => {},
        onOpenLocal: () => {},
        onSave: () => {},
        onSaveAs: () => {},
        onPrint: () => window.print(),
        onUndo: () => document.execCommand('undo'),
        onRedo: () => document.execCommand('redo'),
        onCut: () => document.execCommand('cut'),
        onCopy: () => document.execCommand('copy'),
        onPaste: () => document.execCommand('paste'),
        onFind: () => {},
        onReplace: () => {},
        onFindInFiles: () => {},
        onFindNext: () => {},
        onFindPrevious: () => {},
        onSelectFindNext: () => {},
        onSelectFindPrevious: () => {},
        onFindVolatileNext: () => {},
        onFindVolatilePrevious: () => {},
        onIncrementalSearch: () => {},
        onSearchResults: () => {},
        onNextSearchResult: () => {},
        onPreviousSearchResult: () => {},
        onGoTo: () => {},
        onGoToMatchingBrace: () => {},
        onSelectBetween: () => {},
        onStyleAllOccurrences: () => {},
        onStyleOneToken: () => {},
        onClearStyle: () => {},
        onJumpUp: () => {},
        onJumpDown: () => {},
        onCopyStyledText: () => {},
        onFindInRange: () => {},
        hasChanges: false,
        hasSelection: false,
      };

      const fileDropdown = dropdownService.createFileDropdown(menuHandlers);
      const editDropdown = dropdownService.createEditDropdown(menuHandlers);
      const searchDropdown = dropdownService.createSearchDropdown(menuHandlers);
      dropdownService.addDropdown(fileDropdown.label, fileDropdown.items);
      dropdownService.addDropdown(editDropdown.label, editDropdown.items);
      dropdownService.addDropdown(searchDropdown.label, searchDropdown.items);

      const infoService = new TopBarInfoAboutService({
        onShowAbout: () => {},
      });

      return {
        topBarService,
        dropdownService,
        infoService,
        keyShortcutService,
      };
    }
    return null;
  };

  const renderWindow = (app) => {
    const services = createAppServices(app);
    const AppComponent = appComponents[app.component];

    if (!AppComponent) return <div key={app.id}>App not found</div>;

    if (services) {
      return (
        <EnhancedWindow
          key={app.id}
          app={app}
          topBarService={services.topBarService}
          dropdownService={services.dropdownService}
          infoService={services.infoService}
          keyShortcutService={services.keyShortcutService}
        >
          <AppComponent {...services} />
        </EnhancedWindow>
      );
    }
    return (
      <Window key={app.id} app={app}>
        <AppComponent />
      </Window>
    );
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

      {/* Render windows with appropriate services */}
      {state.openApps.map((app) => renderWindow(app))}

      <Taskbar />
    </div>
  );
}
