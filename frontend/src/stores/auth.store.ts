import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/types';
import { login as apiLogin, getMe } from '@/lib/api';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, senha: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiLogin(email, senha);
          sessionStorage.setItem('access_token', res.access_token);
          set({ user: res.usuario, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao fazer login';
          set({ error: message, isLoading: false, isAuthenticated: false, user: null });
        }
      },

      logout: () => {
        sessionStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false, error: null });
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      checkAuth: async () => {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        try {
          const user = await getMe();
          set({ user, isAuthenticated: true });
        } catch {
          sessionStorage.removeItem('access_token');
          set({ isAuthenticated: false, user: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
