'use client';

import { Hash, Info } from 'lucide-react';
import { ConfigSection } from '@/components/config/ConfigShared';

/**
 * Numeração — apresenta o formato atual em uso. Ainda não há configuração
 * persistida (formato é fixo em código); esta página documenta o
 * comportamento e prepara o terreno para customização futura via
 * ConfiguracaoOperacionalUnidade.
 */
export default function ConfigNumeracaoPage() {
  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Numeração de documentos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Formato dos números atribuídos a tickets, romaneios e faturas.
        </p>
      </div>

      <ConfigSection title="Ticket de pesagem" icon={<Hash className="w-5 h-5 text-slate-500" />}>
        <FormatCard formato="TK-{ANO}-{SEQ:04}" exemplo="TK-2026-0042" />
        <p className="text-xs text-slate-500 mt-2">
          Sequência reinicia a cada ano e é única por unidade — protegida pela constraint
          <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            unique(unidadeId, numero)
          </code>
          .
        </p>
      </ConfigSection>

      <ConfigSection title="Romaneio">
        <FormatCard formato="RM-{ANO}-{SEQ:04}" exemplo="RM-2026-0007" />
        <p className="text-xs text-slate-500 mt-2">
          Único por tenant —
          <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            unique(tenantId, numero)
          </code>
          .
        </p>
      </ConfigSection>

      <ConfigSection title="Fatura">
        <FormatCard formato="FAT-{ANO}-{SEQ:06}" exemplo="FAT-2026-000123" />
        <p className="text-xs text-slate-500 mt-2">
          Único por tenant —
          <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
            unique(tenantId, numero)
          </code>
          .
        </p>
      </ConfigSection>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Customização planejada</p>
          <p className="mt-1 text-blue-800/90">
            Em uma próxima versão será possível ajustar o prefixo (ex: usar &quot;PES&quot; em vez
            de &quot;TK&quot;) e o número de dígitos da sequência. Hoje a numeração é fixa para
            garantir compatibilidade com tickets já emitidos.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormatCard({ formato, exemplo }: { formato: string; exemplo: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Formato</p>
        <p className="font-mono text-sm text-slate-900 mt-1">{formato}</p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs text-emerald-700 uppercase tracking-wide">Exemplo</p>
        <p className="font-mono text-sm text-emerald-900 mt-1">{exemplo}</p>
      </div>
    </div>
  );
}
