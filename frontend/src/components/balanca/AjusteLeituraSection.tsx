'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PesoRealtime } from './PesoRealtime';
import { apiClient } from '@/lib/api';
import { Scale, CheckCircle2 } from 'lucide-react';

interface AjusteLeituraSectionProps {
  balancaId: string;
  indicadorId: string;
  onApplied?: () => void;
  onError?: (msg: string) => void;
}

/**
 * Seção "Ajuste de Leitura" dentro do cadastro da balança.
 *
 * Permite corrigir o fator de conversão do indicador quando a leitura serial/TCP
 * retorna um valor escalado diferente do peso real (ex: protocolo manda 1025 e o
 * peso real são 102.5 kg → fator 0.1).
 *
 * Fluxo:
 *  1. Operador coloca um peso conhecido na balança
 *  2. Widget mostra o que a balança está lendo em tempo real
 *  3. Operador digita o peso real (ex: 50.0)
 *  4. Sistema calcula novoFator = pesoReal / pesoLido e aplica no indicador
 *
 * Observação: o ajuste altera o fator do INDICADOR, então afeta todas as balanças
 * que usam o mesmo modelo.
 */
export function AjusteLeituraSection({
  balancaId,
  indicadorId,
  onApplied,
  onError,
}: AjusteLeituraSectionProps) {
  const [pesoAtual, setPesoAtual] = useState<number>(0);
  const [pesoReferencia, setPesoReferencia] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const pesoRef = parseFloat(pesoReferencia.replace(',', '.'));
  const fatorCalculado = pesoRef > 0 && pesoAtual > 0 ? pesoRef / pesoAtual : null;

  async function aplicar() {
    if (!indicadorId) {
      onError?.('Balanca precisa ter um Indicador selecionado');
      return;
    }
    if (!fatorCalculado || !Number.isFinite(fatorCalculado)) {
      onError?.('Informe o peso de referencia e aguarde a leitura da balanca');
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch(`/cadastros/indicadores/${indicadorId}`, {
        fator: Number(fatorCalculado.toFixed(6)),
      });
      onApplied?.();
      setPesoReferencia('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao aplicar ajuste';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Scale className="w-4 h-4" />
        Ajuste de Leitura
      </div>
      <p className="text-xs text-slate-500">
        Use um peso conhecido para corrigir o fator de conversao do indicador. Coloque o peso sobre
        a balanca, aguarde a leitura estabilizar e informe o peso real.
      </p>

      <PesoRealtime balancaId={balancaId} onPesoChange={setPesoAtual} />

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="text-xs text-slate-600 mb-1 block">Peso de referencia (kg)</label>
          <Input
            type="text"
            inputMode="decimal"
            value={pesoReferencia}
            onChange={(e) => setPesoReferencia(e.target.value)}
            placeholder="Ex.: 50.0"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 mb-1 block">Novo fator (calculado)</label>
          <div className="h-10 px-3 flex items-center rounded-md border border-slate-300 bg-white text-sm text-slate-700 font-mono">
            {fatorCalculado ? fatorCalculado.toFixed(6) : '—'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Afeta todas as balancas que usam este indicador.</p>
        <Button
          variant="secondary"
          onClick={aplicar}
          isLoading={loading}
          disabled={!fatorCalculado || !indicadorId}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Aplicar ajuste
        </Button>
      </div>
    </div>
  );
}
