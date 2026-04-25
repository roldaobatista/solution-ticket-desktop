import { create } from 'zustand';
import { ConfiguracaoOperacional } from '@/types';
import { getConfiguracao } from '@/lib/api';

interface ConfigState {
  configuracao: ConfiguracaoOperacional | null;
  isLoading: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<ConfiguracaoOperacional>) => void;
  clearError: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  configuracao: null,
  isLoading: false,
  error: null,

  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await getConfiguracao();
      set({ configuracao: config, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar configuracao';
      set({ error: message, isLoading: false });
    }
  },

  updateConfig: (config) => {
    set({ configuracao: { ...get().configuracao, ...config } as ConfiguracaoOperacional });
  },

  clearError: () => set({ error: null }),
}));
