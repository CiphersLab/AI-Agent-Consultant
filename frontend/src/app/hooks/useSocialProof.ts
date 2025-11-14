'use client';

import { useState, useEffect } from 'react';
import { SocialProof } from '../lib/types';
import { consultantAPI } from '../lib/api';


export function useSocialProof() {
  const [socialProof, setSocialProof] = useState<SocialProof | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSocialProof = async () => {
      try {
        const data = await consultantAPI.getSocialProof();
        setSocialProof(data);
      } catch (error) {
        console.error('Failed to fetch social proof:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialProof();

    const interval = setInterval(fetchSocialProof, 10000);

    return () => clearInterval(interval);
  }, []);

  return { socialProof, isLoading };
}