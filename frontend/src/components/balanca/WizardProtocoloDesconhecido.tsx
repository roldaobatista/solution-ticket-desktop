'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  annotateBytes,
  testarConfig,
  criarFromWizard,
  ByteAnnotation,
  IndicadorBalanca,
} from '@/lib/api/indicador';
import {
  captureRaw,
  captureAndDetect,
  CandidatoDetectado,
  SerialConfig,
} from '@/lib/api/balanca-config';

interface Props {
  tenantId: string;
  onSucesso: (indicador: IndicadorBalanca) => void;
}

const PARSER_TIPOS = [
  'generic',
  'toledo',
  'toledo-c',
  'toledo-2090',
  'toledo-2180',
  'filizola',
  'filizola-at',
  'digitron',
  'urano',
  'saturno',
  'afts',
  'sics',
  'modbus',
];

const ROLE_COLOR: Record<string, string> = {
  STX: 'bg-purple-200',
  ETX: 'bg-purple-200',
  ENQ: 'bg-amber-200',
  ACK: 'bg-emerald-200',
  CR: 'bg-rose-200',
  LF: 'bg-rose-200',
  digit: 'bg-blue-100',
  letter: 'bg-slate-100',
  printable: 'bg-slate-100',
  control: 'bg-yellow-100',
  'high-byte': 'bg-pink-100',
  TAB: 'bg-yellow-100',
  SP: 'bg-slate-50',
};

export function WizardProtocoloDesconhecido({ tenantId, onSucesso }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [protocolo, setProtocolo] = useState<'serial' | 'tcp'>('serial');
  const [endereco, setEndereco] = useState('');
  const [serial, setSerial] = useState<SerialConfig>({
    baudRate: 9600,
    dataBits: 8,
    parity: 'N',
    stopBits: 1,
    flowControl: 'NONE',
  });
  const [enviarEnq, setEnviarEnq] = useState(false);
  const [capturado, setCapturado] = useState('');
  const [annotation, setAnnotation] = useState<ByteAnnotation[]>([]);
  const [candidatos, setCandidatos] = useState<CandidatoDetectado[]>([]);
  const [parserTipo, setParserTipo] = useState('generic');
  const [inicioPeso, setInicioPeso] = useState<number>(1);
  const [tamanhoPeso, setTamanhoPeso] = useState<number>(6);
  const [marcador, setMarcador] = useState<number>(13);
  const [fator, setFator] = useState<number>(1);
  const [invertePeso, setInvertePeso] = useState(false);
  const [testResult, setTestResult] = useState<{
    peso: number;
    sucesso: boolean;
    diagnostico: string;
  } | null>(null);
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const capturarBytes = async () => {
    setErro(null);
    setCarregando(true);
    try {
      const r = await captureAndDetect({
        protocolo,
        endereco,
        serial,
        durationMs: 2000,
        enviarEnq,
      });
      setCapturado(r.candidatos.length > 0 ? '' : '');
      // Recapturar raw para anotar
      const raw = await captureRaw({ protocolo, endereco, serial, durationMs: 1500, enviarEnq });
      setCapturado(raw.bytes);
      setCandidatos(r.candidatos as CandidatoDetectado[]);
      const ann = await annotateBytes(raw.bytes);
      setAnnotation(ann.bytes);
      setStep(3);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarCandidato = (c: CandidatoDetectado) => {
    setParserTipo(c.parserTipo);
    setSerial(c.serial);
    setFabricante(c.fabricante);
    setModelo(c.modelo);
    setStep(5);
  };

  const testar = async () => {
    setErro(null);
    try {
      const r = await testarConfig({
        bytes: capturado,
        parserTipo,
        inicioPeso,
        tamanhoPeso,
        marcador,
        fator,
        invertePeso,
      });
      setTestResult({
        peso: r.leituras[0]?.peso ?? 0,
        sucesso: r.sucesso,
        diagnostico: r.diagnostico,
      });
    } catch (e) {
      setErro((e as Error).message);
    }
  };

  const salvar = async () => {
    if (!fabricante || !modelo) {
      setErro('Informe fabricante e modelo.');
      return;
    }
    setCarregando(true);
    try {
      const ind = await criarFromWizard({
        tenantId,
        fabricante,
        modelo,
        protocolo,
        serial,
        parserTipo,
        inicioPeso,
        tamanhoPeso,
        marcador,
        fator,
        invertePeso,
        bytesCapturados: capturado,
      });
      onSucesso(ind);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3, 4, 5].map((n) => (
          <Badge key={n} variant={step === n ? 'success' : step > n ? 'outline' : 'default'}>
            Passo {n}
          </Badge>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Tipo de conexão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              label="Como a balança conecta?"
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value as 'serial' | 'tcp')}
              options={[
                { value: 'serial', label: 'Cabo serial (COM/USB-Serial)' },
                { value: 'tcp', label: 'Rede (Ethernet/Wi-Fi via conversor)' },
              ]}
            />
            <Button onClick={() => setStep(2)} variant="primary">
              Próximo
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Capturar trama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label={
                protocolo === 'serial' ? 'Porta (ex: COM3)' : 'Endereço (ex: 192.168.1.50:4001)'
              }
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
            {protocolo === 'serial' && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Input
                  label="Baud"
                  type="number"
                  value={String(serial.baudRate)}
                  onChange={(e) => setSerial({ ...serial, baudRate: Number(e.target.value) })}
                />
                <Select
                  label="Data"
                  value={String(serial.dataBits)}
                  onChange={(e) =>
                    setSerial({ ...serial, dataBits: Number(e.target.value) as 7 | 8 })
                  }
                  options={[
                    { value: '7', label: '7' },
                    { value: '8', label: '8' },
                  ]}
                />
                <Select
                  label="Parity"
                  value={serial.parity}
                  onChange={(e) =>
                    setSerial({ ...serial, parity: e.target.value as 'N' | 'E' | 'O' })
                  }
                  options={[
                    { value: 'N', label: 'None' },
                    { value: 'E', label: 'Even' },
                    { value: 'O', label: 'Odd' },
                  ]}
                />
                <Select
                  label="Stop"
                  value={String(serial.stopBits)}
                  onChange={(e) =>
                    setSerial({ ...serial, stopBits: Number(e.target.value) as 1 | 2 })
                  }
                  options={[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                  ]}
                />
                <Select
                  label="Flow"
                  value={serial.flowControl}
                  onChange={(e) => setSerial({ ...serial, flowControl: e.target.value as any })}
                  options={[
                    { value: 'NONE', label: 'None' },
                    { value: 'XON_XOFF', label: 'XON/XOFF' },
                    { value: 'RTS_CTS', label: 'RTS/CTS' },
                    { value: 'DTR_DSR', label: 'DTR/DSR' },
                  ]}
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enviarEnq}
                onChange={(e) => setEnviarEnq(e.target.checked)}
              />
              Enviar ENQ (0x05) antes de capturar (Toledo C, Filizola @)
            </label>
            <Button onClick={capturarBytes} disabled={!endereco || carregando} variant="primary">
              {carregando ? 'Capturando...' : 'Capturar 2 segundos'}
            </Button>
            {erro && <p className="text-red-600 text-sm">{erro}</p>}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Bytes capturados ({annotation.length} bytes)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="font-mono text-xs flex flex-wrap gap-1 bg-slate-50 p-2 rounded">
              {annotation.map((b) => (
                <span
                  key={b.offset}
                  title={`${b.offset}: ${b.role}`}
                  className={`px-1 rounded ${ROLE_COLOR[b.role] || 'bg-slate-100'}`}
                >
                  {b.hex}
                </span>
              ))}
            </div>
            {candidatos.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Auto-detect — candidatos:</p>
                {candidatos.slice(0, 5).map((c, i) => (
                  <div
                    key={c.presetId}
                    className="border rounded p-2 flex items-center justify-between"
                  >
                    <div>
                      <Badge variant={i === 0 ? 'success' : 'outline'}>#{i + 1}</Badge>{' '}
                      <span className="font-medium">
                        {c.fabricante} — {c.modelo}
                      </span>{' '}
                      <span className="text-xs text-slate-500">
                        ({(c.confianca * 100).toFixed(0)}% — peso {c.leituraExemplo.peso})
                      </span>
                    </div>
                    <Button onClick={() => aplicarCandidato(c)} variant="primary" size="sm">
                      Usar
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={() => setStep(4)} variant="default">
              Configurar manualmente
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>4. Configurar parser manualmente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Select
                label="Parser"
                value={parserTipo}
                onChange={(e) => setParserTipo(e.target.value)}
                options={PARSER_TIPOS.map((p) => ({ value: p, label: p }))}
              />
              <Input
                label="Início do peso (1-indexed)"
                type="number"
                value={String(inicioPeso)}
                onChange={(e) => setInicioPeso(Number(e.target.value))}
              />
              <Input
                label="Tamanho do peso (chars)"
                type="number"
                value={String(tamanhoPeso)}
                onChange={(e) => setTamanhoPeso(Number(e.target.value))}
              />
              <Select
                label="Terminador"
                value={String(marcador)}
                onChange={(e) => setMarcador(Number(e.target.value))}
                options={[
                  { value: '13', label: 'CR (0x0D)' },
                  { value: '10', label: 'LF (0x0A)' },
                  { value: '3', label: 'ETX (0x03)' },
                  { value: '5', label: 'ENQ (0x05)' },
                ]}
              />
              <Input
                label="Fator (divisor)"
                type="number"
                value={String(fator)}
                onChange={(e) => setFator(Number(e.target.value))}
              />
              <label className="flex items-center gap-2 text-sm pt-6">
                <input
                  type="checkbox"
                  checked={invertePeso}
                  onChange={(e) => setInvertePeso(e.target.checked)}
                />
                Inverter peso
              </label>
            </div>
            <Button onClick={testar} variant="primary">
              Testar configuração
            </Button>
            {testResult && (
              <div
                className={`p-2 rounded text-sm ${testResult.sucesso ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
              >
                {testResult.diagnostico}
                {testResult.sucesso && (
                  <p>
                    Peso lido: <strong>{testResult.peso}</strong>
                  </p>
                )}
              </div>
            )}
            <Button onClick={() => setStep(5)} variant="default" disabled={!testResult?.sucesso}>
              Próximo (salvar)
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>5. Salvar como novo indicador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Fabricante"
              value={fabricante}
              onChange={(e) => setFabricante(e.target.value)}
            />
            <Input label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
            <Button
              onClick={salvar}
              disabled={!fabricante || !modelo || carregando}
              variant="primary"
            >
              {carregando ? 'Salvando...' : 'Salvar indicador'}
            </Button>
            {erro && <p className="text-red-600 text-sm">{erro}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
