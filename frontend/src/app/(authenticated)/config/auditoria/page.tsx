'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, RefreshCw, Search } from 'lucide-react';
import { getAuditoriaRecentes } from '@/lib/api';
import { ConfigSection } from '@/components/config/ConfigShared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function ConfigAuditoriaPage() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState('');
  const { data: entradas = [], isLoading } = useQuery({
    queryKey: ['auditoria-recentes', 100],
    queryFn: () => getAuditoriaRecentes(100),
    staleTime: 15_000,
  });

  const filtradas = filtro
    ? entradas.filter((e) =>
        [e.evento, e.entidade, e.entidadeId, e.usuarioId, e.motivo]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(filtro.toLowerCase()),
      )
    : entradas;

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Auditoria</h1>
          <p className="text-sm text-slate-500 mt-1">
            Últimos 100 registros de ações realizadas no sistema. Capturado automaticamente em
            mutações via AuditInterceptor.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => qc.invalidateQueries({ queryKey: ['auditoria-recentes', 100] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar por entidade, evento, usuário..."
            className="pl-9"
          />
        </div>
        <span className="text-xs text-slate-500">
          {filtradas.length}/{entradas.length}
        </span>
      </div>

      <ConfigSection title="Histórico" icon={<Archive className="w-5 h-5 text-slate-500" />}>
        {isLoading && <p className="text-sm text-slate-500 py-2">Carregando...</p>}
        {!isLoading && filtradas.length === 0 && (
          <p className="text-sm text-slate-500 py-2">Nenhum registro.</p>
        )}
        {filtradas.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Entidade</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Usuário</th>
                  <th className="px-3 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(e.dataHora).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="default">{e.evento}</Badge>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{e.entidade}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {e.entidadeId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {e.usuarioId ? `${e.usuarioId.slice(0, 8)}…` : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-md truncate">
                      {e.motivo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ConfigSection>

      <p className="text-xs text-slate-500">
        Para consulta avançada com filtros completos, use o módulo dedicado em{' '}
        <a href="/utilitarios/diagnostico" className="text-emerald-600 hover:underline">
          Utilitários → Diagnóstico
        </a>
        .
      </p>
    </div>
  );
}
