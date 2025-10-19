// src/pages/apps/filemanager.js

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useFileOperations } from '@/hooks/useFileOperations';

const FileItem = ({
  item,
  source,
  theme,
  isEditing,
  onEdit,
  onSave,
  onDoubleClick,
  onDragStart,
  onDrop,
  allItems,
}) => {
  const [editName, setEditName] = useState(item.name);
  const [error, setError] = useState('');
  const isFolder = item.type === 'folder' || item.content === null;
  const icon = isFolder ? '📁' : '📄';

  const validateName = (name) => {
    if (!name.trim()) return 'Name cannot be empty';
    if (name.includes('/') || name.includes('\\')) return 'Invalid characters';
    if (name.length > 255) return 'Name too long';
    if (allItems.some((i) => i.id !== item.id && i.name === name.trim())) {
      return 'Name already exists';
    }
    return '';
  };

  const handleSave = () => {
    const validationError = validateName(editName);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(item.id, editName);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditName(item.name);
      onEdit(null);
      setError('');
    }
  };

  return (
    <li
      className={`flex items-center p-2 rounded ${theme.app.button_subtle_hover} cursor-pointer`}
      onDoubleClick={() => onDoubleClick(item)}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={(e) => isFolder && e.preventDefault()}
      onDrop={(e) => isFolder && onDrop(e, item)}
    >
      <div className="flex items-center gap-3 flex-1">
        {icon}
        {isEditing ? (
          <div className="flex-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className={`w-full px-2 py-1 rounded border ${error ? 'border-red-500' : theme.app.input}`}
              autoFocus
            />
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        ) : (
          <span className="font-mono truncate" title={item.name}>
            {item.name}
          </span>
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const [authStatus, setAuthStatus] = useState({
    connected: false,
    loading: true,
  });
  const [driveFiles, setDriveFiles] = useState([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const status = await res.json();
      setAuthStatus({ ...status, loading: false });
      return status;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ connected: false, loading: false });
      return { connected: false };
    }
  };

  const loadDriveFiles = async () => {
    setIsDriveLoading(true);
    try {
      const status = await checkAuthStatus();
      if (status.connected) {
        const res = await fetch('/api/files/database');
        const data = await res.json();
        setDriveFiles(data);
      }
    } catch (error) {
      console.error('Failed to load drive files:', error);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const connectToDrive = () => {
    window.location.href = '/api/auth/google/login';
  };

  const fetchLocalItems = async () => {
    setIsLoadingLocal(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setLocalItems(data.files || []);
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
        fetchLocalItems();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const { createFile } = useFileOperations();

  const handleCreateItem = async (type) => {
    const defaultName = type === 'folder' ? 'New Folder' : 'New File.txt';

    try {
      if (activeSource === 'gdrive') {
        const newItem = await createFile(
          defaultName,
          type === 'folder' ? null : '',
          type,
        );
        await loadDriveFiles();
        setEditingId(newItem.id);
      }
    } catch (error) {
      console.error('Failed to create item:', error);
    }
    setShowNewModal(false);
  };

  const { updateFile } = useFileOperations();

  const handleRename = async (id, newName) => {
    try {
      await updateFile(id, { name: newName });
      loadDriveFiles();
    } catch (error) {
      console.error('Failed to rename:', error);
    }
    setEditingId(null);
  };

  const handleDoubleClick = (item) => {
    if (item.type === 'folder') {
      // Navigate to folder
      console.log('Navigate to folder:', item.name);
    } else {
      // Open file
      console.log('Open file:', item.name);
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetFolder.id) return;

    console.log('Move', draggedItem.name, 'to', targetFolder.name);
    // Implement move logic here
    setDraggedItem(null);
  };

  useEffect(() => {
    if (activeSource === 'local') {
      fetchLocalItems();
    } else if (activeSource === 'gdrive') {
      loadDriveFiles();
    }
  }, [activeSource]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Auto-sync every 5 seconds
  useEffect(() => {
    if (activeSource === 'gdrive' && authStatus.connected) {
      const interval = setInterval(() => {
        loadDriveFiles();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSource, authStatus.connected]);

  const itemsToDisplay = activeSource === 'local' ? localItems : driveFiles;
  const currentLoadingState =
    activeSource === 'local' ? isLoadingLocal : isDriveLoading;

  const renderContent = () => {
    if (currentLoadingState) {
      return <StatusMessage>Loading items...</StatusMessage>;
    }
    if (activeSource === 'gdrive' && !authStatus.connected) {
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
            isEditing={editingId === item.id}
            onEdit={setEditingId}
            onSave={handleRename}
            onDoubleClick={handleDoubleClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            allItems={itemsToDisplay}
          />
        ))}
      </ul>
    );
  };

  return (
    <div
      className={`h-full flex flex-col p-4 ${theme.app.bg} ${theme.app.text}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">File Manager</h2>
        <div className="flex gap-2">
          {activeSource === 'gdrive' && authStatus.connected && (
            <button
              onClick={() => setShowNewModal(true)}
              className={`px-3 py-2 rounded ${theme.app.button}`}
              title="New"
            >
              ➕ New
            </button>
          )}
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
            (activeSource === 'gdrive' && authStatus.connected)) && (
            <button
              onClick={() =>
                activeSource === 'gdrive' ? loadDriveFiles() : fetchLocalItems()
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
                Google Drive {!authStatus.connected && '(Not Connected)'}
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

      {/* New Item Modal */}
      {showNewModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-2xl w-80 ${theme.app.bg} border ${theme.app.border}`}
          >
            <h3 className={`text-lg font-bold mb-4 ${theme.app.text}`}>
              Create New
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleCreateItem('folder')}
                className={`w-full p-3 rounded text-left flex items-center gap-3 ${theme.app.button_subtle_hover}`}
              >
                📁 Folder
              </button>
              <button
                onClick={() => handleCreateItem('file')}
                className={`w-full p-3 rounded text-left flex items-center gap-3 ${theme.app.button_subtle_hover}`}
              >
                📄 Text File
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowNewModal(false)}
                className={`px-4 py-2 rounded ${theme.app.button}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
