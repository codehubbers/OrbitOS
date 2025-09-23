// src/context/ThemeContext.js

import { createContext, useContext, useState } from 'react';
import ThemeRegistry from '@/themes/ThemeRegistry';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light');

  const switchTheme = (themeId) => {
    setCurrentTheme(themeId);
    ThemeRegistry.setTheme(themeId);
  };

  const theme = ThemeRegistry.getTheme(currentTheme);

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, switchTheme, themes: ThemeRegistry.getAllThemes() }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}