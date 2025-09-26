// src/pages/apps/settings.js

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext'; // --- ADDED ---

export default function SettingsApp() {
  const { theme, currentTheme, switchTheme, themes } = useTheme();
  
  // --- ADDED ---
  // Get wallpaper state and functions from our SettingsContext
  const { wallpaper, changeWallpaper, availableWallpapers } = useSettings();

  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    // Added overflow-y-auto for scrolling if content gets long
    <div className={`h-full p-6 overflow-y-auto ${theme.app.bg} ${theme.app.text}`}>
      <h2 className="text-xl font-bold mb-6">System Settings</h2>

      {/* Changed to space-y-6 for better section separation */}
      <div className="space-y-6">

        {/* --- THEME SECTION (UNCHANGED) --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Appearance</h3>
          <div className={`p-4 rounded-lg ${theme.app.table}`}>
            <div className="flex items-center justify-between">
              <label className="font-medium">Theme</label>
              <select
                value={currentTheme}
                onChange={(e) => switchTheme(e.target.value)}
                className={`border rounded px-2 py-1 ${theme.app.input}`}
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- ADDED: WALLPAPER SECTION --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Wallpaper</h3>
          <div className={`p-4 rounded-lg ${theme.app.table}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableWallpapers.map((imgSrc) => (
                <div
                  key={imgSrc}
                  onClick={() => changeWallpaper(imgSrc)}
                  className={`
                    cursor-pointer rounded-md overflow-hidden transition-all duration-150
                    ring-2 ring-offset-2 ring-offset-transparent 
                    ${wallpaper === imgSrc 
                      ? 'ring-blue-500' // Highlight for the selected wallpaper
                      : 'ring-transparent hover:ring-blue-400/50' // Hover effect for others
                    }
                  `}
                >
                  <img src={imgSrc} alt="Wallpaper thumbnail" className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* --- GENERAL SETTINGS (UNCHANGED) --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">General</h3>
          <div className={`p-4 rounded-lg space-y-3 ${theme.app.table}`}>
            <div className="flex items-center justify-between">
              <label className="font-medium">Notifications</label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
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
        </div>
      </div>
    </div>
  );
}