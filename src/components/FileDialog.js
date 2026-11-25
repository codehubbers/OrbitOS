// src/components/FileDialog.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useDrive } from '@/context/DriveContext';

export default function FileDialog({
  isOpen,
  onClose,
  onSave,
  defaultFileName = 'Untitled.txt',
}) {
  const { theme } = useTheme();
  const { isConnected: isDriveConnected } = useDrive();

  const [fileName, setFileName] = useState(defaultFileName);
  const [location, setLocation] = useState('local'); // Default to 'local'

  // When the dialog opens, reset the fileName to the default
  useEffect(() => {
    if (isOpen) {
      setFileName(defaultFileName);
    }
  }, [isOpen, defaultFileName]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    // Pass the chosen location and filename back to the parent component
    onSave({ location, fileName });
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-2xl h-96 rounded-lg shadow-2xl flex flex-col ${theme.app.bg} border ${theme.app.border}`}
      >
        <h2
          className={`text-lg font-semibold p-4 border-b ${theme.app.border}`}
        >
          Save As
        </h2>

        <div className="flex-grow flex overflow-hidden">
          {/* Sidebar */}
          <div
            className={`w-48 p-2 border-r ${theme.app.border} bg-gray-500/5`}
          >
            <h3 className="font-bold mb-2 px-2">Locations</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setLocation('local')}
                  className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${location === 'local' ? 'bg-blue-500 text-white' : theme.app.button_subtle_hover}`}
                >
                  📄 This PC
                </button>
              </li>
              {isDriveConnected && (
                <li>
                  <button
                    onClick={() => setLocation('gdrive')}
                    className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${location === 'gdrive' ? 'bg-blue-500 text-white' : theme.app.button_subtle_hover}`}
                  >
                    {/* Ensure you have gdrive.png in /public/icons/ */}
                    <img
                      src="/icons/gdrive.png"
                      alt="Google Drive"
                      className="w-4 h-4"
                    />
                    Google Drive
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-4">
            <p className="text-gray-400 italic">
              Folder navigation is not yet implemented.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`p-4 border-t ${theme.app.border} flex items-center gap-4`}
        >
          <label htmlFor="filename-input" className="font-medium">
            File name:
          </label>
          <input
            id="filename-input"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className={`flex-grow px-2 py-1 rounded ${theme.app.input}`}
          />
          <div className="flex gap-2">
            <button onClick={handleSaveClick} className={theme.app.button}>
              Save
            </button>
            <button onClick={onClose} className={theme.app.button}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
