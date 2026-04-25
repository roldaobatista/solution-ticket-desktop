'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-100 text-blue-700 border-blue-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-sky-100 text-sky-700 border-sky-200',
    outline: 'bg-transparent border border-slate-300 text-slate-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    RASCUNHO: { variant: 'default', label: 'Rascunho' },
    ABERTO: { variant: 'primary', label: 'Aberto' },
    EM_PESAGEM: { variant: 'warning', label: 'Em Pesagem' },
    AGUARDANDO_PASSAGEM: { variant: 'warning', label: 'Aguardando' },
    FECHADO: { variant: 'success', label: 'Fechado' },
    EM_MANUTENCAO: { variant: 'danger', label: 'Manutencao' },
    CANCELADO: { variant: 'danger', label: 'Cancelado' },
    NAO_ROMANEADO: { variant: 'default', label: 'Nao Romaneado' },
    ROMANEADO: { variant: 'info', label: 'Romaneado' },
    FATURADO: { variant: 'primary', label: 'Faturado' },
    PARCIALMENTE_BAIXADO: { variant: 'warning', label: 'Parc. Baixado' },
    BAIXADO: { variant: 'success', label: 'Baixado' },
    ESTORNADO: { variant: 'danger', label: 'Estornado' },
    ABERTO_ROMANEIO: { variant: 'primary', label: 'Aberto' },
    FECHADO_ROMANEIO: { variant: 'success', label: 'Fechado' },
    CANCELADO_ROMANEIO: { variant: 'danger', label: 'Cancelado' },
    ABERTA_FATURA: { variant: 'primary', label: 'Aberta' },
    PARCIALMENTE_PAGA: { variant: 'warning', label: 'Parcial' },
    PAGA: { variant: 'success', label: 'Paga' },
    CANCELADA: { variant: 'danger', label: 'Cancelada' },
    ATIVA: { variant: 'success', label: 'Ativa' },
    TRIAL: { variant: 'warning', label: 'Trial' },
    EXPIRADA: { variant: 'danger', label: 'Expirada' },
    ONLINE: { variant: 'success', label: 'Online' },
    OFFLINE: { variant: 'danger', label: 'Offline' },
    ATIVO: { variant: 'success', label: 'Ativo' },
    INATIVO: { variant: 'default', label: 'Inativo' },
  };

  const config = statusMap[status] || { variant: 'default', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
