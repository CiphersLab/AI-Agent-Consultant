'use client';

import { useState, useEffect } from 'react';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedSessionId = localStorage.getItem('session_id');
    const storedUserId = localStorage.getItem('user_id');

    if (storedSessionId) setSessionId(storedSessionId);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const saveSession = (id: string) => {
    setSessionId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_id', id);
    }
  };

  const saveUserId = (id: string) => {
    setUserId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_id', id);
    }
  };

  const clearSession = () => {
    setSessionId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_id');
    }
  };

  return {
    sessionId,
    userId,
    saveSession,
    saveUserId,
    clearSession,
  };
}