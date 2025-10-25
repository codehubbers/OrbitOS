// src/hooks/useFileOperations.js
import { useState, useCallback } from 'react';

export const useFileOperations = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createFile = useCallback(async (name, content = '', type = 'file') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/files/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, type }),
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to create file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateFile = useCallback(async (id, updates) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/files/database', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to update file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files/database?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/files/database');
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Failed to get files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadFile = useCallback(async (filename) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/files/download?file=${encodeURIComponent(filename)}`);
      if (res.ok) {
        return await res.text();
      }
      throw new Error('Failed to download file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createFile,
    updateFile,
    deleteFile,
    getFiles,
    downloadFile,
    isLoading,
  };
};
