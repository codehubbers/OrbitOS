// src/pages/apps/filemanager.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useDrive } from '@/context/DriveContext';

const FileItem = ({ item, source, theme, onDownload, onShare, onDelete }) => {
  const isGdrive = source === 'gdrive';
  const icon = isGdrive ? (
    <img src={item.iconLink} alt="" className="w-5 h-5" />
  ) : (
    '📄'
  );

  const isDirectory = item.isDirectory;

  // Get the correct file ID - use item.id for Google Drive, item._id for local files
  const fileId = item.id || item._id;

  return (
    <li
      className={`flex justify-between items-center p-2 rounded ${theme.app.button_subtle_hover}`}
    >
      <div className="flex items-center gap-3 flex-1 font-mono truncate">
        {icon}
        <span
          title={item.name}
          style={{ color: isDirectory ? '#3b82f6' : undefined }}
        >
          {item.name}
          {isDirectory ? '/' : ''}
        </span>
      </div>
      <div className="flex gap-2">
        {isGdrive ? (
          <a
            href={item.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1 text-sm rounded ${theme.app.button}`}
          >
            Open
          </a>
        ) : (
          !isDirectory && (
            <>
              <button
                onClick={() => onDownload(item.name)}
                className={`px-2 py-1 text-sm rounded ${theme.app.button}`}
                title="Download File"
              >
                Download
              </button>
              <button
                onClick={() => onShare(fileId, item.name)} // FIXED: Pass fileId
                className={`px-2 py-1 text-sm rounded ${theme.app.button}`}
                title="Share File"
              >
                Share
              </button>
              <button
                onClick={() => onDelete(fileId)} // Also fix delete
                className="px-2 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                title="Delete File"
              >
                Delete
              </button>
            </>
          )
        )}
      </div>
    </li>
  );
};

const StatusMessage = ({ children }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <p className="text-gray-500 italic">{children}</p>
  </div>
);

export default function FileManagerApp() {
  const { theme } = useTheme();
  const [activeSource, setActiveSource] = useState('gdrive');
  const [localItems, setLocalItems] = useState([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- THIS IS THE FIX ---
  // We get syncFiles from the context, so it's defined and can be used.
  const {
    isConnected: isDriveConnected,
    files: driveFiles,
    isLoading: isDriveLoading,
    syncFiles,
    connectToDrive,
  } = useDrive();

  const showNotification = (message, type) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const fetchLocalItems = async () => {
    setIsLoadingLocal(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setLocalItems(data.files || []);
    } catch (error) {
      setError('Failed to load files.');
      setLocalItems([]);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchLocalItems();
        showNotification('File uploaded successfully', 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showNotification('File upload failed', 'error');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = (filename) => {
    const url = `/api/files/download?file=${encodeURIComponent(filename)}`;
    window.open(url, '_blank');
  };

  const handleShareFile = async (fileId, userEmail, permission) => {
    try {
      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: fileId, // This is the missing field
          userEmail,
          permission,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message, 'success');
      } else {
        throw new Error(data.error || 'Share failed');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleDelete = async (fileId) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchLocalItems();
      showNotification('File deleted successfully', 'success');
    } catch (error) {
      console.error('Delete file failed:', error);
      showNotification('File deletion failed', 'error');
    }
  };

  // Simple share handler that prompts for email
  const handleShareClick = async (fileId, filename) => {
    const userEmail = prompt(`Enter email to share "${filename}" with:`);
    if (!userEmail) return;

    const permission = prompt('Enter permission (view/comment/edit):', 'view');
    if (!permission) return;

    await handleShareFile(fileId, userEmail, permission);
  };

  useEffect(() => {
    if (activeSource === 'local') {
      fetchLocalItems();
    }
  }, [activeSource]);

  // Auto-sync every 10 seconds for Google Drive
  useEffect(() => {
    if (activeSource === 'gdrive' && isDriveConnected) {
      const interval = setInterval(() => {
        syncFiles(false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeSource, isDriveConnected, syncFiles]);

  const itemsToDisplay = activeSource === 'local' ? localItems : driveFiles;
  const currentLoadingState =
    activeSource === 'local' ? isLoadingLocal : isDriveLoading;

  const renderContent = () => {
    if (currentLoadingState) {
      return <StatusMessage>Loading items...</StatusMessage>;
    }
    if (activeSource === 'gdrive' && !isDriveConnected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <img
            src="/icons/gdrive.png"
            alt="Google Drive"
            className="w-16 h-16 mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">
            Connect to Google Drive
          </h3>
          <p className="text-gray-500 mb-4">
            File Manager uses Google Drive as the default storage. Please
            connect your account to continue.
          </p>
          <button
            onClick={connectToDrive}
            className={`px-6 py-2 ${theme.app.button}`}
          >
            Connect Google Drive
          </button>
        </div>
      );
    }
    if (itemsToDisplay.length === 0) {
      return <StatusMessage>This location is empty.</StatusMessage>;
    }
    return (
      <ul className="space-y-1">
        {itemsToDisplay.map((item) => (
          <FileItem
            key={item.id || item._id}
            item={item}
            source={activeSource}
            theme={theme}
            onDownload={handleDownload}
            onShare={handleShareClick}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    );
  };

  return (
    <div
      className={`h-full flex flex-col p-4 ${theme.app.bg} ${theme.app.text}`}
    >
      {error && (
        <div className="mb-4 p-2 bg-red-600 text-white rounded-lg">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-2 bg-green-600 text-white rounded-lg">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">File Manager</h2>
        <div className="flex gap-2">
          {activeSource === 'local' && (
            <>
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className={`px-3 py-2 text-sm cursor-pointer rounded ${theme.app.button} ${isUploading ? 'opacity-50' : ''}`}
                title="Upload"
              >
                {isUploading ? '⏳' : '📤'}
              </label>
            </>
          )}
          {(activeSource === 'local' ||
            (activeSource === 'gdrive' && isDriveConnected)) && (
            <button
              onClick={() =>
                activeSource === 'gdrive' ? syncFiles(true) : fetchLocalItems()
              }
              className={`p-2 rounded ${theme.app.button}`}
              title="Refresh"
            >
              🔄
            </button>
          )}
        </div>
      </div>
      <div className="flex-grow flex gap-4 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`w-48 flex-shrink-0 p-2 border rounded ${theme.app.table}`}
        >
          <h3 className="font-bold mb-2">Locations</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveSource('local')}
                className={`w-full text-left px-2 py-1 rounded ${activeSource === 'local' ? 'bg-blue-500 text-white' : theme.app.button_subtle_hover}`}
              >
                Local Files
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSource('gdrive')}
                className={`w-full text-left px-2 py-1 rounded ${activeSource === 'gdrive' ? 'bg-blue-500 text-white' : theme.app.button_subtle_hover}`}
              >
                Google Drive {!isDriveConnected && '(Not Connected)'}
              </button>
            </li>
          </ul>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-grow border rounded p-2 shadow-inner overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
