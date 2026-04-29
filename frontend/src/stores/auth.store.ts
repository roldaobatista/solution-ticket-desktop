import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/types';
import { login as apiLogin, getMe, logout as apiLogout } from '@/lib/api';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/api/client';
import { clearUnidadeId } from './unidade.store';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, senha: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiLogin(email, senha);
          setAccessToken(res.access_token);
          set({ user: res.usuario, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erro ao fazer login';
          set({ error: message, isLoading: false, isAuthenticated: false, user: null });
        }
      },

      logout: async () => {
        try {
          await apiLogout();
        } catch {
          // O token local sera descartado mesmo se o backend ja tiver recusado a sessao.
        } finally {
          clearAccessToken();
          clearUnidadeId();
          set({ user: null, isAuthenticated: false, error: null });
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },

      checkAuth: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        try {
          const user = await getMe();
          set({ user, isAuthenticated: true });
        } catch {
          clearAccessToken();
          clearUnidadeId();
          set({ isAuthenticated: false, user: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      // F10: nome no formato "<dominio>-storage" + version explicita.
      // Bump em mudancas de shape. migrate descarta versoes desconhecidas
      // (force re-login) ao inves de deserializar lixo.
      name: 'auth-storage',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version > 1) return undefined;
        return persisted as { user: Usuario | null; isAuthenticated: boolean };
      },
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
