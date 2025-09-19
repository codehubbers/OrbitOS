import { useState } from 'react';

export default function SettingsApp() {
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    autoSave: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full p-4">
      <h2 className="text-xl font-bold mb-4">System Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-medium">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleSettingChange('theme', e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="font-medium">Notifications</label>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            className="w-4 h-4"
          />
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
        <pre className="text-sm">{JSON.stringify(settings, null, 2)}</pre>
      </div>
    </div>
  );
}