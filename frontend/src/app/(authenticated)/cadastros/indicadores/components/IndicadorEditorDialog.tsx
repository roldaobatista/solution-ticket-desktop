'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { IndicadorBalanca } from '@/lib/api/indicador';

interface Props {
  open: boolean;
  indicador?: IndicadorBalanca | null;
  duplicating?: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<IndicadorBalanca>) => void;
  isSaving?: boolean;
}

function numberOrNull(value: string) {
  return value === '' ? null : Number(value);
}

export function IndicadorEditorDialog({
  open,
  indicador,
  duplicating,
  onClose,
  onSubmit,
  isSaving,
}: Props) {
  const [form, setForm] = useState<Partial<IndicadorBalanca>>({});

  useEffect(() => {
    if (!open) return;
    setForm(
      indicador
        ? {
            ...indicador,
            descricao: duplicating ? `${indicador.descricao} (customizado)` : indicador.descricao,
            builtin: false,
          }
        : {
            descricao: '',
            protocolo: 'serial',
            baudrate: 9600,
            databits: 8,
            stopbits: 1,
            parity: 'N',
            flowControl: 'NONE',
            parserTipo: 'generic',
            marcador: 13,
            fator: 1,
            invertePeso: false,
            readMode: 'continuous',
            readTimeoutMs: 2000,
          },
    );
  }, [open, indicador, duplicating]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={indicador && !duplicating ? 'Editar Indicador' : 'Novo Indicador'}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Descricao"
            value={form.descricao || ''}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />
          <Input
            label="Fabricante"
            value={form.fabricante || ''}
            onChange={(e) => setForm((f) => ({ ...f, fabricante: e.target.value || null }))}
          />
          <Input
            label="Modelo"
            value={form.modelo || ''}
            onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value || null }))}
          />
        </div>
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Comunicacao padrao</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Select
              label="Protocolo"
              value={form.protocolo || 'serial'}
              onChange={(e) => setForm((f) => ({ ...f, protocolo: e.target.value }))}
              options={[
                { value: 'serial', label: 'Serial' },
                { value: 'tcp', label: 'TCP' },
                { value: 'modbus', label: 'Modbus' },
              ]}
            />
            <Input
              label="Baud"
              type="number"
              value={form.baudrate ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, baudrate: numberOrNull(e.target.value) }))}
            />
            <Select
              label="Data"
              value={String(form.databits ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, databits: numberOrNull(e.target.value) }))}
              options={[
                { value: '', label: '-' },
                { value: '7', label: '7' },
                { value: '8', label: '8' },
              ]}
            />
            <Select
              label="Paridade"
              value={form.parity || ''}
              onChange={(e) => setForm((f) => ({ ...f, parity: e.target.value || null }))}
              options={[
                { value: '', label: '-' },
                { value: 'N', label: 'N' },
                { value: 'E', label: 'E' },
                { value: 'O', label: 'O' },
              ]}
            />
            <Select
              label="Stop"
              value={String(form.stopbits ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, stopbits: numberOrNull(e.target.value) }))}
              options={[
                { value: '', label: '-' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
              ]}
            />
            <Select
              label="Fluxo"
              value={form.flowControl || ''}
              onChange={(e) => setForm((f) => ({ ...f, flowControl: e.target.value || null }))}
              options={[
                { value: '', label: '-' },
                { value: 'NONE', label: 'NONE' },
                { value: 'XON_XOFF', label: 'XON/XOFF' },
                { value: 'RTS_CTS', label: 'RTS/CTS' },
              ]}
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Parser e leitura</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Input
              label="Parser"
              value={form.parserTipo || ''}
              onChange={(e) => setForm((f) => ({ ...f, parserTipo: e.target.value || null }))}
            />
            <Input
              label="Inicio"
              type="number"
              value={form.inicioPeso ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, inicioPeso: numberOrNull(e.target.value) }))}
            />
            <Input
              label="Tamanho"
              type="number"
              value={form.tamanhoPeso ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, tamanhoPeso: numberOrNull(e.target.value) }))
              }
            />
            <Input
              label="Marcador"
              type="number"
              value={form.marcador ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, marcador: numberOrNull(e.target.value) }))}
            />
            <Input
              label="Fator"
              type="number"
              value={form.fator ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fator: numberOrNull(e.target.value) }))}
            />
            <div className="flex items-end gap-3 pb-2">
              <Switch
                checked={form.invertePeso ?? false}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, invertePeso: checked }))}
              />
              <span className="text-sm text-slate-700">Inverte</span>
            </div>
            <Select
              label="Modo"
              value={form.readMode || 'continuous'}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  readMode: e.target.value as 'continuous' | 'polling' | 'manual',
                }))
              }
              options={[
                { value: 'continuous', label: 'continuous' },
                { value: 'polling', label: 'polling' },
                { value: 'manual', label: 'manual' },
              ]}
            />
            <Input
              label="Comando"
              value={form.readCommandHex || ''}
              onChange={(e) => setForm((f) => ({ ...f, readCommandHex: e.target.value || null }))}
            />
            <Input
              label="Intervalo"
              type="number"
              value={form.readIntervalMs ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, readIntervalMs: numberOrNull(e.target.value) }))
              }
            />
            <Input
              label="Timeout"
              type="number"
              value={form.readTimeoutMs ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, readTimeoutMs: numberOrNull(e.target.value) }))
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Exemplo de trama"
            value={form.exemploTrama || ''}
            onChange={(e) => setForm((f) => ({ ...f, exemploTrama: e.target.value || null }))}
          />
          <Input
            label="Cor"
            value={form.cor || ''}
            onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value || null }))}
          />
          <div className="md:col-span-2">
            <Input
              label="Notas"
              value={form.notas || ''}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value || null }))}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onSubmit(form)}
            isLoading={isSaving}
          >
            Salvar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
