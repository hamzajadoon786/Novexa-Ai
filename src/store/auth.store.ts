import { create } from 'zustand';
import { authApi, UserProfile } from '../api/auth';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initializeSession: () => Promise<void>;
  register: (payload: Record<string, any>) => Promise<void>;
  login: (payload: Record<string, any>) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  syncProfile: (payload: Record<string, any>) => Promise<void>;
  clearErrors: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  async initializeSession() {
    set({ isLoading: true, error: null });
    const token = localStorage.getItem('_nvx_auth_token_');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  async register(payload) {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(payload);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failure.', isLoading: false });
      throw err;
    }
  },

  async login(payload) {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(payload);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Authentication invalid.', isLoading: false });
      throw err;
    }
  },

  async loginWithGoogle(credential) {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.googleLogin(credential);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Google verification failed.', isLoading: false });
    }
  },

  async logout() {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  async syncProfile(payload) {
    try {
      const updatedUser = await authApi.updateProfile(payload);
      set({ user: updatedUser });
    } catch (err: any) {
      set({ error: err.message || 'Failed to modify profile records.' });
      throw err;
    }
  },

  clearErrors: () => set({ error: null })
}));
