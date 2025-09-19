import { useApp } from '@/context/AppContext';
import AppIcon from './AppIcon';
import Window from './Window';
import Taskbar from './Taskbar';
import NotesApp from '@/pages/apps/notes';
import BrowserApp from '@/pages/apps/browser';
import SettingsApp from '@/pages/apps/settings';

const desktopApps = [
  { id: 'notes', name: 'Notes', icon: '📝', component: 'notes' },
  { id: 'browser', name: 'Browser', icon: '🌐', component: 'browser' },
  { id: 'settings', name: 'Settings', icon: '⚙️', component: 'settings' }
];

const appComponents = {
  notes: NotesApp,
  browser: BrowserApp,
  settings: SettingsApp
};

export default function Desktop() {
  const { state } = useApp();

  const renderAppContent = (app) => {
    const AppComponent = appComponents[app.component];
    return AppComponent ? <AppComponent /> : <div>App not found</div>;
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-400 to-purple-600 relative overflow-hidden">
      {/* Desktop Icons */}
      {desktopApps.map((app, index) => (
        <AppIcon
          key={app.id}
          app={app}
          position={{ x: 50, y: 50 + index * 100 }}
        />
      ))}

      {/* Open Windows */}
      {state.openApps.map(app => (
        <Window key={app.id} app={app}>
          {renderAppContent(app)}
        </Window>
      ))}

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}