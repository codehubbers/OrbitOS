import { useApp } from '@/context/AppContext';

export default function AppIcon({ app, position }) {
  const { dispatch } = useApp();

  const handleDoubleClick = () => {
    dispatch({ type: 'OPEN_APP', payload: app });
  };

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer select-none"
      style={{ left: position.x, top: position.y }}
      onDoubleClick={handleDoubleClick}
    >
      <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl mb-2 hover:bg-blue-600 transition-colors">
        {app.icon}
      </div>
      <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
        {app.name}
      </span>
    </div>
  );
}
