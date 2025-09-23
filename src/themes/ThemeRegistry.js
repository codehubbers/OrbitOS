// src/themes/ThemeRegistry.js

const themes = {
  light: {
    id: 'light',
    name: 'Light Mode',
    desktop: 'bg-gradient-to-br from-[#a78bfa] to-[#c084fc]',
    taskbar: 'bg-white/50 border-t border-[#d1d5db]',
    window: {
      bg: 'bg-white',
      border: 'border-[#d1d5db]',
      header: 'bg-white border-b border-[#d1d5db]',
      text: 'text-[#111827]',
      content: 'text-[#111827] bg-white'
    },
    startMenu: 'bg-white border border-gray-300',
    glass: 'bg-white/10 backdrop-blur-sm border border-white/20',
    text: {
      primary: 'text-[#111827]',
      secondary: 'text-[#374151]',
      window: 'text-[#111827]',
      startMenu: 'text-[#111827]'
    },
    app: {
      bg: 'bg-[#ffffff]',
      text: 'text-[#111827]',
      input: 'bg-[#ffffff] border-[#d1d5db] text-[#111827] placeholder-gray-500',
      button: 'bg-[#f9fafb] hover:bg-[#c4b5fd] text-[#111827]',
      table: 'bg-[#ffffff] border-[#e5e7eb]',
      tableHeader: 'bg-[#f9fafb] text-[#111827]',
      tableCell: 'bg-[#ffffff] text-[#111827] border-[#e5e7eb]',
      toolbar: 'bg-[#f9fafb] border-[#d1d5db]',
      toolbarButton: 'text-[#374151] hover:text-[#111827] hover:bg-[#c4b5fd]'
    },
    notification: 'bg-white text-[#111827] border border-gray-300'
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    desktop: 'bg-[#0b132b]',
    taskbar: 'bg-[#1c2541]/50 border-t border-[#2c3e50]',
    window: {
      bg: 'bg-black',
      border: 'border-gray-600',
      header: 'bg-gray-900 border-b border-gray-700',
      text: 'text-white',
      content: 'text-white bg-black'
    },
    startMenu: 'bg-[#1c2541] border border-[#2c3e50]',
    glass: 'bg-[#3a506b] border border-[#2c3e50]',
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      window: 'text-white',
      startMenu: 'text-white'
    },
    app: {
      bg: 'bg-black',
      text: 'text-white',
      input: 'bg-gray-800 border-gray-600 text-white placeholder-gray-400',
      button: 'bg-gray-700 hover:bg-blue-600 text-white',
      table: 'bg-gray-800 border-gray-600',
      tableHeader: 'bg-gray-900 text-white',
      tableCell: 'bg-black text-white border-gray-600',
      toolbar: 'bg-gray-900 border-gray-700',
      toolbarButton: 'text-gray-200 hover:text-white hover:bg-blue-600'
    },
    notification: 'bg-gray-800 text-white border border-gray-600'
  }
};

class ThemeRegistry {
  constructor() {
    this.themes = themes;
    this.currentTheme = 'light';
    this.injectCSS();
  }

  injectCSS() {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInFromTop {
          from {
            transform: translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideOutToTop {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100px);
            opacity: 0;
          }
        }
        @keyframes shrinkProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  getAllThemes() {
    return Object.values(this.themes);
  }

  getTheme(themeId) {
    return this.themes[themeId] || this.themes.light;
  }

  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }

  setTheme(themeId) {
    if (this.themes[themeId]) {
      this.currentTheme = themeId;
    }
  }
}

export default new ThemeRegistry();