export const opacitySettings = {
  taskbar: 50,
  appIcon: 50,
  window: 100,
};

export const themes = {
  light: {
    desktop: 'bg-gray-200',
    taskbar: 'bg-white/50 backdrop-blur-md border-t border-gray-200/50',
    window: 'bg-white border border-gray-300 shadow-xl',
    windowHeader: 'bg-gray-100 border-b border-gray-200',
    appIcon: 'bg-white/50 hover:bg-white/70 border border-gray-200/50',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
  },
  dark: {
    desktop: 'bg-gray-900',
    taskbar: 'bg-gray-800/50 backdrop-blur-md border-t border-gray-600/50',
    window: 'bg-gray-800 border border-gray-600 shadow-xl',
    windowHeader: 'bg-gray-700 border-b border-gray-600',
    appIcon: 'bg-gray-800/50 hover:bg-gray-700/70 border border-gray-600/50',
    text: 'text-white',
    textSecondary: 'text-gray-300',
  },
};
