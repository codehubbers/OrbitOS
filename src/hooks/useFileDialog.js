// src/hooks/useFileDialog.js
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useFileOperations } from './useFileOperations';
import {
  XMarkIcon,
  FolderIcon,
  CloudIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

const FileDialog = ({
  isOpen,
  onClose,
  onSelect,
  mode = 'open',
  defaultName = '',
  permittedExtensions = [],
  showExtension = true,
}) => {
  const { theme } = useTheme();
  const { getFiles, createFile } = useFileOperations();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileName, setFileName] = useState(defaultName);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('drive');
  const [authStatus, setAuthStatus] = useState({ connected: false });
  const [currentPath, setCurrentPath] = useState('/');
  const [fileExtension, setFileExtension] = useState('');

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const status = await res.json();
      setAuthStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return { connected: false };
    }
  };

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      if (currentLocation === 'drive') {
        const status = await checkAuthStatus();
        if (status.connected) {
          const data = await getFiles();
          setFiles(filterFilesByExtension(data));
        } else {
          setFiles([]);
        }
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFilesByExtension = (fileList) => {
    if (!permittedExtensions.length) return fileList;
    return fileList.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return permittedExtensions.some(
        (allowed) => allowed.toLowerCase() === ext,
      );
    });
  };

  const validateFileName = (name) => {
    if (!name.trim()) return 'File name cannot be empty';
    if (name.length > 255) return 'File name too long (max 255 characters)';
    if (/[<>:"/\\|?*]/.test(name))
      return 'File name contains invalid characters';
    if (permittedExtensions.length) {
      const ext = name.split('.').pop()?.toLowerCase();
      if (
        !ext ||
        !permittedExtensions.some((allowed) => allowed.toLowerCase() === ext)
      ) {
        return `File must have one of these extensions: ${permittedExtensions.join(', ')}`;
      }
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      setFileName(defaultName);
      const parts = defaultName.split('.');
      if (parts.length > 1) {
        setFileExtension(parts.pop());
        setFileName(parts.join('.'));
      }
    }
  }, [isOpen, defaultName, currentLocation]);

  const handleNewFile = async () => {
    const name = prompt('Enter file name:');
    if (!name) return;

    try {
      await createFile(name, '');
      await loadFiles();
      setShowNewMenu(false);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleSelect = () => {
    if (mode === 'save') {
      const fullName =
        showExtension && fileExtension
          ? `${fileName}.${fileExtension}`
          : fileName;
      const error = validateFileName(fullName);
      if (error) {
        alert(error);
        return;
      }
      onSelect({ name: fullName, isNew: true });
    }
  };

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    setCurrentPath('/');
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`rounded-lg shadow-2xl w-[800px] h-[600px] ${theme.app.bg} border ${theme.app.border} flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className={`text-xl font-bold ${theme.app.text}`}>
            {mode === 'save' ? 'Save File' : 'Open File'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${theme.app.text_subtle} ${theme.app.button_subtle_hover}`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Address Bar */}
        <div
          className={`px-4 py-2 border-b ${theme.app.border} flex items-center gap-2`}
        >
          <FolderIcon className="h-4 w-4" />
          <input
            type="text"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            className={`flex-1 px-2 py-1 rounded border ${theme.app.input} text-sm`}
            placeholder="/"
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-48 border-r ${theme.app.border} p-2`}>
            <div className="space-y-1">
              <button
                onClick={() => handleLocationChange('local')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left ${
                  currentLocation === 'local'
                    ? theme.app.button
                    : theme.app.button_subtle_hover
                }`}
              >
                <ComputerDesktopIcon className="h-4 w-4" />
                Local Files
              </button>
              {authStatus.connected && (
                <button
                  onClick={() => handleLocationChange('drive')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left ${
                    currentLocation === 'drive'
                      ? theme.app.button
                      : theme.app.button_subtle_hover
                  }`}
                >
                  <CloudIcon className="h-4 w-4" />
                  Google Drive
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* File List */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-4xl mb-2">⏳</div>
                  <p>Loading files...</p>
                </div>
              ) : currentLocation === 'drive' && !authStatus.connected ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">🔐</div>
                  <h3 className="text-lg font-semibold mb-2">
                    Connect to Google Drive
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Sign in to access your files
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = '/api/auth/google/login')
                    }
                    className={`px-4 py-2 rounded ${theme.app.button}`}
                  >
                    🔗 Connect
                  </button>
                </div>
              ) : currentLocation === 'local' ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">💻</div>
                  <h3 className="text-lg font-semibold mb-2">Local Files</h3>
                  <p className="text-gray-500">
                    Local file access not available in web version
                  </p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold mb-2">
                    No files to show
                  </h3>
                  <p className="text-gray-500">
                    Create your first file to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() =>
                        mode === 'open'
                          ? onSelect(file)
                          : setFileName(file.name.split('.')[0])
                      }
                      className={`p-3 rounded cursor-pointer flex items-center gap-3 ${theme.app.button_subtle_hover}`}
                    >
                      <div className="text-2xl">📄</div>
                      <div className="flex-1">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(file.lastModified).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className={`border-t ${theme.app.border} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium">File name:</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded border ${theme.app.input}`}
                  placeholder="Enter filename..."
                />
                {showExtension && (
                  <>
                    <span>.</span>
                    <input
                      type="text"
                      value={fileExtension}
                      onChange={(e) => setFileExtension(e.target.value)}
                      className={`w-20 px-2 py-2 rounded border ${theme.app.input}`}
                      placeholder="ext"
                    />
                  </>
                )}
              </div>

              {permittedExtensions.length > 0 && (
                <div className="text-xs text-gray-500 mb-3">
                  Allowed extensions: {permittedExtensions.join(', ')}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded ${theme.app.button_subtle_hover}`}
                >
                  Cancel
                </button>
                {mode === 'save' && (
                  <button
                    onClick={handleSelect}
                    disabled={!fileName.trim()}
                    className={`px-4 py-2 rounded ${theme.app.button} disabled:opacity-50`}
                  >
                    Save
                  </button>
                )}
                {mode === 'open' && currentLocation === 'drive' && (
                  <button
                    onClick={handleNewFile}
                    className={`px-4 py-2 rounded ${theme.app.button}`}
                  >
                    ➕ New File
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useFileDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('open');
  const [defaultName, setDefaultName] = useState('');
  const [permittedExtensions, setPermittedExtensions] = useState([]);
  const [showExtension, setShowExtension] = useState(true);
  const [onSelectCallback, setOnSelectCallback] = useState(null);

  const openDialog = (
    dialogMode = 'open',
    fileName = '',
    onSelect,
    options = {},
  ) => {
    setMode(dialogMode);
    setDefaultName(fileName);
    setPermittedExtensions(options.permittedExtensions || []);
    setShowExtension(options.showExtension !== false);
    setOnSelectCallback(() => onSelect);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setOnSelectCallback(null);
  };

  const handleSelect = (file) => {
    if (onSelectCallback) {
      onSelectCallback(file);
    }
    closeDialog();
  };

  const FileDialogComponent = () => (
    <FileDialog
      isOpen={isOpen}
      onClose={closeDialog}
      onSelect={handleSelect}
      mode={mode}
      defaultName={defaultName}
      permittedExtensions={permittedExtensions}
      showExtension={showExtension}
    />
  );

  return {
    openDialog,
    closeDialog,
    FileDialogComponent,
  };
};
