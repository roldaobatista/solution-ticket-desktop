'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDiagnostico, getLogsRecentes } from '@/lib/api';
import { RefreshCw, Copy, Cpu, Database, KeyRound, FileText } from 'lucide-react';
import { useState } from 'react';

export default function DiagnosticoPage() {
  const [copiado, setCopiado] = useState(false);

  const {
    data: diag,
    refetch: refetchDiag,
    isLoading: loadDiag,
  } = useQuery({
    queryKey: ['utilitarios-diagnostico'],
    queryFn: getDiagnostico,
  });
  const {
    data: logs,
    refetch: refetchLogs,
    isLoading: loadLogs,
  } = useQuery({
    queryKey: ['utilitarios-logs'],
    queryFn: () => getLogsRecentes(50),
  });

  const atualizar = () => {
    refetchDiag();
    refetchLogs();
  };

  const copiar = async () => {
    const payload = {
      geradoEm: new Date().toISOString(),
      diagnostico: diag,
      logs: logs?.linhas?.slice(-50) || [],
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert('Nao foi possivel copiar para a area de transferencia');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostico do Sistema</h1>
          <p className="text-sm text-slate-500 mt-1">
            Informacoes tecnicas sobre ambiente, banco, licenca e logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={atualizar} isLoading={loadDiag || loadLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="primary" onClick={copiar}>
            <Copy className="w-4 h-4 mr-2" />
            {copiado ? 'Copiado!' : 'Copiar diagnostico completo'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="w-5 h-5 text-slate-500" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="text-sm space-y-2">
              <Linha k="Node" v={diag?.sistema?.node} />
              <Linha k="Electron" v={diag?.sistema?.electron || '(N/A)'} />
              <Linha k="SO" v={diag?.sistema?.os} />
              <Linha k="RAM total" v={diag?.sistema?.ram} />
              <Linha k="RAM livre" v={diag?.sistema?.ramLivre} />
              <Linha
                k="Uptime"
                v={diag?.sistema?.uptimeS ? `${diag.sistema.uptimeS}s` : undefined}
              />
              <Linha k="Plataforma" v={diag?.sistema?.platform} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-slate-500" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="text-sm space-y-2">
              <Linha k="Caminho" v={diag?.banco?.caminho} mono />
              <Linha
                k="Tamanho"
                v={diag?.banco?.tamanhoKb != null ? `${diag.banco.tamanhoKb} KB` : undefined}
              />
              <Linha k="Ultima escrita" v={diag?.banco?.ultimaEscritaIso} />
              {diag?.banco?.erro && <Linha k="Erro" v={diag.banco.erro} />}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="w-5 h-5 text-slate-500" />
              Licenca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="text-sm space-y-2">
              <Linha k="Status" v={diag?.licenca?.status} />
              <Linha k="Fingerprint" v={diag?.licenca?.fingerprint} mono />
              <Linha
                k="Dias restantes"
                v={diag?.licenca?.diasRestantes != null ? String(diag.licenca.diasRestantes) : '-'}
              />
              <Linha k="Unidade" v={diag?.licenca?.unidadeId} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-slate-500" />
              Logs Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-2 font-mono break-all">
              {logs?.caminho || '(nao encontrado)'}
            </p>
            {!logs?.existe ? (
              <p className="text-sm text-slate-400">Log nao encontrado no caminho do Electron.</p>
            ) : (
              <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded max-h-80 overflow-auto">
                {(logs.linhas || []).join('\n')}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Linha({ k, v, mono }: { k: string; v?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`text-slate-800 text-right ${mono ? 'font-mono text-xs break-all' : ''}`}>
        {v ?? '-'}
      </dd>
    </div>
  );
}
