'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sliders, Trash2, FileJson, Info } from 'lucide-react';
import { getDiagnostico, getConfiguracao } from '@/lib/api';
import { ConfigSection } from '@/components/config/ConfigShared';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';

export default function ConfigAvancadoPage() {
  const { data: diag } = useQuery({ queryKey: ['diagnostico'], queryFn: getDiagnostico });
  const { data: cfg } = useQuery({ queryKey: ['configuracao'], queryFn: () => getConfiguracao() });
  const [resetOpen, setResetOpen] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<{ version: string; platform: string }>({
    version: '-',
    platform: '-',
  });

  useEffect(() => {
    const w = window as unknown as {
      electron?: { version?: string; platform?: string };
    };
    if (w.electron) {
      setAppInfo({ version: w.electron.version || '-', platform: w.electron.platform || '-' });
    }
  }, []);

  function exportarConfig() {
    if (!cfg) return;
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuracao-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetarPrefsLocais() {
    try {
      ['ui_prefs_v1', 'seg_prefs_v1', 'not_prefs_v1'].forEach((k) => localStorage.removeItem(k));
      setResetMsg('Preferências locais resetadas. Recarregue a página para ver o efeito.');
    } catch {
      setResetMsg('Falha ao acessar localStorage');
    }
    setResetOpen(false);
  }

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Avançado</h1>
        <p className="text-sm text-slate-500 mt-1">
          Variáveis do sistema e operações de manutenção.
        </p>
      </div>

      {resetMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          {resetMsg}
        </div>
      )}

      <ConfigSection
        title="Informações do aplicativo"
        icon={<Info className="w-5 h-5 text-slate-500" />}
      >
        <KeyValueGrid
          rows={[
            ['Versão (Electron)', appInfo.version],
            ['Plataforma', appInfo.platform],
            ['Node', diag?.sistema?.node ?? '-'],
            ['SO', diag?.sistema?.os ?? '-'],
            ['RAM total', diag?.sistema?.ram ?? '-'],
            ['Uptime', `${Math.floor((diag?.sistema?.uptimeS ?? 0) / 60)} min`],
            ['Banco — caminho', diag?.banco?.caminho ?? '-'],
            ['Banco — tamanho', `${diag?.banco?.tamanhoKb ?? 0} KB`],
            ['Licença — status', diag?.licenca?.status ?? '-'],
            ['Licença — fingerprint', diag?.licenca?.fingerprint ?? '-'],
          ]}
        />
      </ConfigSection>

      <ConfigSection
        title="Exportar configuração"
        icon={<FileJson className="w-5 h-5 text-slate-500" />}
      >
        <p className="text-sm text-slate-700 mb-3">
          Baixa um JSON com a configuração operacional atual da unidade. Útil para backup
          fora-de-banco ou para replicar settings em outra instalação.
        </p>
        <Button variant="secondary" onClick={exportarConfig} disabled={!cfg}>
          <FileJson className="w-4 h-4 mr-2" /> Baixar configuracao.json
        </Button>
        <p className="text-xs text-slate-500 mt-3">
          A importação ainda é manual: edite os campos correspondentes em cada subpágina e salve.
          Importação automática chegará em uma próxima versão.
        </p>
      </ConfigSection>

      <ConfigSection
        title="Reset de preferências locais"
        icon={<Trash2 className="w-5 h-5 text-slate-500" />}
      >
        <p className="text-sm text-slate-700">
          Apaga preferências salvas só neste navegador (Aparência, Segurança e Notificações). Não
          afeta dados do servidor.
        </p>
        <div className="mt-3">
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Resetar preferências
          </Button>
        </div>
      </ConfigSection>

      <ConfigSection
        title="Para desenvolvedores"
        icon={<Sliders className="w-5 h-5 text-slate-500" />}
      >
        <p className="text-sm text-slate-700">Documentação da API REST disponível em modo dev:</p>
        <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
          <li>
            <code className="px-1 bg-slate-100 rounded">http://127.0.0.1:3001/api/docs</code> —
            Swagger (apenas com NODE_ENV diferente de production)
          </li>
          <li>
            Variáveis críticas: <code className="px-1 bg-slate-100 rounded">JWT_SECRET</code>,{' '}
            <code className="px-1 bg-slate-100 rounded">DATABASE_URL</code>,{' '}
            <code className="px-1 bg-slate-100 rounded">DISABLE_THROTTLER</code>,{' '}
            <code className="px-1 bg-slate-100 rounded">RUN_MIGRATIONS_ON_BOOT</code>
          </li>
        </ul>
      </ConfigSection>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Resetar preferências locais?"
        description="Suas preferências de aparência, segurança e notificações neste navegador serão removidas. Os defaults voltarão a ser usados."
        confirmText="Resetar"
        variant="danger"
        onConfirm={resetarPrefsLocais}
      />
    </div>
  );
}

function KeyValueGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-slate-100">
          <dt className="text-slate-500">{k}</dt>
          <dd className="text-slate-900 font-mono text-xs truncate text-right" title={v}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}
