/**
 * Enums centralizados — SQLite não suporta enum nativo, então usamos
 * objetos `as const` + tipos derivados em todo o backend.
 */

export const StatusOperacional = {
  RASCUNHO: 'RASCUNHO',
  ABERTO: 'ABERTO',
  EM_PESAGEM: 'EM_PESAGEM',
  AGUARDANDO_PASSAGEM: 'AGUARDANDO_PASSAGEM',
  FECHADO: 'FECHADO',
  EM_MANUTENCAO: 'EM_MANUTENCAO',
  CANCELADO: 'CANCELADO',
} as const;
export type StatusOperacional = (typeof StatusOperacional)[keyof typeof StatusOperacional];

export const StatusComercial = {
  NAO_ROMANEADO: 'NAO_ROMANEADO',
  ROMANEADO: 'ROMANEADO',
  FATURADO: 'FATURADO',
  PARCIALMENTE_BAIXADO: 'PARCIALMENTE_BAIXADO',
  BAIXADO: 'BAIXADO',
} as const;
export type StatusComercial = (typeof StatusComercial)[keyof typeof StatusComercial];

export const FluxoPesagem = {
  PF1_TARA_REFERENCIADA: 'PF1_TARA_REFERENCIADA',
  PF2_BRUTO_TARA: 'PF2_BRUTO_TARA',
  PF3_COM_CONTROLE: 'PF3_COM_CONTROLE',
} as const;
export type FluxoPesagem = (typeof FluxoPesagem)[keyof typeof FluxoPesagem];

export const TipoPassagem = {
  OFICIAL: 'OFICIAL',
  CONTROLE: 'CONTROLE',
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
} as const;
export type TipoPassagem = (typeof TipoPassagem)[keyof typeof TipoPassagem];

export const DirecaoOperacional = { ENTRADA: 'ENTRADA', SAIDA: 'SAIDA' } as const;
export type DirecaoOperacional = (typeof DirecaoOperacional)[keyof typeof DirecaoOperacional];

export const PapelCalculo = {
  BRUTO_OFICIAL: 'BRUTO_OFICIAL',
  TARA_OFICIAL: 'TARA_OFICIAL',
  CONTROLE: 'CONTROLE',
} as const;
export type PapelCalculo = (typeof PapelCalculo)[keyof typeof PapelCalculo];

export const StatusPassagem = {
  PENDENTE: 'PENDENTE',
  VALIDA: 'VALIDA',
  INVALIDADA: 'INVALIDADA',
} as const;
export type StatusPassagem = (typeof StatusPassagem)[keyof typeof StatusPassagem];

export const OrigemLeitura = {
  BALANCA_SERIAL: 'BALANCA_SERIAL',
  BALANCA_TCP: 'BALANCA_TCP',
  MANUAL: 'MANUAL',
  DISPOSITIVO: 'DISPOSITIVO',
  AUTOMATICA: 'AUTOMATICA',
} as const;
export type OrigemLeitura = (typeof OrigemLeitura)[keyof typeof OrigemLeitura];

export const StatusLicenca = {
  TRIAL: 'TRIAL',
  ATIVA: 'ATIVA',
  EXPIRADA: 'EXPIRADA',
  BLOQUEADA: 'BLOQUEADA',
  INVALIDA: 'INVALIDA',
} as const;
export type StatusLicenca = (typeof StatusLicenca)[keyof typeof StatusLicenca];

export const TaraReferenciaTipo = {
  CADASTRADA: 'CADASTRADA',
  PESADA: 'PESADA',
  CAPTURADA_EM_BALANCA: 'CAPTURADA_EM_BALANCA',
} as const;
export type TaraReferenciaTipo = (typeof TaraReferenciaTipo)[keyof typeof TaraReferenciaTipo];

export const ModoComercial = {
  DESABILITADO: 'DESABILITADO',
  HABILITADO: 'HABILITADO',
  INFORMATIVO: 'INFORMATIVO',
  OBRIGATORIO: 'OBRIGATORIO',
} as const;
export type ModoComercial = (typeof ModoComercial)[keyof typeof ModoComercial];

export const CondicaoVeiculo = {
  NAO_INFORMADO: 'NAO_INFORMADO',
  CARREGADO: 'CARREGADO',
  VAZIO: 'VAZIO',
} as const;
export type CondicaoVeiculo = (typeof CondicaoVeiculo)[keyof typeof CondicaoVeiculo];

export const StatusSolicitacaoAprovacao = {
  PENDENTE: 'PENDENTE',
  APROVADA: 'APROVADA',
  RECUSADA: 'RECUSADA',
  CANCELADA: 'CANCELADA',
} as const;
export type StatusSolicitacaoAprovacao =
  (typeof StatusSolicitacaoAprovacao)[keyof typeof StatusSolicitacaoAprovacao];
