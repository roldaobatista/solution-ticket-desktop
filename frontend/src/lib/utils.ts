import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(kg: number): string {
  return (
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
      kg,
    ) + ' kg'
  );
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return '-';
  }
}

export function formatDateShort(date: string | Date | undefined | null): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return '-';
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

export function statusOperacionalLabel(status: string): string {
  const labels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    ABERTO: 'Aberto',
    EM_PESAGEM: 'Em Pesagem',
    AGUARDANDO_PASSAGEM: 'Aguardando Passagem',
    FECHADO: 'Fechado',
    EM_MANUTENCAO: 'Em Manutencao',
    CANCELADO: 'Cancelado',
  };
  return labels[status] || status;
}

export function statusComercialLabel(status: string): string {
  const labels: Record<string, string> = {
    NAO_ROMANEADO: 'Nao Romaneado',
    ROMANEADO: 'Romaneado',
    FATURADO: 'Faturado',
    PARCIALMENTE_BAIXADO: 'Parcialmente Baixado',
    BAIXADO: 'Baixado',
    ESTORNADO: 'Estornado',
  };
  return labels[status] || status;
}

export function statusLicencaLabel(status: string): string {
  const labels: Record<string, string> = {
    TRIAL: 'Trial',
    ATIVA: 'Ativa',
    EXPIRADA: 'Expirada',
    BLOQUEADA: 'Bloqueada',
    INVALIDA: 'Invalida',
  };
  return labels[status] || status;
}

export function statusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    RASCUNHO: 'status-rascunho',
    ABERTO: 'status-aberto',
    EM_PESAGEM: 'status-em-pesagem',
    AGUARDANDO_PASSAGEM: 'status-aguardando-passagem',
    FECHADO: 'status-fechado',
    EM_MANUTENCAO: 'status-em-manutencao',
    CANCELADO: 'status-cancelado',
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}
