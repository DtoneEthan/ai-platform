import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    api.setToken(response.access_token);
    set({ user: response.user, isAuthenticated: true });
  },

  register: async (username: string, email: string, password: string, inviteCode: string) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      invite_code: inviteCode,
    });
    api.setToken(response.access_token);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = api.getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const user = await api.get('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
