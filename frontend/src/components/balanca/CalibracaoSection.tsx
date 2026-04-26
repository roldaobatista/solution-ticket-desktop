'use client';

/**
 * Onda 5.2 — Seção de calibração dentro do cadastro/configuração da balança.
 *
 * Diferente do AjusteLeituraSection (que altera fator do INDICADOR usado por
 * varias balancas), aqui registramos o HISTORICO de calibracoes por balanca:
 *  - ZERO       → operador zerou a balanca vazia (registro de auditoria)
 *  - SPAN       → calibracao com 1 peso conhecido
 *  - MULTIPONTO → entradas adicionais para curva de 3+ pontos
 *
 * Histórico exibido com data, tipo, pesos e fator calculado. Badge de
 * vencimento (>180 dias) ajuda a destacar balancas com calibracao atrasada.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listarCalibracoes,
  registrarCalibracao,
  statusCalibracao,
  type TipoCalibracao,
} from '@/lib/api/calibracao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PesoRealtime } from './PesoRealtime';
import { CheckCircle2, AlertTriangle, ClipboardList } from 'lucide-react';

interface Props {
  balancaId: string;
  onError?: (msg: string) => void;
}

const tipos: { value: TipoCalibracao; label: string; help: string }[] = [
  { value: 'ZERO', label: 'Zero', help: 'Balanca vazia. peso ref = 0.' },
  {
    value: 'SPAN',
    label: 'Span (1 ponto)',
    help: 'Coloque peso conhecido e informe o valor real.',
  },
  {
    value: 'MULTIPONTO',
    label: 'Multiponto',
    help: 'Registre pontos adicionais da curva (mesmo formato do span).',
  },
];

export function CalibracaoSection({ balancaId, onError }: Props) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<TipoCalibracao>('SPAN');
  const [pesoReferencia, setPesoReferencia] = useState('');
  const [observacao, setObservacao] = useState('');
  const [pesoAtual, setPesoAtual] = useState(0);

  const { data: status } = useQuery({
    queryKey: ['calibracao-status', balancaId],
    queryFn: () => statusCalibracao(balancaId),
    enabled: !!balancaId,
    staleTime: 60_000,
  });

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['calibracoes', balancaId],
    queryFn: () => listarCalibracoes(balancaId, 50),
    enabled: !!balancaId,
  });

  const pesoRefNumber = parseFloat(pesoReferencia.replace(',', '.'));

  const fatorPreview = useMemo(() => {
    if (tipo === 'ZERO') return 1;
    if (!pesoAtual || pesoAtual === 0 || !pesoRefNumber || pesoRefNumber <= 0) return null;
    return pesoRefNumber / pesoAtual;
  }, [tipo, pesoAtual, pesoRefNumber]);

  const registrarMut = useMutation({
    mutationFn: () =>
      registrarCalibracao(balancaId, {
        tipo,
        pesoReferencia: tipo === 'ZERO' ? 0 : pesoRefNumber,
        pesoLido: pesoAtual,
        observacao: observacao || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calibracoes', balancaId] });
      qc.invalidateQueries({ queryKey: ['calibracao-status', balancaId] });
      setPesoReferencia('');
      setObservacao('');
    },
    onError: (e) => onError?.((e as Error).message),
  });

  const podeRegistrar =
    tipo === 'ZERO'
      ? pesoAtual !== null && Math.abs(pesoAtual) < 1 // tolerancia para "zero"
      : pesoRefNumber > 0 && pesoAtual !== 0;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Calibração
        </h3>
        {status?.temCalibracao ? (
          status.vencida ? (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3 mr-1" /> Vencida
              {status.diasDesde !== undefined ? ` (${status.diasDesde}d)` : ''}
            </Badge>
          ) : (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Em dia
            </Badge>
          )
        ) : (
          <Badge variant="default">Sem calibração</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600 block mb-1">Peso atual (leitura)</label>
          <PesoRealtime balancaId={balancaId} compact onPesoChange={(peso) => setPesoAtual(peso)} />
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-slate-600 block mb-1">Tipo</label>
            <Select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCalibracao)}
              options={tipos.map((t) => ({ value: t.value, label: t.label }))}
            />
            <p className="text-xs text-slate-500 mt-1">
              {tipos.find((t) => t.value === tipo)?.help}
            </p>
          </div>
          {tipo !== 'ZERO' && (
            <div>
              <label className="text-xs text-slate-600 block mb-1">Peso real (kg)</label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 50,000"
                value={pesoReferencia}
                onChange={(e) => setPesoReferencia(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-600 block mb-1">Observação</label>
            <Input
              type="text"
              placeholder="Opcional"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        </div>
      </div>

      {fatorPreview !== null && tipo !== 'ZERO' && (
        <div className="text-xs text-slate-600">
          Fator calculado:{' '}
          <span className="font-mono font-semibold">{fatorPreview.toFixed(6)}</span> (serve apenas
          como registro; alteração efetiva do fator do indicador continua na seção &quot;Ajuste de
          Leitura&quot;).
        </div>
      )}

      <div>
        <Button
          variant="primary"
          onClick={() => registrarMut.mutate()}
          disabled={!podeRegistrar || registrarMut.isPending}
        >
          {registrarMut.isPending ? 'Registrando...' : 'Registrar calibração'}
        </Button>
      </div>

      {/* Histórico */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Histórico</h4>
        {isLoading && <div className="text-xs text-slate-500">Carregando...</div>}
        {!isLoading && historico.length === 0 && (
          <div className="text-xs text-slate-500">Nenhuma calibração registrada.</div>
        )}
        {historico.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-2 py-1">Data</th>
                  <th className="px-2 py-1">Tipo</th>
                  <th className="px-2 py-1 text-right">Peso ref</th>
                  <th className="px-2 py-1 text-right">Peso lido</th>
                  <th className="px-2 py-1 text-right">Fator</th>
                  <th className="px-2 py-1">Observação</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((c) => (
                  <tr key={c.id} className="border-t border-slate-200">
                    <td className="px-2 py-1">{new Date(c.realizadoEm).toLocaleString('pt-BR')}</td>
                    <td className="px-2 py-1">
                      <Badge variant="default">{c.tipo}</Badge>
                    </td>
                    <td className="px-2 py-1 text-right font-mono">
                      {Number(c.pesoReferencia).toFixed(3)}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">
                      {Number(c.pesoLido).toFixed(3)}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">
                      {Number(c.fatorCalculado).toFixed(6)}
                    </td>
                    <td className="px-2 py-1 text-slate-600">{c.observacao ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalibracaoSection;
