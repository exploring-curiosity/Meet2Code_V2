'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export function AuthInitializer() {
  const refresh = useAuthStore((state) => state.refresh);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    if (loading) {
      refresh().catch((error) => console.error('Failed to refresh session', error));
    }
  }, [loading, refresh]);

  return null;
}
