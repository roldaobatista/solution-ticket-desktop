'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BalancaCatalogos, BalancaTabProps } from './types';

interface Props extends BalancaTabProps, BalancaCatalogos {}

export function BalancaGeralTab({ form, setForm, errors, unidades, indicadores }: Props) {
  const unidadeOptions = [
    { value: '', label: 'Selecione...' },
    ...(unidades || []).map((u) => ({ value: u.id, label: u.nome })),
  ];
  const indicadorOptions = [
    { value: '', label: 'Selecione...' },
    ...(indicadores || []).map((i) => ({
      value: i.id,
      label: `${i.fabricante ?? 'Sem fabricante'} - ${i.modelo ?? i.descricao ?? 'Sem modelo'}`,
    })),
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome *"
          value={form.nome || ''}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          error={errors.nome}
        />
        <Select
          label="Direcao"
          value={form.tipoEntradaSaida || ''}
          onChange={(e) => setForm((f) => ({ ...f, tipoEntradaSaida: e.target.value }))}
          options={[
            { value: '', label: 'Nao definido' },
            { value: 'ENTRADA', label: 'Entrada' },
            { value: 'SAIDA', label: 'Saida' },
            { value: 'AMBOS', label: 'Ambos' },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Unidade *"
          options={unidadeOptions}
          value={form.unidadeId || ''}
          onChange={(e) => setForm((f) => ({ ...f, unidadeId: e.target.value }))}
          error={errors.unidadeId}
        />
        <Select
          label="Indicador de Pesagem *"
          options={indicadorOptions}
          value={form.indicadorId || ''}
          onChange={(e) => setForm((f) => ({ ...f, indicadorId: e.target.value }))}
          error={errors.indicadorId}
        />
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
        <Switch
          checked={form.ativa ?? form.ativo ?? true}
          onCheckedChange={(checked) => setForm((f) => ({ ...f, ativa: checked, ativo: checked }))}
        />
        <label className="text-sm text-slate-700">Balanca ativa</label>
      </div>
    </div>
  );
}
