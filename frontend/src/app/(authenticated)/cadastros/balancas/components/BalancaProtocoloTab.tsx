'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BalancaConfigEfetiva } from './BalancaConfigEfetiva';
import { BalancaTabProps } from './types';
import { Wand2 } from 'lucide-react';

function numberOrNull(value: string) {
  return value === '' ? null : Number(value);
}

interface Props extends BalancaTabProps {
  balancaId?: string | null;
  onOpenWizard: () => void;
}

export function BalancaProtocoloTab({ form, setForm, errors, balancaId, onOpenWizard }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={onOpenWizard}>
          <Wand2 className="w-4 h-4 mr-2" />
          Criar protocolo desconhecido
        </Button>
      </div>
      <div className="rounded-lg border border-slate-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Overrides de parser</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            label="Parser"
            value={form.ovrParserTipo ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ovrParserTipo: e.target.value || null }))}
            options={[
              { value: '', label: 'Indicador' },
              { value: 'generic', label: 'generic' },
              { value: 'toledo', label: 'toledo' },
              { value: 'toledo-c', label: 'toledo-c' },
              { value: 'filizola', label: 'filizola' },
              { value: 'filizola-at', label: 'filizola-at' },
              { value: 'digitron', label: 'digitron' },
              { value: 'sics', label: 'sics' },
              { value: 'modbus', label: 'modbus' },
            ]}
          />
          <Input
            label="Inicio"
            type="number"
            value={form.ovrInicioPeso ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, ovrInicioPeso: numberOrNull(e.target.value) }))
            }
            error={errors.ovrInicioPeso}
          />
          <Input
            label="Tamanho peso"
            type="number"
            value={form.ovrTamanhoPeso ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, ovrTamanhoPeso: numberOrNull(e.target.value) }))
            }
            error={errors.ovrTamanhoPeso}
          />
          <Input
            label="Tamanho string"
            type="number"
            value={form.ovrTamanhoString ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, ovrTamanhoString: numberOrNull(e.target.value) }))
            }
          />
          <Input
            label="Marcador"
            type="number"
            value={form.ovrMarcador ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ovrMarcador: numberOrNull(e.target.value) }))}
          />
          <Input
            label="Fator"
            type="number"
            value={form.ovrFator ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ovrFator: numberOrNull(e.target.value) }))}
          />
          <Input
            label="Atraso ms"
            type="number"
            value={form.ovrAtraso ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ovrAtraso: numberOrNull(e.target.value) }))}
          />
          <div className="flex items-end gap-3 pb-2">
            <Switch
              checked={form.ovrInvertePeso ?? false}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, ovrInvertePeso: checked }))}
            />
            <span className="text-sm text-slate-700">Inverter peso</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Tolerancia estabilidade"
            type="number"
            value={form.toleranciaEstabilidade ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                toleranciaEstabilidade: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Janela estabilidade"
            type="number"
            value={form.janelaEstabilidade ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                janelaEstabilidade: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
          />
        </div>
      </div>
      <BalancaConfigEfetiva balancaId={balancaId} />
    </div>
  );
}
