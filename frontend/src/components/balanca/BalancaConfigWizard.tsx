'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getPresetsBalanca,
  getSerialOptions,
  autoDetectProtocolo,
  PresetBalanca,
  SerialConfig,
  CandidatoDetectado,
} from '@/lib/api/balanca-config';

interface Props {
  /** Aplicar configuração detectada/selecionada na balança em edição. */
  onAplicar: (config: { parserTipo: string; serial: SerialConfig; presetId?: string }) => void;
}

export function BalancaConfigWizard({ onAplicar }: Props) {
  const [presetId, setPresetId] = useState('');
  const [bytesParaDetectar, setBytesParaDetectar] = useState('');
  const [encoding, setEncoding] = useState<'hex' | 'base64'>('hex');
  const [candidatos, setCandidatos] = useState<CandidatoDetectado[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [detectando, setDetectando] = useState(false);

  const { data: presets } = useQuery({
    queryKey: ['balanca-presets'],
    queryFn: () => getPresetsBalanca(),
  });
  const { data: serialOpts } = useQuery({
    queryKey: ['balanca-serial-options'],
    queryFn: () => getSerialOptions(),
  });

  const presetSelecionado = presets?.find((p) => p.id === presetId);

  const aplicarPreset = () => {
    if (!presetSelecionado) return;
    onAplicar({
      parserTipo: presetSelecionado.parserTipo,
      serial: presetSelecionado.serial,
      presetId: presetSelecionado.id,
    });
  };

  const detectar = async () => {
    setErro(null);
    setCandidatos([]);
    setDetectando(true);
    try {
      const r = await autoDetectProtocolo(bytesParaDetectar, encoding);
      setCandidatos(r.candidatos);
      if (r.candidatos.length === 0) {
        setErro('Nenhum protocolo reconhecido. Verifique a captura.');
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setDetectando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Escolher modelo (preset)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            label="Modelo"
            placeholder="-- selecionar --"
            options={(presets || []).map((p: PresetBalanca) => ({
              value: p.id,
              label: `${p.fabricante} — ${p.modelo}`,
            }))}
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
          />
          {presetSelecionado && (
            <div className="text-sm text-slate-600 space-y-1 bg-slate-50 p-3 rounded">
              <p>
                <strong>Parser:</strong> {presetSelecionado.parserTipo} ·{' '}
                <strong>Protocolo:</strong> {presetSelecionado.protocolo}
              </p>
              <p>
                <strong>Serial:</strong> {presetSelecionado.serial.baudRate}{' '}
                {presetSelecionado.serial.dataBits}-{presetSelecionado.serial.parity}-
                {presetSelecionado.serial.stopBits}
              </p>
              {presetSelecionado.exemploTrama && (
                <p className="font-mono text-xs">
                  <strong>Trama:</strong> {presetSelecionado.exemploTrama}
                </p>
              )}
              {presetSelecionado.notas && (
                <p className="text-xs text-slate-500">{presetSelecionado.notas}</p>
              )}
              <Button onClick={aplicarPreset} variant="primary" size="sm">
                Aplicar este preset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            2. Detectar automaticamente (cole bytes capturados)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            Capture 1-2 segundos de tráfego serial via Hercules ou PuTTY e cole aqui em hex (espaços
            ok) ou base64. O sistema testa todos os parsers conhecidos e ranqueia por confiança.
          </p>
          <div className="flex gap-2">
            <Select
              label="Encoding"
              value={encoding}
              onChange={(e) => setEncoding(e.target.value as 'hex' | 'base64')}
              options={[
                { value: 'hex', label: 'Hexadecimal' },
                { value: 'base64', label: 'Base64' },
              ]}
            />
          </div>
          <Input
            placeholder={
              encoding === 'hex'
                ? '02 69 32 20 20 30 30 30 31 30 30 30 30 30 30 30 0d 05'
                : 'Ami...='
            }
            value={bytesParaDetectar}
            onChange={(e) => setBytesParaDetectar(e.target.value)}
          />
          <Button
            onClick={detectar}
            disabled={!bytesParaDetectar || detectando}
            variant="primary"
            size="sm"
          >
            {detectando ? 'Analisando...' : 'Detectar protocolo'}
          </Button>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {candidatos.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-sm font-medium">Candidatos:</p>
              {candidatos.map((c, i) => (
                <div
                  key={c.presetId}
                  className="border rounded p-3 flex items-start justify-between hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={i === 0 ? 'success' : 'outline'}>#{i + 1}</Badge>
                      <span className="font-medium">
                        {c.fabricante} — {c.modelo}
                      </span>
                      <Badge variant="outline">conf: {(c.confianca * 100).toFixed(0)}%</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Parser: <code>{c.parserTipo}</code> · Peso lido:{' '}
                      <strong>{c.leituraExemplo.peso} kg</strong>{' '}
                      {c.leituraExemplo.estavel ? '(estável)' : '(movimento)'}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      onAplicar({
                        parserTipo: c.parserTipo,
                        serial: c.serial,
                        presetId: c.presetId,
                      })
                    }
                    variant="primary"
                    size="sm"
                  >
                    Aplicar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {serialOpts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Parâmetros disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <p className="font-medium">BaudRate</p>
              <p className="text-slate-500">{serialOpts.baudRate.join(', ')}</p>
            </div>
            <div>
              <p className="font-medium">DataBits</p>
              <p className="text-slate-500">{serialOpts.dataBits.join(', ')}</p>
            </div>
            <div>
              <p className="font-medium">Parity</p>
              <p className="text-slate-500">{serialOpts.parity.join(', ')}</p>
            </div>
            <div>
              <p className="font-medium">StopBits</p>
              <p className="text-slate-500">{serialOpts.stopBits.join(', ')}</p>
            </div>
            <div>
              <p className="font-medium">FlowControl</p>
              <p className="text-slate-500">{serialOpts.flowControl.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
