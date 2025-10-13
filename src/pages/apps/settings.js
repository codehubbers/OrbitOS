// src/pages/apps/settings.js

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';

export default function SettingsApp() {
  const { theme, currentTheme, switchTheme, themes } = useTheme();
  const { wallpaper, changeWallpaper, availableWallpapers } = useSettings();
  const [authStatus, setAuthStatus] = useState({
    connected: false,
    loading: true,
  });
  const [userEmail, setUserEmail] = useState('');

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const status = await res.json();
      setAuthStatus({ ...status, loading: false });

      if (status.connected) {
        const meRes = await fetch('/api/auth/google/me');
        if (meRes.ok) {
          const userData = await meRes.json();
          setUserEmail(userData.email);
        }
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ connected: false, loading: false });
    }
  };

  const connectToDrive = () => {
    window.location.href = '/api/auth/google/login';
  };

  const disconnectFromDrive = () => {
    document.cookie =
      'gdrive_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setAuthStatus({ connected: false, loading: false });
    setUserEmail('');
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className={`h-full ${theme.app.bg} ${theme.app.text} p-6 force-scrollbar`}
      style={{
        overflowY: 'scroll',
        height: '100%',
        maxHeight: '100%',
      }}
    >
      <h2 className="text-xl font-bold mb-6">System Settings</h2>
      <div className="space-y-6">
        {/* --- THEME SECTION --- */}
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

        {/* --- WALLPAPER SECTION --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Wallpaper</h3>
          <div className={`p-4 rounded-lg ${theme.app.table}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableWallpapers.map((imgSrc) => (
                <div
                  key={imgSrc}
                  onClick={() => changeWallpaper(imgSrc)}
                  // --- THIS IS THE FIX ---
                  // Removed the "/50" opacity modifier to fix the build error
                  className={`cursor-pointer rounded-md overflow-hidden transition-all duration-150 ring-2 ring-offset-2 ring-offset-transparent ${wallpaper === imgSrc ? 'ring-blue-500' : 'ring-transparent hover:ring-blue-400'}`}
                >
                  <img
                    src={imgSrc}
                    alt="Wallpaper thumbnail"
                    className="w-full h-20 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- INTEGRATIONS SECTION --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Integrations</h3>
          <div className={`p-4 rounded-lg ${theme.app.table}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/gdrive.png"
                  alt="Google Drive Icon"
                  className="w-6 h-6"
                />
                <label className="font-medium">Google Drive</label>
              </div>
              {authStatus.loading ? (
                <span className="text-sm italic text-gray-400">
                  Checking status...
                </span>
              ) : authStatus.connected ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-500">
                    {userEmail}
                  </span>
                  <button
                    onClick={disconnectFromDrive}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button onClick={connectToDrive} className={theme.app.button}>
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- GENERAL SETTINGS --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">General</h3>
          <div className={`p-4 rounded-lg space-y-3 ${theme.app.table}`}>
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
                onChange={(e) =>
                  handleSettingChange('autoSave', e.target.checked)
                }
                className={`w-4 h-4 ${theme.id === 'dark' ? 'accent-blue-500' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* --- ADDITIONAL SECTIONS FOR SCROLLING --- */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Display</h3>
          <div className={`p-4 rounded-lg space-y-3 ${theme.app.table}`}>
            <div className="flex items-center justify-between">
              <label className="font-medium">Window Animations</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium">Transparency Effects</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Performance</h3>
          <div className={`p-4 rounded-lg space-y-3 ${theme.app.table}`}>
            <div className="flex items-center justify-between">
              <label className="font-medium">Hardware Acceleration</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium">Reduce Motion</label>
              <input type="checkbox" className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Privacy</h3>
          <div className={`p-4 rounded-lg space-y-3 ${theme.app.table}`}>
            <div className="flex items-center justify-between">
              <label className="font-medium">Analytics</label>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium">Error Reporting</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
