// src/components/Desktop.js

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';

import AppIcon from './AppIcon';
import Window from './Window';
import EnhancedWindow from './EnhancedWindow';
import Taskbar from './Taskbar';
import AvatarEditor from './AvatarEditor';
import TopBarService from '@/system/services/TopBarService';
import TopBarDropdownService from '@/system/services/TopBarDropdownService';
import TopBarInfoAboutService from '@/system/services/TopBarInfoAboutService';
import WindowTopBarKeyShortcutRegistrationService from '@/system/services/WindowTopBarKeyShortcutRegistrationService';
import AppRegistry from '@/system/services/AppRegistry';

// App component imports for the mapping
import NotesApp from '@/pages/apps/notes';
import BrowserApp from '@/pages/apps/browser';
import SettingsApp from '@/pages/apps/settings';
import MonitorApp from '@/pages/apps/monitor';
import FilemanagerApp from '@/pages/apps/filemanager';
import Calculator from '@/pages/apps/calculator';
import AppStoreApp from '@/pages/apps/appstore';
import TabManager from './TabManager';

const appComponents = {
  notes: NotesApp,
  browser: BrowserApp,
  settings: SettingsApp,
  monitor: MonitorApp,
  filemanager: FilemanagerApp,
  calculator: Calculator,
  appstore: AppStoreApp,
  'tab-manager': TabManager,
};

// Dynamic app component for installed apps
const DynamicApp = ({ appId }) => {
  const [AppComponent, setAppComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadApp = async () => {
      try {
        // Get app code from GitHub
        const response = await fetch(
          `https://raw.githubusercontent.com/codehubbers/OrbitOSPackages/main/${appId}/App.jsx`,
        );
        const appCode = await response.text();

        // Create sandboxed component
        const componentFactory = new Function(
          'React',
          `
          ${appCode}
          return App;
        `,
        );

        const Component = componentFactory(React);
        setAppComponent(() => Component);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [appId]);

  if (loading)
    return React.createElement(
      'div',
      { style: { padding: '20px' } },
      'Loading app...',
    );
  if (error)
    return React.createElement(
      'div',
      { style: { padding: '20px', color: 'red' } },
      `Error: ${error}`,
    );
  if (!AppComponent)
    return React.createElement(
      'div',
      { style: { padding: '20px' } },
      'App not found',
    );

  return React.createElement(AppComponent);
};

export default function Desktop() {
  const { state } = useApp();
  const { theme } = useTheme();
  const { wallpaper } = useSettings();
  const { user, refreshUser } = useAuth();
  const [appPositions, setAppPositions] = useState({});
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);

  const desktopApps = AppRegistry.getAllApps();

  const getAppPosition = (app, index) => {
    if (appPositions[app.id]) {
      return appPositions[app.id];
    }
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: 30 + col * 150,
      y: 30 + row * 150,
    };
  };

  const handlePositionChange = (appId, newPosition) => {
    setAppPositions((prev) => ({ ...prev, [appId]: newPosition }));
  };

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

      // Enhanced menu handlers
      const menuHandlers = {
        onNew: () => {
          // Create a new blank document
          const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            createdAt: new Date().toISOString(),
          };

          // Save to localStorage or trigger state update
          const existingNotes = JSON.parse(
            localStorage.getItem('orbitos-notes') || '[]',
          );
          existingNotes.unshift(newNote);
          localStorage.setItem('orbitos-notes', JSON.stringify(existingNotes));

          // Reload the notes app to show new document
          window.dispatchEvent(new CustomEvent('notes-refresh'));
        },
        onOpen: () => {
          // Show document picker modal
          const event = new CustomEvent('show-notes-picker', {
            detail: { action: 'open' },
          });
          window.dispatchEvent(event);
        },
        onOpenLocal: () => {
          // Create file input for local file opening
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.txt,.md,.json,text/plain';
          fileInput.style.display = 'none';

          fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target.result;
              const newNote = {
                id: Date.now().toString(),
                title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                content: content,
                createdAt: new Date().toISOString(),
                isLocalFile: true,
              };

              // Save to notes collection
              const existingNotes = JSON.parse(
                localStorage.getItem('orbitos-notes') || '[]',
              );
              existingNotes.unshift(newNote);
              localStorage.setItem(
                'orbitos-notes',
                JSON.stringify(existingNotes),
              );

              // Load this note
              window.dispatchEvent(
                new CustomEvent('notes-load', {
                  detail: { note: newNote },
                }),
              );
            };
            reader.readAsText(file);
          };

          document.body.appendChild(fileInput);
          fileInput.click();
          document.body.removeChild(fileInput);
        },
        onSave: async () => {
          const currentNote = JSON.parse(
            localStorage.getItem('orbitos-current-note') || '{}',
          );
          const textarea = document.querySelector('.notes-textarea');
          const content = textarea ? textarea.value : '';

          try {
            const response = await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: currentNote._id, // Use database ID
                title: currentNote.title,
                content: content,
              }),
            });

            if (response.ok) {
              const { file } = await response.json();
              // Update current note with saved version from database
              localStorage.setItem(
                'orbitos-current-note',
                JSON.stringify(file),
              );
              window.dispatchEvent(
                new CustomEvent('show-notification', {
                  detail: {
                    message: 'Note saved successfully!',
                    type: 'success',
                  },
                }),
              );
            }
          } catch (error) {
            console.error('Save failed:', error);
          }
        },
        onSaveAs: async () => {
          const textarea = document.querySelector('.notes-textarea');
          const content = textarea ? textarea.value : '';
          const currentNote = JSON.parse(
            localStorage.getItem('orbitos-current-note') || '{}',
          );

          const fileName = prompt(
            'Save as:',
            currentNote.name || 'Untitled Note',
          );
          if (!fileName) return;

          try {
            const response = await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: fileName,
                content: content,
              }),
            });

            if (response.ok) {
              const { file: savedFile } = await response.json();
              localStorage.setItem(
                'orbitos-current-note',
                JSON.stringify(savedFile),
              );

              window.dispatchEvent(
                new CustomEvent('notes-title-update', {
                  detail: { name: fileName }, // Update to use 'name'
                }),
              );

              window.dispatchEvent(
                new CustomEvent('show-notification', {
                  detail: {
                    message: `File saved as "${fileName}"`,
                    type: 'success',
                  },
                }),
              );
            }
          } catch (error) {
            console.error('Save As failed:', error);
            window.dispatchEvent(
              new CustomEvent('show-notification', {
                detail: { message: 'Failed to save file', type: 'error' },
              }),
            );
          }
        },
        onPrint: () => window.print(),
        onUndo: () => document.execCommand('undo'),
        onRedo: () => document.execCommand('redo'),
        onCut: () => document.execCommand('cut'),
        onCopy: () => document.execCommand('copy'),
        onPaste: () => document.execCommand('paste'),
        onFind: () => {
          window.dispatchEvent(
            new CustomEvent('toggle-find-replace', {
              detail: { show: true, mode: 'find' },
            }),
          );
        },
        onReplace: () => {
          window.dispatchEvent(
            new CustomEvent('toggle-find-replace', {
              detail: { show: true, mode: 'replace' },
            }),
          );
        },
        onFindInFiles: () => {},
        onFindNext: () => {
          window.dispatchEvent(new Event('find-next'));
        },
        onFindPrevious: () => {
          window.dispatchEvent(new Event('find-previous'));
        },
        onSelectFindNext: () => {
          const textarea = document.querySelector('.notes-textarea');
          if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
            const selectedText = textarea.value.substring(
              textarea.selectionStart,
              textarea.selectionEnd,
            );
            window.dispatchEvent(
              new CustomEvent('find-text', {
                detail: { text: selectedText, forward: true },
              }),
            );
          }
        },
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

      const infoService = new TopBarInfoAboutService({ onShowAbout: () => {} });

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

    // Handle dynamic installed apps
    if (!AppComponent && app.component) {
      return (
        <Window key={app.id} app={app}>
          <DynamicApp appId={app.component} />
        </Window>
      );
    }

    if (!AppComponent)
      return (
        <div key={app.id}>App component not found for: {app.component}</div>
      );

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
        {app.component === 'tab-manager' ? (
          <AppComponent groupId={app.groupId} />
        ) : (
          <AppComponent />
        )}
      </Window>
    );
  };

  return (
    <div
      className={`h-screen w-screen relative overflow-hidden ${theme.desktop}`}
      style={{
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: '100% 100%', // Ensures the whole image rendered
        backgroundPosition: 'center', // Centers the image
        backgroundRepeat: 'no-repeat', // Prevents the image from tiling
      }}
    >
      {/* Desktop App Icons */}
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

      {/* Open Application Windows */}
      {state.openApps.map((app) => renderWindow(app))}

      {/* Taskbar */}
      <Taskbar onAvatarEdit={() => setShowAvatarEditor(true)} />

      {/* Avatar Editor */}
      {showAvatarEditor && (
        <AvatarEditor
          currentAvatar={user?.avatar}
          onSave={async (avatarData) => {
            try {
              const response = await fetch('/api/users/avatar', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ avatar: avatarData }),
              });

              if (!response.ok) {
                throw new Error('Failed to save avatar');
              }

              console.log('Avatar saved successfully, refreshing user...');
              setShowAvatarEditor(false);
              // Refresh user data to show new avatar
              await refreshUser();
              console.log('User refreshed, new avatar should appear');
            } catch (error) {
              throw error; // Let AvatarEditor handle the error
            }
          }}
          onClose={() => setShowAvatarEditor(false)}
        />
      )}
    </div>
  );
}
