import { create } from 'zustand';

/**
 * Store em memoria para unidade_id ativa.
 *
 * RS4: substitui localStorage.getItem('unidade_id'). Por nao persistir,
 * elimina o vetor "leio unidade ativa via XSS". Usuario re-busca via
 * getMe() apos relogin (ja era comportamento por design).
 */
interface UnidadeState {
  unidadeId: string;
  setUnidadeId: (id: string) => void;
  clearUnidadeId: () => void;
}

export const useUnidadeStore = create<UnidadeState>((set) => ({
  unidadeId: '',
  setUnidadeId: (id: string) => set({ unidadeId: id }),
  clearUnidadeId: () => set({ unidadeId: '' }),
}));

/** Helper sem hooks (uso fora de componentes React). */
export function getUnidadeId(): string {
  return useUnidadeStore.getState().unidadeId;
}

export function setUnidadeId(id: string): void {
  useUnidadeStore.getState().setUnidadeId(id);
}
