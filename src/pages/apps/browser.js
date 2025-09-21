import { useState } from 'react';

export default function BrowserApp() {
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
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-2 p-2 border-b bg-gray-50">
        <button
          onClick={handleNavigate}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go
        </button>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-3 py-1 border rounded"
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
