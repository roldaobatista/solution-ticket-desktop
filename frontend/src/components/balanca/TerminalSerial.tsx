'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { captureRaw, SerialConfig } from '@/lib/api/balanca-config';
import { annotateBytes, ByteAnnotation } from '@/lib/api/indicador';

interface Props {
  protocolo: 'serial' | 'tcp';
  endereco: string;
  serial?: SerialConfig;
}

const ROLE_COLOR: Record<string, string> = {
  STX: 'bg-purple-200',
  ETX: 'bg-purple-200',
  ENQ: 'bg-amber-200',
  ACK: 'bg-emerald-200',
  CR: 'bg-rose-200',
  LF: 'bg-rose-200',
  digit: 'bg-blue-100',
};

interface LinhaLog {
  ts: string;
  direcao: 'TX' | 'RX';
  bytes: ByteAnnotation[];
  texto: string;
}

/**
 * Terminal serial embutido — substitui Hercules/PuTTY para diagnóstico.
 * Funcionalidade mínima: captura RX em bursts curtos e exibe hex+ascii com cores.
 * Send TX é síncrono via captureRaw (com enviarEnq) — para macros básicas.
 */
export function TerminalSerial({ protocolo, endereco, serial }: Props) {
  const [log, setLog] = useState<LinhaLog[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [duracao, setDuracao] = useState(2000);

  const capturar = async (enviarEnq: boolean) => {
    setErro(null);
    setCarregando(true);
    try {
      const r = await captureRaw({ protocolo, endereco, serial, durationMs: duracao, enviarEnq });
      const ann = await annotateBytes(r.bytes);
      const ts = new Date().toLocaleTimeString();
      const novas: LinhaLog[] = [];
      if (enviarEnq) {
        novas.push({
          ts,
          direcao: 'TX',
          bytes: [{ offset: 0, hex: '05', decimal: 5, char: null, role: 'ENQ' }],
          texto: 'ENQ',
        });
      }
      novas.push({
        ts,
        direcao: 'RX',
        bytes: ann.bytes,
        texto: ann.bytes.map((b) => b.char ?? '·').join(''),
      });
      setLog((prev) => [...prev, ...novas]);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Terminal serial — {endereco || '(sem endereço)'}</span>
          <Button onClick={() => setLog([])} variant="default" size="sm">
            Limpar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            label="Duração (ms)"
            type="number"
            value={String(duracao)}
            onChange={(e) => setDuracao(Number(e.target.value))}
            className="w-32"
          />
          <Button
            onClick={() => capturar(false)}
            variant="primary"
            size="sm"
            disabled={!endereco || carregando}
          >
            Capturar RX
          </Button>
          <Button
            onClick={() => capturar(true)}
            variant="default"
            size="sm"
            disabled={!endereco || carregando}
          >
            Enviar ENQ + RX
          </Button>
        </div>
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <div className="bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded h-80 overflow-y-auto">
          {log.length === 0 && <p className="text-slate-500">Aguardando captura...</p>}
          {log.map((l, i) => (
            <div key={i} className="mb-2 border-b border-slate-700 pb-1">
              <p className="text-slate-400">
                [{l.ts}] {l.direcao} ({l.bytes.length} bytes)
              </p>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {l.bytes.map((b) => (
                  <span
                    key={b.offset}
                    className={`px-1 rounded text-slate-900 ${ROLE_COLOR[b.role] || 'bg-slate-300'}`}
                    title={`${b.role} (${b.decimal})`}
                  >
                    {b.hex}
                  </span>
                ))}
              </div>
              <p className="text-slate-300 mt-1 break-all">&quot;{l.texto}&quot;</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
