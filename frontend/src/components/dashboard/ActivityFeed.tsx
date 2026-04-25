'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuditoriaRecentes } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['auditoria-recentes'],
    queryFn: () => getAuditoriaRecentes(20),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-slate-500" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma atividade recente</p>
        ) : (
          <ul className="space-y-2 text-sm max-h-96 overflow-auto">
            {data.map((a) => {
              const dt = new Date(a.dataHora);
              const hhmm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
              return (
                <li key={a.id} className="flex gap-2 border-b border-slate-100 pb-2 last:border-0">
                  <span className="text-xs text-slate-400 font-mono shrink-0">{hhmm}</span>
                  <span className="text-slate-700">
                    {a.evento} <span className="text-slate-400">({a.entidade})</span>
                    {a.usuarioId && (
                      <span className="text-slate-500 text-xs ml-1">
                        — {a.usuarioId.slice(0, 8)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
