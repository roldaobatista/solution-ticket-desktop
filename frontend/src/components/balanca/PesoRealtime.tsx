'use client';

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getBalancaStreamUrl, getBalancaStatus, USE_MOCK } from '@/lib/api';
import { formatWeight } from '@/lib/utils';
import type { LeituraPeso } from '@/types';
import { extractMessage } from '@/lib/errors';

interface PesoRealtimeProps {
  balancaId?: string;
  compact?: boolean;
  nome?: string;
  onPesoChange?: (peso: number, estavel: boolean) => void;
}

type ConnState = 'ONLINE' | 'OFFLINE' | 'ERRO';

export function PesoRealtime({
  balancaId,
  compact = false,
  nome,
  onPesoChange,
}: PesoRealtimeProps) {
  const [leitura, setLeitura] = useState<LeituraPeso | null>(null);
  const [conn, setConn] = useState<ConnState>('OFFLINE');
  const [erro, setErro] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<number | null>(null);

  // SSE connection (real mode) or polling simulation (mock mode)
  useEffect(() => {
    if (!balancaId) return;

    if (USE_MOCK) {
      // Simula leituras via polling
      setConn('ONLINE');
      let base = 0;
      const interval = setInterval(() => {
        const target = 18000 + Math.floor(Math.random() * 20000);
        base += Math.floor((target - base) * 0.1 + (Math.random() * 400 - 200));
        const estavel = Math.random() > 0.4;
        const peso = Math.max(0, base);
        setLeitura({ peso, estavel, timestamp: new Date().toISOString() });
        onPesoChange?.(peso, estavel);
      }, 800);
      return () => clearInterval(interval);
    }

    let cancelled = false;

    const connect = () => {
      try {
        const url = getBalancaStreamUrl(balancaId);
        const es = new EventSource(url, { withCredentials: false });
        esRef.current = es;

        es.onopen = () => {
          if (cancelled) return;
          setConn('ONLINE');
          setErro(null);
        };

        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data) as LeituraPeso;
            setLeitura(data);
            setConn('ONLINE');
            setErro(null);
            onPesoChange?.(data.peso, data.estavel);
          } catch {
            // ignora mensagens nao JSON
          }
        };

        es.onerror = () => {
          if (cancelled) return;
          setConn('ERRO');
          setErro('Falha na conexao SSE');
          es.close();
          esRef.current = null;
          // Reconnect com backoff simples
          reconnectRef.current = window.setTimeout(() => {
            if (!cancelled) connect();
          }, 3000) as unknown as number;
        };
      } catch (e: unknown) {
        setConn('ERRO');
        setErro(extractMessage(e, 'Erro ao conectar'));
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [balancaId]);

  // Poll status para fallback (mesmo com SSE, marca erro/offline)
  useEffect(() => {
    if (!balancaId || USE_MOCK) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const st = await getBalancaStatus(balancaId);
        if (cancelled) return;
        if (!st.online) setConn('OFFLINE');
        if (st.erro) {
          setConn('ERRO');
          setErro(st.erro);
        }
      } catch {
        /* ignora */
      }
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [balancaId]);

  // Atualiza "ha Xs"
  useEffect(() => {
    if (!leitura) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(leitura.timestamp).getTime()) / 1000);
      setSecondsAgo(diff);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [leitura]);

  const statusBadge = () => {
    if (conn === 'ONLINE') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Wifi className="w-3 h-3" /> ONLINE
        </Badge>
      );
    }
    if (conn === 'ERRO') {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> ERRO
        </Badge>
      );
    }
    return (
      <Badge variant="danger" className="flex items-center gap-1">
        <WifiOff className="w-3 h-3" /> OFFLINE
      </Badge>
    );
  };

  const pesoDisplay = leitura ? formatWeight(leitura.peso) : '---';
  const estavel = leitura?.estavel === true;

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-slate-900 text-emerald-400 border border-slate-700">
        <span className="font-mono font-bold text-xl tracking-wider">{pesoDisplay}</span>
        {estavel && (
          <Badge variant="success" className="text-[10px]">
            ESTAVEL
          </Badge>
        )}
        {statusBadge()}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <div className="text-sm font-medium text-slate-700">
          {nome ? `Balanca: ${nome}` : 'Peso em Tempo Real'}
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          {estavel && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> ESTAVEL
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-6 bg-slate-900">
        <div
          className={cn(
            'font-mono font-bold tracking-wider',
            'text-6xl md:text-7xl',
            estavel ? 'text-emerald-400' : 'text-amber-300',
            conn !== 'ONLINE' && 'text-slate-500',
          )}
          style={{
            fontFamily: "'Courier New', monospace",
            textShadow: '0 0 20px rgba(52,211,153,0.3)',
          }}
        >
          {pesoDisplay}
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {leitura
            ? `atualizado ha ${secondsAgo}s`
            : conn === 'OFFLINE'
              ? 'aguardando conexao...'
              : 'aguardando leitura...'}
        </div>
        {erro && conn === 'ERRO' && <div className="mt-1 text-xs text-amber-400">{erro}</div>}
      </div>
    </div>
  );
}

export default PesoRealtime;
