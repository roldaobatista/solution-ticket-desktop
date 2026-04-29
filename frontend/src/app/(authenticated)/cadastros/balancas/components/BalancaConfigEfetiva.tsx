'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { getBalancaEffectiveConfig } from '@/lib/api/balanca-config';

interface Props {
  balancaId?: string | null;
}

const sourceLabel = {
  balanca: 'balanca',
  indicador: 'indicador',
  default: 'default',
};

function Row({ label, value, source }: { label: string; value: unknown; source?: string }) {
  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_auto] gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-800 break-all">
        {value == null ? '-' : String(value)}
      </span>
      <Badge variant="outline">
        {sourceLabel[source as keyof typeof sourceLabel] || 'default'}
      </Badge>
    </div>
  );
}

export function BalancaConfigEfetiva({ balancaId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['balanca-effective-config', balancaId],
    queryFn: () => getBalancaEffectiveConfig(balancaId!),
    enabled: !!balancaId,
  });

  if (!balancaId) {
    return (
      <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
        Salve a balanca para visualizar a configuracao efetiva.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
        Carregando configuracao...
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 p-4 text-sm text-red-600">
        Nao foi possivel carregar a configuracao efetiva.
      </div>
    );
  }

  const rows = [
    ['Protocolo', data.protocolo, data.sources.protocolo],
    ['Endereco', data.endereco, 'balanca'],
    ['Baud', data.serial.baudRate, data.sources['serial.baudRate']],
    ['Data bits', data.serial.dataBits, data.sources['serial.dataBits']],
    ['Paridade', data.serial.parity, data.sources['serial.parity']],
    ['Stop bits', data.serial.stopBits, data.sources['serial.stopBits']],
    ['Fluxo', data.serial.flowControl, data.sources['serial.flowControl']],
    ['Parser', data.parser.parserTipo, data.sources['parser.parserTipo']],
    ['Inicio peso', data.parser.inicioPeso, data.sources['parser.inicioPeso']],
    ['Tamanho peso', data.parser.tamanhoPeso, data.sources['parser.tamanhoPeso']],
    ['Marcador', data.parser.marcador, data.sources['parser.marcador']],
    ['Fator', data.parser.fator, data.sources['parser.fator']],
    ['Modo leitura', data.read.mode, data.sources['read.mode']],
    ['Comando', data.read.commandHex, data.sources['read.commandHex']],
    ['Intervalo', data.read.intervalMs, data.sources['read.intervalMs']],
    ['Timeout', data.read.timeoutMs, data.sources['read.timeoutMs']],
  ] as const;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Configuracao efetiva</h3>
      <div>
        {rows.map(([label, value, source]) => (
          <Row key={label} label={label} value={value} source={source} />
        ))}
      </div>
    </div>
  );
}
