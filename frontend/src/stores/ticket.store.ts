import { create } from 'zustand';
import { TicketPesagem, PassagemPesagem } from '@/types';

interface TicketState {
  currentTicket: TicketPesagem | null;
  passages: PassagemPesagem[];
  currentWeight: number;
  isScaleConnected: boolean;
  isStabilized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentTicket: (ticket: TicketPesagem | null) => void;
  addPassage: (passage: PassagemPesagem) => void;
  removePassage: (passageId: string) => void;
  setCurrentWeight: (weight: number) => void;
  setScaleConnected: (connected: boolean) => void;
  setStabilized: (stabilized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTicket: () => void;

  // Calculated
  pesoBrutoApurado: () => number;
  pesoTaraApurada: () => number;
  pesoLiquidoBruto: () => number;
  pesoLiquidoFinal: () => number;
  canClose: () => boolean;
  missingPassages: () => number;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  currentTicket: null,
  passages: [],
  currentWeight: 0,
  isScaleConnected: true,
  isStabilized: false,
  isLoading: false,
  error: null,

  setCurrentTicket: (ticket) => set({ currentTicket: ticket, passages: ticket?.passagens || [] }),
  addPassage: (passage) => set((state) => ({ passages: [...state.passages, passage] })),
  removePassage: (passageId) =>
    set((state) => ({ passages: state.passages.filter((p) => p.id !== passageId) })),
  setCurrentWeight: (weight) => set({ currentWeight: weight }),
  setScaleConnected: (connected) => set({ isScaleConnected: connected }),
  setStabilized: (stabilized) => set({ isStabilized: stabilized }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearTicket: () => set({ currentTicket: null, passages: [], currentWeight: 0, error: null }),

  pesoBrutoApurado: () => {
    const { passages } = get();
    const bruto = passages.find(
      (p) => p.papel_calculo === 'BRUTO_OFICIAL' && p.status_passagem === 'VALIDA',
    );
    return bruto?.peso_capturado || 0;
  },

  pesoTaraApurada: () => {
    const { currentTicket, passages } = get();
    const taraPassage = passages.find(
      (p) => p.papel_calculo === 'TARA_OFICIAL' && p.status_passagem === 'VALIDA',
    );
    if (taraPassage) return taraPassage.peso_capturado;
    if (currentTicket?.tara_cadastrada_snapshot) return currentTicket.tara_cadastrada_snapshot;
    return 0;
  },

  pesoLiquidoBruto: () => {
    const bruto = get().pesoBrutoApurado();
    const tara = get().pesoTaraApurada();
    return Math.max(0, bruto - tara);
  },

  pesoLiquidoFinal: () => {
    const liquido = get().pesoLiquidoBruto();
    const descontos = get().currentTicket?.total_descontos || 0;
    return Math.max(0, liquido - descontos);
  },

  canClose: () => {
    const { currentTicket, passages } = get();
    if (!currentTicket) return false;
    if (
      currentTicket.status_operacional !== 'EM_PESAGEM' &&
      currentTicket.status_operacional !== 'AGUARDANDO_PASSAGEM'
    )
      return false;

    const fluxo = currentTicket.fluxo_pesagem;
    const validas = passages.filter((p) => p.status_passagem === 'VALIDA');
    const hasBruto = validas.some((p) => p.papel_calculo === 'BRUTO_OFICIAL');
    const hasTara = validas.some((p) => p.papel_calculo === 'TARA_OFICIAL');

    if (fluxo === '1PF_TARA_REFERENCIADA') return hasBruto;
    if (fluxo === '2PF_BRUTO_TARA') return hasBruto && hasTara;
    if (fluxo === '3PF_COM_CONTROLE') return hasBruto && hasTara;
    return false;
  },

  missingPassages: () => {
    const { currentTicket, passages } = get();
    if (!currentTicket) return 0;
    const fluxo = currentTicket.fluxo_pesagem;
    const validas = passages.filter((p) => p.status_passagem === 'VALIDA');
    const hasBruto = validas.some((p) => p.papel_calculo === 'BRUTO_OFICIAL');
    const hasTara = validas.some((p) => p.papel_calculo === 'TARA_OFICIAL');

    if (fluxo === '1PF_TARA_REFERENCIADA') return hasBruto ? 0 : 1;
    if (fluxo === '2PF_BRUTO_TARA') {
      if (hasBruto && hasTara) return 0;
      if (hasBruto || hasTara) return 1;
      return 2;
    }
    if (fluxo === '3PF_COM_CONTROLE') {
      if (hasBruto && hasTara) return 0;
      if (hasBruto || hasTara) return 1;
      return 2;
    }
    return 0;
  },
}));
