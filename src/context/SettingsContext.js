// src/context/SettingsContext.js

import { createContext, useContext, useState, useEffect } from 'react';

// A list of your default wallpapers located in /public/backgrounds
const defaultWallpapers = [
  '/backgrounds/orbit-default.jpg',
  '/backgrounds/orbit-default1.jpg',
  
];

// Ensure the context is created
const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [wallpaper, setWallpaper] = useState(defaultWallpapers[0]);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem('orbitos_wallpaper');
    if (savedWallpaper && defaultWallpapers.includes(savedWallpaper)) {
      setWallpaper(savedWallpaper);
    }
  }, []);

  const changeWallpaper = async (newWallpaper) => {
    // Save locally first
    localStorage.setItem('orbitos_wallpaper', newWallpaper);
    setWallpaper(newWallpaper);
    
    // Save to server
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const { user } = await response.json();
        
        const updatedPreferences = {
          ...user.preferences,
          wallpaper: newWallpaper
        };
        
        await fetch('/api/users/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences: updatedPreferences }),
        });
      }
    } catch (error) {
      console.error('Failed to save preferences to server:', error);
    }
  };

  // --- CRITICAL PART ---
  // Ensure you are creating this 'value' object and passing it to the provider.
  const value = {
    wallpaper,
    changeWallpaper,
    availableWallpapers: defaultWallpapers,
  };

  return (
    // And that the 'value' object is passed here.
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Ensure the custom hook is exported and uses the correct context.
export function useSettings() {
  return useContext(SettingsContext);
}