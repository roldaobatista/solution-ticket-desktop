/**
 * Onda — preferencias do client (UI/UX) salvas em localStorage.
 * Distintas de ConfiguracaoOperacionalUnidade (servidor): aqui ficam
 * settings que afetam apenas o navegador atual (tema, densidade, idioma)
 * sem precisar de migration ou tabela.
 */

export type Tema = 'claro' | 'escuro' | 'auto';
export type Densidade = 'compacta' | 'normal' | 'confortavel';
export type Idioma = 'pt-BR' | 'en-US' | 'es-AR';

export interface UiPrefs {
  tema: Tema;
  densidade: Densidade;
  idioma: Idioma;
  pesoComCor: boolean; // peso em verde se estavel
  somNotificacao: boolean;
  atalhoF1Ajuda: boolean;
}

export interface SegurancaPrefs {
  // 1ª janela: somente preferencias declarativas. Politica de senha no
  // backend ja e fixa em 10+ chars/letra/numero (Onda 2.7).
  bloqueioInatividadeMin: number; // 0 = desabilitado
  ocultarSenhasNaImpressao: boolean;
  exigirConfirmacaoCancelamento: boolean;
}

const KEY_UI = 'ui_prefs_v1';
const KEY_SEG = 'seg_prefs_v1';

const UI_DEFAULT: UiPrefs = {
  tema: 'claro',
  densidade: 'normal',
  idioma: 'pt-BR',
  pesoComCor: true,
  somNotificacao: false,
  atalhoF1Ajuda: true,
};
const SEG_DEFAULT: SegurancaPrefs = {
  bloqueioInatividadeMin: 0,
  ocultarSenhasNaImpressao: true,
  exigirConfirmacaoCancelamento: true,
};

function load<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    return { ...def, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return def;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exhausted */
  }
}

export const uiPrefs = {
  load: () => load(KEY_UI, UI_DEFAULT),
  save: (v: UiPrefs) => save(KEY_UI, v),
  default: UI_DEFAULT,
};

export const segurancaPrefs = {
  load: () => load(KEY_SEG, SEG_DEFAULT),
  save: (v: SegurancaPrefs) => save(KEY_SEG, v),
  default: SEG_DEFAULT,
};
