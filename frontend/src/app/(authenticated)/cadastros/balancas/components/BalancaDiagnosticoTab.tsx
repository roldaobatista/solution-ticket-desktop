'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { captureRaw, testParserOnBytes } from '@/lib/api/balanca-config';
import {
  conectarBalanca,
  desconectarBalanca,
  getBalancaStatus,
  testarBalanca,
} from '@/lib/api/balanca';
import { BalancaStatus } from '@/types';
import { BalancaTabProps } from './types';
import { Cable, Play, Power, PowerOff } from 'lucide-react';

interface Props extends BalancaTabProps {
  balancaId?: string | null;
  onMessage: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function BalancaDiagnosticoTab({ form, setForm, balancaId, onMessage }: Props) {
  const [status, setStatus] = useState<BalancaStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [durationMs, setDurationMs] = useState(2000);
  const [commandHex, setCommandHex] = useState('');
  const [bytes, setBytes] = useState('');
  const [parserResult, setParserResult] = useState<string>('');

  const refreshStatus = async () => {
    if (!balancaId) return;
    setStatus(await getBalancaStatus(balancaId));
  };

  const runTest = async () => {
    if (!balancaId) {
      onMessage('Salve a balanca antes de testar', 'warning');
      return;
    }
    setBusy(true);
    try {
      const result = await testarBalanca(balancaId);
      onMessage(
        result.sucesso ? 'Conexao bem-sucedida' : result.erro || 'Falha no teste',
        result.sucesso ? 'success' : 'error',
      );
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const runCapture = async () => {
    const protocolo = form.tipoConexao === 'TCP' ? 'tcp' : 'serial';
    const endereco =
      protocolo === 'tcp'
        ? `${form.host || form.enderecoIp}:${form.portaTcp || 4001}`
        : form.porta || '';
    if (!endereco) {
      onMessage('Informe porta serial ou host TCP antes de capturar', 'warning');
      return;
    }
    setBusy(true);
    try {
      const response = await captureRaw({
        protocolo,
        endereco,
        serial: {
          baudRate: form.baudRate || 9600,
          dataBits: (form.ovrDataBits || 8) as 7 | 8,
          parity: (form.ovrParity || 'N') as 'N' | 'E' | 'O',
          stopBits: (form.ovrStopBits || 1) as 1 | 2,
          flowControl: (form.ovrFlowControl || 'NONE') as 'NONE',
        },
        durationMs,
        enviarEnq: commandHex === '05',
        commandHex: commandHex || undefined,
      });
      setBytes(response.bytes);
      onMessage(`${response.count} byte(s) capturados`, 'success');
    } catch (e) {
      onMessage(e instanceof Error ? e.message : 'Falha na captura', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runParser = async () => {
    if (!bytes) return;
    setBusy(true);
    try {
      const result = await testParserOnBytes({
        bytes,
        parserTipo: form.ovrParserTipo || form.indicador?.parserTipo || 'generic',
        inicioPeso: form.ovrInicioPeso ?? undefined,
        tamanhoPeso: form.ovrTamanhoPeso ?? undefined,
        tamanhoString: form.ovrTamanhoString ?? undefined,
        marcador: form.ovrMarcador ?? undefined,
        fator: form.ovrFator ?? undefined,
        invertePeso: form.ovrInvertePeso ?? undefined,
      });
      setParserResult(
        result.leituras.length
          ? result.leituras
              .map((l) => `${l.peso}kg ${l.estavel ? 'estavel' : 'movimento'}`)
              .join(', ')
          : 'Nenhuma leitura parseavel',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status?.online ? 'success' : 'outline'}>
            {status?.online ? 'ONLINE' : 'OFFLINE'}
          </Badge>
          {status?.erro && <span className="text-sm text-red-600">{status.erro}</span>}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={refreshStatus}
            disabled={!balancaId}
          >
            Atualizar
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={runTest} disabled={busy}>
            <Play className="w-4 h-4 mr-2" />
            Testar 2s
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!balancaId || busy}
            onClick={async () => {
              if (!balancaId) return;
              await conectarBalanca(balancaId);
              await refreshStatus();
            }}
          >
            <Power className="w-4 h-4 mr-2" />
            Conectar
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!balancaId || busy}
            onClick={async () => {
              if (!balancaId) return;
              await desconectarBalanca(balancaId);
              await refreshStatus();
            }}
          >
            <PowerOff className="w-4 h-4 mr-2" />
            Desconectar
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.debugMode ?? false}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, debugMode: checked }))}
          />
          <span className="text-sm text-slate-700">Debug raw em logs/balanca-&lt;id&gt;.log</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Captura raw</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Duracao ms"
            type="number"
            value={durationMs}
            onChange={(e) => setDurationMs(Number(e.target.value) || 2000)}
          />
          <Input
            label="Comando hex"
            value={commandHex}
            onChange={(e) => setCommandHex(e.target.value)}
            placeholder="05"
          />
          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={runCapture} disabled={busy}>
              <Cable className="w-4 h-4 mr-2" />
              Capturar
            </Button>
          </div>
        </div>
        {bytes && (
          <div className="space-y-3">
            <pre className="max-h-40 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100 whitespace-pre-wrap break-all">
              {bytes}
            </pre>
            <Button type="button" variant="secondary" size="sm" onClick={runParser} disabled={busy}>
              Testar parser nos bytes
            </Button>
            {parserResult && <p className="text-sm text-slate-700">{parserResult}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
