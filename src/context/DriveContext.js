// src/context/DriveContext.js

import { createContext, useContext, useState, useEffect } from 'react';
import {
  cacheDriveFiles,
  getCachedDriveFiles,
  clearDriveCache,
} from '@/lib/driveCache';

const DriveContext = createContext();

export function DriveProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const syncFiles = async (showNotification = false) => {
    setIsLoading(true);
    try {
      // First, check if we are authenticated and get the user's email
      const authCheckResponse = await fetch('/api/auth/google/me');
      if (!authCheckResponse.ok) {
        throw new Error('Not authenticated');
      }
      const userData = await authCheckResponse.json();
      setUserEmail(userData.email);
      setIsConnected(true);

      // If authenticated, then fetch the files
      const filesResponse = await fetch('/api/files/gdrive');
      if (!filesResponse.ok) throw new Error('Failed to fetch files');
      const driveFiles = await filesResponse.json();
      setFiles(driveFiles);
      await cacheDriveFiles(driveFiles);
    } catch (error) {
      // If any step fails, we are not connected
      setIsConnected(false);
      setUserEmail(null);
      // Try to load from cache as a fallback
      const cachedFiles = await getCachedDriveFiles();
      setFiles(cachedFiles); // Show cached files even if disconnected
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncFiles();
  }, []);

  const connectToDrive = () => {
    window.location.href = '/api/auth/google/login';
  };

  const disconnectFromDrive = async () => {
    await fetch('/api/auth/google/logout');
    await clearDriveCache();
    setIsConnected(false);
    setUserEmail(null);
    setFiles([]);
  };

  const value = {
    isConnected,
    files,
    isLoading,
    userEmail,
    connectToDrive,
    disconnectFromDrive,
    syncFiles,
  };

  return (
    <DriveContext.Provider value={value}>{children}</DriveContext.Provider>
  );
}

export function useDrive() {
  return useContext(DriveContext);
}
