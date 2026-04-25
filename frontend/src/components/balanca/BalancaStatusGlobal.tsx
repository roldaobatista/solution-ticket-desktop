'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { getBalancas, getBalancaStatus } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Badge que mostra o status da balanca ativa da unidade.
 * Polla /status a cada 5s. Clique leva para /cadastros/balancas.
 */
export function BalancaStatusGlobal({ className }: { className?: string }) {
  const { data: balancasData } = useQuery({
    queryKey: ['balancas', 'global-status'],
    queryFn: () => getBalancas(1, 50),
    staleTime: 60_000,
  });

  const balancaAtiva =
    balancasData?.data?.find((b) => b.ativa !== false && b.ativo !== false) ||
    balancasData?.data?.[0];

  const [status, setStatus] = useState<{ online: boolean; erro?: string | null }>({
    online: false,
    erro: null,
  });

  useEffect(() => {
    if (!balancaAtiva?.id) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const s = await getBalancaStatus(balancaAtiva.id);
        if (!cancelled) setStatus({ online: s.online, erro: s.erro });
      } catch {
        if (!cancelled) setStatus({ online: false, erro: 'sem resposta' });
      }
    };

    tick();
    const iv = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [balancaAtiva?.id]);

  if (!balancaAtiva) {
    return (
      <Link
        href="/cadastros/balancas"
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors',
          className,
        )}
      >
        <WifiOff className="w-3.5 h-3.5" />
        Nenhuma balanca
      </Link>
    );
  }

  const isOnline = status.online;
  const hasErro = !!status.erro;

  return (
    <Link
      href="/cadastros/balancas"
      title={status.erro || undefined}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
        isOnline &&
          !hasErro &&
          'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        !isOnline && !hasErro && 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
        hasErro && 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        className,
      )}
    >
      {hasErro ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : isOnline ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      <span className="truncate max-w-[180px]">
        Balanca: {balancaAtiva.nome} {hasErro ? 'ERRO' : isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </Link>
  );
}

export default BalancaStatusGlobal;
