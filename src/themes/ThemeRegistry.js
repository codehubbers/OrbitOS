// src/themes/ThemeRegistry.js

// Import the themes from their dedicated files.
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { highContrastTheme } from './darkTheme';

class ThemeRegistry {
  constructor() {
    this.themes = new Map();
    this.defaultThemeId = 'light';
    this.currentThemeId = 'light'; // Keep track of the active theme ID

    // Register all available themes
    this.register(lightTheme);
    this.register(darkTheme);
    this.register(highContrastTheme);

    // Keep your custom CSS injection
    this.injectCSS();
  }

  /**
   * Adds a theme object to the registry.
   * @param {object} theme - A theme object with a unique 'id'.
   */
  register(theme) {
    if (theme && theme.id) {
      this.themes.set(theme.id, theme);
    } else {
      console.warn('Attempted to register an invalid theme.', theme);
    }
  }

  // Your custom animation injector - unchanged.
  injectCSS() {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInFromRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutToRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        @keyframes shrinkProgress { from { width: 100%; } to { width: 0%; } }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Returns an array of all registered theme objects.
   * @returns {Array<object>}
   */
  getAllThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Retrieves a theme object by its ID.
   * @param {string} themeId - The ID of the theme.
   * @returns {object} The theme object.
   */
  getTheme(themeId) {
    return this.themes.get(themeId) || this.themes.get(this.defaultThemeId);
  }

  /**
   * Gets the currently active theme object.
   * @returns {object}
   */
  getCurrentTheme() {
    return this.getTheme(this.currentThemeId);
  }
  
  /**
   * Sets the active theme ID.
   * @param {string} themeId - The ID of the theme to set.
   */
  setTheme(themeId) {
    if (this.themes.has(themeId)) {
      this.currentThemeId = themeId;
    }
  }
}

// Export a single instance for the whole app.
const instance = new ThemeRegistry();
export default instance;