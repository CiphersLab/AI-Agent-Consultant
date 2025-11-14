'use client';

import { useState, useEffect, useCallback } from 'react';
import { consultantAPI } from '../lib/api';
import { ProgressResponse } from '../lib/types';


export function useProgress(sessionId: string | null, enabled: boolean = true) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!sessionId || !enabled) return;

    try {
      const data = await consultantAPI.getProgress(sessionId);
      setProgress(data);
      setError(null);

      if (data.progress_percentage >= 100) {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
      setIsPolling(false);
    }
  }, [sessionId, enabled]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(fetchProgress, 3000);
    fetchProgress();

    return () => clearInterval(interval);
  }, [isPolling, fetchProgress]);

  return {
    progress,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refetch: fetchProgress,
  };
}