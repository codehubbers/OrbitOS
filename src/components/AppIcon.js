// src/components/AppIcon.js
import { useApp } from '@/context/AppContext';
import { themes } from '@/system/themes';

export default function AppIcon({ app, position }) {
  const { state, dispatch } = useApp();
  const currentTheme = themes[state.theme];

  const openApp = () => {
    dispatch({ type: 'OPEN_APP', payload: app });
    dispatch({ type: 'SET_ACTIVE_APP', payload: app.id });
  };

  const isImagePath = app.icon.startsWith('/');

  return (
    <div
      className="absolute flex flex-col items-center p-2 rounded-lg w-28 text-center cursor-pointer group"
      style={{ top: position.y, left: position.x }}
      onDoubleClick={openApp}
    >
      {/* Icon container with a modern shadow and hover effect */}
      <div
        className={`w-16 h-16 p-1 rounded-xl ${currentTheme.appIcon} shadow-lg transition-transform duration-150 group-hover:scale-110`}
      >
        {isImagePath ? (
          <img
            src={app.icon}
            alt={`${app.name} icon`}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-5xl flex items-center justify-center h-full">
            {app.icon}
          </span>
        )}
      </div>

      {/* Clean text with a drop shadow to make it readable on any wallpaper */}
      <span
        className="text-white text-sm font-medium mt-2"
        style={{ textShadow: '0px 1px 4px rgba(0,0,0,0.7)' }}
      >
        {app.name}
      </span>
    </div>
  );
}
