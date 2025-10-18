import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

const CollaborationToolbar = ({
  activeUsers,
  presence,
  onShare,
  documentId,
}) => {
  const { theme } = useTheme();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');

  return (
    <div
      className={`flex items-center justify-between p-2 border-b ${theme.app.toolbar}`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm">Collaborators:</span>
        {Object.values(presence).map((user) => (
          <div
            key={user.userId}
            className="flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800"
            title={`Active: ${new Date(user.timestamp).toLocaleTimeString()}`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs">{user.userId}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowShareDialog(true)}
          className={`px-3 py-1 rounded ${theme.app.button}`}
        >
          Share
        </button>
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="absolute top-12 right-2 bg-white border rounded-lg shadow-lg p-4 z-50">
          <h3 className="font-semibold mb-2">Share Document</h3>
          <input
            type="email"
            placeholder="Enter email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            className="border rounded px-2 py-1 mb-2 w-full"
          />
          <select
            value={sharePermission}
            onChange={(e) => setSharePermission(e.target.value)}
            className="border rounded px-2 py-1 mb-2 w-full"
          >
            <option value="view">Can view</option>
            <option value="comment">Can comment</option>
            <option value="edit">Can edit</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                onShare(shareEmail, sharePermission);
                setShowShareDialog(false);
              }}
              className="flex-1 bg-blue-500 text-white rounded px-3 py-1"
            >
              Share
            </button>
            <button
              onClick={() => setShowShareDialog(false)}
              className="flex-1 bg-gray-300 rounded px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationToolbar;
