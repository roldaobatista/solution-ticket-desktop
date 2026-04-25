'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  getClientes,
  getProdutos,
  getMotoristas,
  getTransportadoras,
  getVeiculos,
} from '@/lib/api';
import { FiltroRelatorioValues } from '@/types';
import { Filter, RotateCcw, Search } from 'lucide-react';

export interface FiltroRelatorioProps {
  value: FiltroRelatorioValues;
  onChange: (value: FiltroRelatorioValues) => void;
  onApply: () => void;
  onClear: () => void;
  showFields?: Partial<
    Record<
      | 'dataInicio'
      | 'dataFim'
      | 'cliente'
      | 'produto'
      | 'motorista'
      | 'transportadora'
      | 'veiculo'
      | 'armazem'
      | 'status'
      | 'tipoFatura',
      boolean
    >
  >;
  extraActions?: React.ReactNode;
}

export function FiltroRelatorio({
  value,
  onChange,
  onApply,
  onClear,
  showFields,
  extraActions,
}: FiltroRelatorioProps) {
  const show = {
    dataInicio: true,
    dataFim: true,
    cliente: true,
    produto: true,
    motorista: false,
    transportadora: false,
    veiculo: false,
    armazem: false,
    status: false,
    tipoFatura: false,
    ...(showFields || {}),
  };

  const { data: clientesRes } = useQuery({
    queryKey: ['rel-clientes-opts'],
    queryFn: () => getClientes(1, 200),
    enabled: show.cliente,
  });
  const { data: produtosRes } = useQuery({
    queryKey: ['rel-produtos-opts'],
    queryFn: () => getProdutos(1, 200),
    enabled: show.produto,
  });
  const { data: motoristasRes } = useQuery({
    queryKey: ['rel-motoristas-opts'],
    queryFn: () => getMotoristas(1, 200),
    enabled: show.motorista,
  });
  const { data: transportadorasRes } = useQuery({
    queryKey: ['rel-transportadoras-opts'],
    queryFn: () => getTransportadoras(1, 200),
    enabled: show.transportadora,
  });
  const { data: veiculosRes } = useQuery({
    queryKey: ['rel-veiculos-opts'],
    queryFn: () => getVeiculos(1, 200),
    enabled: show.veiculo,
  });

  const set = <K extends keyof FiltroRelatorioValues>(k: K, v: FiltroRelatorioValues[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {show.dataInicio && (
            <Input
              label="Data Inicio"
              type="date"
              value={value.dataInicio || ''}
              onChange={(e) => set('dataInicio', e.target.value)}
            />
          )}
          {show.dataFim && (
            <Input
              label="Data Fim"
              type="date"
              value={value.dataFim || ''}
              onChange={(e) => set('dataFim', e.target.value)}
            />
          )}
          {show.cliente && (
            <Select
              label="Cliente"
              placeholder="Todos"
              options={(clientesRes?.data || []).map((c) => ({
                value: c.id,
                label: c.razao_social,
              }))}
              value={value.clienteId || ''}
              onChange={(e) => set('clienteId', e.target.value || undefined)}
            />
          )}
          {show.produto && (
            <Select
              label="Produto"
              placeholder="Todos"
              options={(produtosRes?.data || []).map((p) => ({ value: p.id, label: p.descricao }))}
              value={value.produtoId || ''}
              onChange={(e) => set('produtoId', e.target.value || undefined)}
            />
          )}
          {show.motorista && (
            <Select
              label="Motorista"
              placeholder="Todos"
              options={(motoristasRes?.data || []).map((m) => ({ value: m.id, label: m.nome }))}
              value={value.motoristaId || ''}
              onChange={(e) => set('motoristaId', e.target.value || undefined)}
            />
          )}
          {show.transportadora && (
            <Select
              label="Transportadora"
              placeholder="Todas"
              options={(transportadorasRes?.data || []).map((t) => ({
                value: t.id,
                label: t.nome,
              }))}
              value={value.transportadoraId || ''}
              onChange={(e) => set('transportadoraId', e.target.value || undefined)}
            />
          )}
          {show.veiculo && (
            <Select
              label="Veiculo"
              placeholder="Todos"
              options={(veiculosRes?.data || []).map((v) => ({ value: v.id, label: v.placa }))}
              value={value.veiculoId || ''}
              onChange={(e) => set('veiculoId', e.target.value || undefined)}
            />
          )}
          {show.armazem && (
            <Input
              label="Armazem"
              value={value.armazemId || ''}
              onChange={(e) => set('armazemId', e.target.value || undefined)}
              placeholder="ID/descricao"
            />
          )}
          {show.status && (
            <Select
              label="Status"
              placeholder="Todos"
              options={[
                { value: 'ABERTA', label: 'Aberta' },
                { value: 'PARCIALMENTE_PAGA', label: 'Parcialmente Paga' },
                { value: 'PAGA', label: 'Paga' },
                { value: 'CANCELADA', label: 'Cancelada' },
              ]}
              value={value.status || ''}
              onChange={(e) => set('status', e.target.value || undefined)}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onApply}>
            <Search className="w-4 h-4 mr-2" /> Aplicar
          </Button>
          <Button variant="secondary" onClick={onClear}>
            <RotateCcw className="w-4 h-4 mr-2" /> Limpar
          </Button>
          {extraActions}
        </div>
      </CardContent>
    </Card>
  );
}

export default FiltroRelatorio;
