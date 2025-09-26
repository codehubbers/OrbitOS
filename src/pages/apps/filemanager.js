import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

function FileManager() {
  const { theme } = useTheme();
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  const fetchItems = async (path) => {
    try {
      setError(null);
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setItems(data.files || []);
    } catch (error) {
      setError('Failed to load files.');
      setItems([]);
      console.error('Error fetching files:', error);
    }
  };

  const handleUpload = async (event) => {
    if (!event.target.files.length) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', event.target.files[0]);
    formData.append('path', currentPath);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchItems(currentPath);
    } catch (error) {
      setError('File upload failed.');
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  };

  const handleDownload = (filename) => {
    const url = `/api/files/download?file=${encodeURIComponent(currentPath + filename)}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (fileId) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchItems(currentPath);
    } catch (error) {
      setError('File deletion failed.');
      console.error('Delete file failed:', error);
    }
  };

  // Folder navigation disabled for now
  const navigateFolder = (folderName) => {
    alert('Folder navigation is not supported by backend yet.');
  };

  const goUpFolder = () => {
    // Disabled since no real navigation
  };

  return (
    <div
      className={`h-full flex flex-col p-4 ${theme.app.bg} ${theme.app.text}`}
    >
      <h2 className="text-2xl font-semibold mb-4">File Manager</h2>

      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={goUpFolder}
          disabled
          className={`px-3 py-1 rounded ${theme.app.button} opacity-50 cursor-not-allowed`}
        >
          Up
        </button>
        <div className="flex-1 font-mono text-sm select-text">
          {currentPath}
        </div>
        <label
          htmlFor="file-upload"
          className={`cursor-pointer px-3 py-1 border rounded ${theme.app.button} hover:bg-opacity-80`}
          title="Upload File"
        >
          {uploading ? 'Uploading…' : 'Upload File'}
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-600 text-white rounded-lg">{error}</div>
      )}

      <ul className="flex flex-col gap-2 overflow-auto flex-grow border rounded p-2 shadow-inner">
        {items.length === 0 && (
          <li className="text-center text-gray-500 italic">
            This folder is empty
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex justify-between items-center p-2 rounded cursor-default ${
              item.isDirectory ? theme.app.hoverFolder : theme.app.hoverFile
            }`}
          >
            <div
              className="flex-1 font-mono truncate"
              title={item.name}
              style={{ color: item.isDirectory ? '#3b82f6' : undefined }}
            >
              {item.isDirectory ? (
                <span>{item.name}/</span>
              ) : (
                <span>{item.name}</span>
              )}
            </div>
            <div className="flex gap-2">
              {!item.isDirectory && (
                <>
                  <button
                    onClick={() => handleDownload(item.name)}
                    className={`px-2 py-1 text-sm rounded ${theme.app.button} hover:bg-opacity-80`}
                    title="Download File"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                    title="Delete File"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileManager;
