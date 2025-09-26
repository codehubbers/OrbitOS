import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function BrowserApp() {
  const { theme } = useTheme();
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');

  const handleNavigate = () => {
    setCurrentUrl(url);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  return (
    <div className={`h-full flex flex-col ${theme.app.bg}`}>
      <div
        className={`flex items-center space-x-2 p-2 border-b ${theme.window.header}`}
      >
        <button
          onClick={handleNavigate}
          className={`px-3 py-1 rounded ${theme.app.button}`}
        >
          Go
        </button>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className={`flex-1 px-3 py-1 border rounded ${theme.app.input}`}
          placeholder="Enter URL..."
        />
      </div>
      <div className="flex-1">
        <iframe
          src={currentUrl}
          className="w-full h-full border-none"
          title="Browser"
        />
      </div>
    </div>
  );
}
