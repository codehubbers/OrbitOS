import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';

export const useWindowMinimize = () => {
  const { dispatch } = useApp();

  const minimizeWindow = useCallback((appId) => {
    dispatch({
      type: 'MINIMIZE_APP',
      payload: { appId }
    });
  }, [dispatch]);

  const restoreWindow = useCallback((appId) => {
    dispatch({
      type: 'RESTORE_APP', 
      payload: { appId }
    });
  }, [dispatch]);

  return { minimizeWindow, restoreWindow };
};
