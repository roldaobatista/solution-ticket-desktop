'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { criarFromWizard, testarConfig } from '@/lib/api/indicador';
import { IndicadorPesagem } from '@/types';
import { BalancaForm } from './types';

interface Props {
  open: boolean;
  form: BalancaForm;
  onClose: () => void;
  onCreated: (indicador: IndicadorPesagem) => void;
  onMessage: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function IndicadorWizardDialog({ open, form, onClose, onCreated, onMessage }: Props) {
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [bytes, setBytes] = useState('');
  const [parserTipo, setParserTipo] = useState('generic');
  const [inicioPeso, setInicioPeso] = useState<number | undefined>(1);
  const [tamanhoPeso, setTamanhoPeso] = useState<number | undefined>(6);
  const [marcador, setMarcador] = useState<number | undefined>(13);
  const [fator, setFator] = useState<number | undefined>(1);
  const [readMode, setReadMode] = useState<'continuous' | 'polling' | 'manual'>(
    form.readMode || 'continuous',
  );
  const [readCommandHex, setReadCommandHex] = useState(form.readCommandHex || '');
  const [diagnostico, setDiagnostico] = useState('');
  const [saving, setSaving] = useState(false);

  const testar = async () => {
    if (!bytes) {
      onMessage('Cole bytes capturados antes de testar', 'warning');
      return;
    }
    const result = await testarConfig({
      bytes,
      parserTipo,
      inicioPeso,
      tamanhoPeso,
      marcador,
      fator,
    });
    setDiagnostico(result.diagnostico);
  };

  const salvar = async () => {
    if (!fabricante || !modelo) {
      onMessage('Informe fabricante e modelo', 'warning');
      return;
    }
    setSaving(true);
    try {
      const indicador = await criarFromWizard({
        fabricante,
        modelo,
        protocolo:
          form.tipoConexao === 'TCP'
            ? 'tcp'
            : form.tipoConexao?.startsWith('MODBUS')
              ? 'modbus'
              : 'serial',
        serial: {
          baudRate: form.baudRate || 9600,
          dataBits: (form.ovrDataBits || 8) as 7 | 8,
          parity: form.ovrParity || 'N',
          stopBits: (form.ovrStopBits || 1) as 1 | 2,
          flowControl: form.ovrFlowControl || 'NONE',
        },
        parserTipo,
        inicioPeso,
        tamanhoPeso,
        marcador,
        fator,
        readMode,
        readCommandHex: readCommandHex || null,
        readIntervalMs: form.readIntervalMs ?? null,
        readTimeoutMs: form.readTimeoutMs ?? null,
        bytesCapturados: bytes || undefined,
      });
      onCreated(indicador);
    } catch (e) {
      onMessage(e instanceof Error ? e.message : 'Erro ao criar indicador', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Criar protocolo desconhecido" maxWidth="max-w-3xl">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Fabricante"
            value={fabricante}
            onChange={(e) => setFabricante(e.target.value)}
          />
          <Input label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Bytes capturados</h3>
          <Input
            value={bytes}
            onChange={(e) => setBytes(e.target.value)}
            placeholder="02 69 32 20 20 30 30 30 31 30 30 30 30 30 30 30 0d 05"
          />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Parser generic</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Select
              label="Parser"
              value={parserTipo}
              onChange={(e) => setParserTipo(e.target.value)}
              options={[
                { value: 'generic', label: 'generic' },
                { value: 'toledo', label: 'toledo' },
                { value: 'toledo-c', label: 'toledo-c' },
                { value: 'filizola-at', label: 'filizola-at' },
              ]}
            />
            <Input
              label="Inicio"
              type="number"
              value={inicioPeso ?? ''}
              onChange={(e) =>
                setInicioPeso(e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
            <Input
              label="Tamanho"
              type="number"
              value={tamanhoPeso ?? ''}
              onChange={(e) =>
                setTamanhoPeso(e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
            <Input
              label="Marcador"
              type="number"
              value={marcador ?? ''}
              onChange={(e) =>
                setMarcador(e.target.value === '' ? undefined : Number(e.target.value))
              }
            />
            <Input
              label="Fator"
              type="number"
              value={fator ?? ''}
              onChange={(e) => setFator(e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={testar}>
            Testar nos bytes
          </Button>
          {diagnostico && <p className="text-sm text-slate-700">{diagnostico}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Modo leitura"
            value={readMode}
            onChange={(e) => setReadMode(e.target.value as 'continuous' | 'polling' | 'manual')}
            options={[
              { value: 'continuous', label: 'continuous' },
              { value: 'polling', label: 'polling' },
              { value: 'manual', label: 'manual' },
            ]}
          />
          <Input
            label="Comando hex"
            value={readCommandHex}
            onChange={(e) => setReadCommandHex(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={salvar} isLoading={saving}>
            Salvar indicador
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
