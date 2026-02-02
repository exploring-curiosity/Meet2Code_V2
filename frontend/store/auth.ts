'use client';

import { create } from 'zustand';
import { fetchSession, logout, SessionResponse } from '../lib/api';

type AuthState = {
  user: SessionResponse['user'] | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  refresh: async () => {
    set({ loading: true });
    const session = await fetchSession();
    set({ user: session.user ?? null, loading: false });
  },
  signOut: async () => {
    await logout();
    set({ user: null });
  },
}));
