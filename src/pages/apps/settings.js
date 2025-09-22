import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsApp() {
  const { theme, currentTheme, switchTheme, themes } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (themeId) => {
    switchTheme(themeId);
  };

  return (
    <div className={`h-full p-4 ${theme.app.bg} ${theme.app.text}`}>
      <h2 className="text-xl font-bold mb-4">System Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-medium">Theme</label>
          <select
            value={currentTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className={`border rounded px-2 py-1 ${theme.app.input}`}
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium">Notifications</label>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) =>
              handleSettingChange('notifications', e.target.checked)
            }
            className={`w-4 h-4 ${theme.id === 'dark' ? 'accent-blue-500' : ''}`}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium">Auto Save</label>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            className={`w-4 h-4 ${theme.id === 'dark' ? 'accent-blue-500' : ''}`}
          />
        </div>
      </div>

      <div className={`mt-6 p-3 ${theme.app.table} rounded`}>
        <h3 className="font-medium mb-2">Current Settings:</h3>
        <pre className={`text-sm font-mono ${theme.app.text}`}>
          {JSON.stringify({ theme: currentTheme, ...settings }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
