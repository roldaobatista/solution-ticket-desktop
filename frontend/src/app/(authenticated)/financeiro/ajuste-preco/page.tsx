'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import {
  getTabelaPrecoProdutos,
  getTabelaPrecoProdutoCliente,
  ajustarPrecoProduto,
  ajustarPrecoCliente,
  getHistoricoPreco,
  getClientes,
  getProdutos,
} from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ChevronLeft, Save, History as HistoryIcon, DollarSign } from 'lucide-react';

function PrecoGeralTab() {
  const qc = useQueryClient();
  const { data: precos } = useQuery({
    queryKey: ['preco-produtos'],
    queryFn: getTabelaPrecoProdutos,
  });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: ({
      produto_id,
      preco,
      motivo,
    }: {
      produto_id: string;
      preco: number;
      motivo?: string;
    }) => ajustarPrecoProduto(produto_id, preco, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preco-produtos'] });
      qc.invalidateQueries({ queryKey: ['historico-preco'] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          Tabela Geral de Precos por Produto
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Produto</TableHeader>
              <TableHeader>Preco Atual</TableHeader>
              <TableHeader>Novo Preco</TableHeader>
              <TableHeader>Motivo</TableHeader>
              <TableHeader>Vigencia</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(precos || []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.produto_nome}</TableCell>
                <TableCell>{formatCurrency(p.preco)}</TableCell>
                <TableCell className="w-40">
                  <Input
                    type="number"
                    step="0.01"
                    value={edits[p.produto_id] ?? ''}
                    onChange={(e) => setEdits({ ...edits, [p.produto_id]: e.target.value })}
                    placeholder="Novo valor"
                  />
                </TableCell>
                <TableCell className="w-60">
                  <Input
                    value={motivos[p.produto_id] ?? ''}
                    onChange={(e) => setMotivos({ ...motivos, [p.produto_id]: e.target.value })}
                    placeholder="Ex: Reajuste trimestral"
                  />
                </TableCell>
                <TableCell className="text-xs text-slate-500">{formatDate(p.updated_at)}</TableCell>
                <TableCell>
                  <Button
                    variant="success"
                    size="sm"
                    disabled={!edits[p.produto_id] || Number(edits[p.produto_id]) <= 0}
                    isLoading={mut.isPending && mut.variables?.produto_id === p.produto_id}
                    onClick={() =>
                      mut.mutate({
                        produto_id: p.produto_id,
                        preco: Number(edits[p.produto_id]),
                        motivo: motivos[p.produto_id],
                      })
                    }
                  >
                    <Save className="w-3 h-3 mr-1" /> Salvar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PrecoClienteTab() {
  const qc = useQueryClient();
  const [clienteId, setClienteId] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [preco, setPreco] = useState('');
  const [motivo, setMotivo] = useState('');

  const { data: clientesRes } = useQuery({
    queryKey: ['ap-clientes'],
    queryFn: () => getClientes(1, 200),
  });
  const { data: produtosRes } = useQuery({
    queryKey: ['ap-produtos'],
    queryFn: () => getProdutos(1, 200),
  });
  const { data: precos } = useQuery({
    queryKey: ['preco-cliente', clienteId],
    queryFn: () => getTabelaPrecoProdutoCliente(clienteId || undefined),
  });

  const mut = useMutation({
    mutationFn: () => ajustarPrecoCliente(produtoId, clienteId, Number(preco), motivo),
    onSuccess: () => {
      setPreco('');
      setMotivo('');
      qc.invalidateQueries({ queryKey: ['preco-cliente'] });
      qc.invalidateQueries({ queryKey: ['historico-preco'] });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajustar Preco por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select
              label="Cliente"
              placeholder="Selecione"
              options={(clientesRes?.data || []).map((c) => ({
                value: c.id,
                label: c.razao_social,
              }))}
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            />
            <Select
              label="Produto"
              placeholder="Selecione"
              options={(produtosRes?.data || []).map((p) => ({ value: p.id, label: p.descricao }))}
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
            />
            <Input
              label="Preco (R$)"
              type="number"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
            <Input label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            <div className="flex items-end">
              <Button
                variant="success"
                isLoading={mut.isPending}
                onClick={() => mut.mutate()}
                disabled={!clienteId || !produtoId || !preco}
              >
                <Save className="w-4 h-4 mr-2" /> Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precos Diferenciados Vigentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Cliente</TableHeader>
                <TableHeader>Produto</TableHeader>
                <TableHeader>Preco</TableHeader>
                <TableHeader>Vigencia</TableHeader>
                <TableHeader>Atualizado</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {(precos || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                    Nenhum preco diferenciado
                  </TableCell>
                </TableRow>
              ) : (
                (precos || []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.cliente_nome}</TableCell>
                    <TableCell>{p.produto_nome}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.preco)}</TableCell>
                    <TableCell className="text-xs">{formatDate(p.vigencia_inicio)}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(p.updated_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoricoCard() {
  const { data } = useQuery({ queryKey: ['historico-preco'], queryFn: () => getHistoricoPreco() });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-slate-500" /> Historico de Alteracoes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Data</TableHeader>
              <TableHeader>Produto</TableHeader>
              <TableHeader>Cliente</TableHeader>
              <TableHeader>De</TableHeader>
              <TableHeader>Para</TableHeader>
              <TableHeader>Usuario</TableHeader>
              <TableHeader>Motivo</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                  Sem registros
                </TableCell>
              </TableRow>
            ) : (
              (data || []).map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs">{formatDate(h.alterado_em)}</TableCell>
                  <TableCell>{h.produto_nome}</TableCell>
                  <TableCell>
                    {h.cliente_nome ? (
                      <Badge variant="info">{h.cliente_nome}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Geral</span>
                    )}
                  </TableCell>
                  <TableCell className="text-red-600">{formatCurrency(h.preco_anterior)}</TableCell>
                  <TableCell className="text-emerald-600 font-medium">
                    {formatCurrency(h.preco_novo)}
                  </TableCell>
                  <TableCell>{h.alterado_por}</TableCell>
                  <TableCell className="text-xs text-slate-600">{h.motivo}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AjustePrecoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/financeiro">
          <Button variant="ghost" size="sm" aria-label="Anterior">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ajuste de Preco</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tabela geral e precos diferenciados por cliente
          </p>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'geral', label: 'Preco Geral', content: <PrecoGeralTab /> },
          { value: 'cliente', label: 'Preco por Cliente', content: <PrecoClienteTab /> },
        ]}
        defaultValue="geral"
      />

      <HistoricoCard />
    </div>
  );
}
