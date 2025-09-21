import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function SettingsApp() {
  const { state, dispatch } = useApp();
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full p-4">
      <h2 className="text-xl font-bold mb-4">System Settings</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-medium">Theme</label>
          <select
            value={state.theme}
            onChange={(e) => {
              const newTheme = e.target.value;
              dispatch({ type: 'SET_THEME' });
              setTimeout(() => {
                dispatch({ type: 'THEME_CHANGE_COMPLETE', payload: newTheme });
              }, 1500);
            }}
            className="border rounded px-2 py-1"
            disabled={state.isThemeChanging}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
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
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium">Taskbar Opacity</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={state.opacity}
              onChange={(e) =>
                dispatch({
                  type: 'SET_OPACITY',
                  payload: parseInt(e.target.value),
                })
              }
              className="w-20"
            />
            <span className="text-sm w-8">{state.opacity}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium">Auto Save</label>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            className="w-4 h-4"
          />
        </div>
      </div>

      <div className="mt-6 p-3 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">Current Settings:</h3>
        <pre className="text-sm">
          {JSON.stringify(
            { ...settings, theme: state.theme, opacity: state.opacity },
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}
