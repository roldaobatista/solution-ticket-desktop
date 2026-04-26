'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Database,
  ScrollText,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { getDiagnostico, getLogsRecentes } from '@/lib/api';
import { ConfigSection } from '@/components/config/ConfigShared';
import { Button } from '@/components/ui/button';

export default function ConfigDiagnosticoPage() {
  const qc = useQueryClient();
  const { data: diag, isLoading } = useQuery({
    queryKey: ['diagnostico'],
    queryFn: getDiagnostico,
    staleTime: 15_000,
  });
  const { data: logs } = useQuery({
    queryKey: ['logs-recentes', 30],
    queryFn: () => getLogsRecentes(30),
    staleTime: 15_000,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ['diagnostico'] });
    qc.invalidateQueries({ queryKey: ['logs-recentes', 30] });
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Diagnóstico</h1>
          <p className="text-sm text-slate-500 mt-1">
            Saúde do backend, banco e licença, além das últimas linhas de log.
          </p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Carregando...</p>}

      {diag && (
        <ConfigSection
          title="Status do sistema"
          icon={<Activity className="w-5 h-5 text-slate-500" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatusCard
              icon={<Server className="w-5 h-5" />}
              label="Sistema"
              status="ok"
              details={[
                ['Node', diag.sistema?.node ?? '-'],
                ['SO', diag.sistema?.os ?? '-'],
                ['RAM', diag.sistema?.ram ?? '-'],
                ['Uptime', `${Math.floor((diag.sistema?.uptimeS ?? 0) / 60)} min`],
              ]}
            />
            <StatusCard
              icon={<Database className="w-5 h-5" />}
              label="Banco de dados"
              status={diag.banco?.erro ? 'erro' : diag.banco?.caminho ? 'ok' : 'aviso'}
              details={[
                ['Tamanho', `${diag.banco?.tamanhoKb ?? 0} KB`],
                ['Caminho', diag.banco?.caminho ?? '-'],
              ]}
            />
            <StatusCard
              icon={<Activity className="w-5 h-5" />}
              label="Licença"
              status={
                diag.licenca?.status === 'ATIVA' || diag.licenca?.status === 'TRIAL'
                  ? 'ok'
                  : 'aviso'
              }
              details={[
                ['Status', diag.licenca?.status ?? '-'],
                ...(diag.licenca?.diasRestantes != null
                  ? [['Dias restantes', String(diag.licenca.diasRestantes)] as [string, string]]
                  : []),
              ]}
            />
          </div>
          {diag.geradoEm && (
            <p className="text-xs text-slate-500 mt-3">
              Coletado em {new Date(diag.geradoEm).toLocaleString('pt-BR')}
            </p>
          )}
        </ConfigSection>
      )}

      <ConfigSection
        title="Últimas linhas de log"
        icon={<ScrollText className="w-5 h-5 text-slate-500" />}
      >
        {logs?.caminho && (
          <p className="text-xs text-slate-500 mb-2 font-mono truncate">{logs.caminho}</p>
        )}
        {logs?.erro && <p className="text-sm text-red-700">{logs.erro}</p>}
        {logs?.linhas && logs.linhas.length > 0 ? (
          <pre className="bg-slate-900 text-emerald-300 text-xs p-3 rounded overflow-x-auto max-h-96 font-mono leading-relaxed">
            {logs.linhas.join('\n')}
          </pre>
        ) : (
          !logs?.erro && <p className="text-sm text-slate-500">Sem entradas recentes.</p>
        )}
      </ConfigSection>

      <ConfigSection title="Ferramentas avançadas">
        <Link
          href="/utilitarios/diagnostico"
          className="flex items-center justify-between py-3 hover:bg-slate-50 rounded -mx-2 px-2"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">Diagnóstico completo</p>
            <p className="text-xs text-slate-500">
              Filtros, exportação de logs e teste de conectividade.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
        <Link
          href="/utilitarios/terminal-serial"
          className="flex items-center justify-between py-3 hover:bg-slate-50 rounded -mx-2 px-2"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">Terminal serial</p>
            <p className="text-xs text-slate-500">
              Inspeciona bytes brutos da balança para diagnóstico de protocolo.
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Link>
      </ConfigSection>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  status,
  details,
}: {
  icon: React.ReactNode;
  label: string;
  status: 'ok' | 'aviso' | 'erro';
  details: [string, string][];
}) {
  const colors = {
    ok: 'border-emerald-200 bg-emerald-50',
    aviso: 'border-amber-200 bg-amber-50',
    erro: 'border-red-200 bg-red-50',
  }[status];
  const Badge_ = status === 'ok' ? CheckCircle2 : AlertCircle;
  const badgeColor =
    status === 'ok' ? 'text-emerald-600' : status === 'aviso' ? 'text-amber-600' : 'text-red-600';
  return (
    <div className={`rounded-lg border ${colors} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-slate-700">{icon}</div>
        <span className="text-sm font-semibold text-slate-900 flex-1">{label}</span>
        <Badge_ className={`w-4 h-4 ${badgeColor}`} />
      </div>
      <dl className="text-xs space-y-0.5">
        {details.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-slate-500">{k}:</dt>
            <dd className="text-slate-800 font-medium truncate" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
