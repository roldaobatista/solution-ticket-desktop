'use client';

import { useMemo, useState } from 'react';
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
import { Dialog } from '@/components/ui/dialog';
import { TabHeader } from '@/components/financeiro/TabHeader';
import {
  getFaturas,
  getFaturaById,
  createFatura,
  getTicketsPendentesFaturamento,
  getTiposFatura,
  getPagamentos,
  createPagamento,
  baixarPagamento,
  getFormasPagamento,
  getSaldosClientes,
  getExtratoCliente,
  getClientes,
} from '@/lib/api';
import { formatCurrency, formatDate, formatDateShort, formatWeight } from '@/lib/utils';
import {
  Receipt,
  Eye,
  Plus,
  Ban,
  FileDown,
  ChevronLeft,
  CheckCircle2,
  Wallet,
  Users,
} from 'lucide-react';

// ==================== FATURAS TAB ====================
function FaturasTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['faturas', page],
    queryFn: () => getFaturas(page, 10),
  });

  const { data: tipos } = useQuery({ queryKey: ['tipos-fatura'], queryFn: getTiposFatura });
  const { data: clientesRes } = useQuery({
    queryKey: ['fat-clientes'],
    queryFn: () => getClientes(1, 200),
  });

  const { data: selected } = useQuery({
    queryKey: ['fatura', selectedId],
    queryFn: () => (selectedId ? getFaturaById(selectedId) : null),
    enabled: !!selectedId,
  });

  const faturas = useMemo(() => {
    let all = data?.data || [];
    if (statusFilter) all = all.filter((f) => f.status === statusFilter);
    if (tipoFilter) all = all.filter((f) => f.tipo_fatura === tipoFilter);
    if (clienteFilter) all = all.filter((f) => f.cliente_id === clienteFilter);
    return all;
  }, [data, statusFilter, tipoFilter, clienteFilter]);

  if (selectedId && selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selected.numero}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    selected.status === 'PAGA'
                      ? 'success'
                      : selected.status === 'PARCIALMENTE_PAGA'
                        ? 'warning'
                        : selected.status === 'CANCELADA'
                          ? 'danger'
                          : 'primary'
                  }
                >
                  {selected.status}
                </Badge>
                <Badge variant="outline">{selected.tipo_fatura}</Badge>
              </div>
            </div>
          </div>
          {selected.status !== 'CANCELADA' && (
            <Link href={`/financeiro/cancelar/${selected.id}`}>
              <Button variant="danger">
                <Ban className="w-4 h-4 mr-2" /> Cancelar Fatura
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoBox label="Cliente" value={selected.cliente_nome || '-'} />
            <InfoBox label="Data Emissao" value={formatDateShort(selected.data_emissao)} />
            <InfoBox label="Nota Fiscal" value={selected.nota_fiscal_associada || '-'} />
            <InfoBox label="Total" value={formatCurrency(selected.total_geral)} accent />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            {selected.pagamentos && selected.pagamentos.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Forma</TableHeader>
                    <TableHeader>Valor</TableHeader>
                    <TableHeader>Data Emissao</TableHeader>
                    <TableHeader>Vencimento</TableHeader>
                    <TableHeader>Documento</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selected.pagamentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.forma_pagamento_descricao}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.valor)}</TableCell>
                      <TableCell>{formatDateShort(p.data_emissao)}</TableCell>
                      <TableCell>{formatDateShort(p.data_vencimento)}</TableCell>
                      <TableCell className="text-xs">{p.numero_documento || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-6 text-slate-400 text-sm">Nenhum pagamento registrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{data?.total || 0} fatura(s)</p>
        <Button variant="primary" onClick={() => setOpenCreate(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova Fatura
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              label="Status"
              placeholder="Todos"
              options={[
                { value: 'ABERTA', label: 'Aberta' },
                { value: 'PARCIALMENTE_PAGA', label: 'Parcial' },
                { value: 'PAGA', label: 'Paga' },
                { value: 'CANCELADA', label: 'Cancelada' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              label="Tipo"
              placeholder="Todos"
              options={(tipos || []).map((t) => ({ value: t.descricao, label: t.descricao }))}
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            />
            <Select
              label="Cliente"
              placeholder="Todos"
              options={(clientesRes?.data || []).map((c) => ({
                value: c.id,
                label: c.razao_social,
              }))}
              value={clienteFilter}
              onChange={(e) => setClienteFilter(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter('');
                  setTipoFilter('');
                  setClienteFilter('');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Numero</TableHeader>
                <TableHeader>Data</TableHeader>
                <TableHeader>Cliente</TableHeader>
                <TableHeader>Tipo</TableHeader>
                <TableHeader>Valor</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : faturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma fatura
                  </TableCell>
                </TableRow>
              ) : (
                faturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{formatDateShort(f.data_emissao)}</TableCell>
                    <TableCell>{f.cliente_nome || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{f.tipo_fatura}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(f.total_geral)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          f.status === 'PAGA'
                            ? 'success'
                            : f.status === 'PARCIALMENTE_PAGA'
                              ? 'warning'
                              : f.status === 'CANCELADA'
                                ? 'danger'
                                : 'primary'
                        }
                      >
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setSelectedId(f.id)}
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        {f.status !== 'CANCELADA' && (
                          <Link href={`/financeiro/cancelar/${f.id}`}>
                            <Button variant="ghost" size="sm" className="p-1">
                              <Ban className="w-4 h-4 text-red-500" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Pagina {page} de {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
            >
              Proxima
            </Button>
          </div>
        </div>
      )}

      <NovaFaturaDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['faturas'] });
          setOpenCreate(false);
        }}
      />
    </div>
  );
}

function NovaFaturaDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCreated: () => void;
}) {
  const [clienteId, setClienteId] = useState('');
  const [tipoFaturaId, setTipoFaturaId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  const { data: clientesRes } = useQuery({
    queryKey: ['nv-clientes'],
    queryFn: () => getClientes(1, 200),
    enabled: open,
  });
  const { data: tipos } = useQuery({
    queryKey: ['nv-tipos'],
    queryFn: getTiposFatura,
    enabled: open,
  });
  const { data: pendentes } = useQuery({
    queryKey: ['nv-pendentes', clienteId],
    queryFn: () => getTicketsPendentesFaturamento(clienteId || undefined),
    enabled: open && !!clienteId,
  });

  const mut = useMutation({
    mutationFn: () =>
      createFatura({
        cliente_id: clienteId,
        tipo_fatura_id: tipoFaturaId,
        tickets_ids: selectedTickets,
        observacao,
      }),
    onSuccess: () => {
      setClienteId('');
      setTipoFaturaId('');
      setObservacao('');
      setSelectedTickets([]);
      onCreated();
    },
  });

  const toggleTicket = (id: string) =>
    setSelectedTickets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const totalSelecionado = (pendentes || [])
    .filter((t) => selectedTickets.includes(t.id))
    .reduce((acc, t) => acc + (t.valor_total ? t.valor_total / 100 : 0), 0);

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Nova Fatura"
      maxWidth="max-w-3xl"
    >
      <div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Cliente"
              placeholder="Selecione"
              options={(clientesRes?.data || []).map((c) => ({
                value: c.id,
                label: c.razao_social,
              }))}
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setSelectedTickets([]);
              }}
            />
            <Select
              label="Tipo de Fatura"
              placeholder="Selecione"
              options={(tipos || []).map((t) => ({ value: t.id, label: t.descricao }))}
              value={tipoFaturaId}
              onChange={(e) => setTipoFaturaId(e.target.value)}
            />
          </div>

          <Input
            label="Observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Faturamento consolidado"
          />

          {clienteId && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Tickets pendentes ({(pendentes || []).length})
              </p>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Sel</TableHeader>
                      <TableHeader>Ticket</TableHeader>
                      <TableHeader>Produto</TableHeader>
                      <TableHeader>Peso</TableHeader>
                      <TableHeader>Valor</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(pendentes || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-slate-400">
                          Nenhum ticket pendente
                        </TableCell>
                      </TableRow>
                    ) : (
                      (pendentes || []).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(t.id)}
                              onChange={() => toggleTicket(t.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{t.numero}</TableCell>
                          <TableCell>{t.produto_nome}</TableCell>
                          <TableCell>
                            {t.peso_liquido_final ? formatWeight(t.peso_liquido_final) : '-'}
                          </TableCell>
                          <TableCell>
                            {t.valor_total ? formatCurrency(t.valor_total / 100) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {selectedTickets.length > 0 && (
                <p className="text-sm text-slate-600 mt-2">
                  {selectedTickets.length} ticket(s) - Total estimado:{' '}
                  <b>{formatCurrency(totalSelecionado)}</b>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            isLoading={mut.isPending}
            onClick={() => mut.mutate()}
            disabled={!clienteId || !tipoFaturaId || selectedTickets.length === 0}
          >
            Gerar Fatura
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ==================== PAGAMENTOS TAB ====================
function PagamentosTab() {
  const qc = useQueryClient();
  const [faturaFilter, setFaturaFilter] = useState('');
  const [form, setForm] = useState({
    fatura_id: '',
    forma_pagamento_id: '',
    valor: '',
    data_emissao: new Date().toISOString().slice(0, 10),
    data_vencimento: '',
    numero_documento: '',
    observacao: '',
  });

  const { data: pags } = useQuery({
    queryKey: ['pagamentos', faturaFilter],
    queryFn: () => getPagamentos(1, 50, faturaFilter || undefined),
  });
  const { data: formasRes } = useQuery({ queryKey: ['formas-pg'], queryFn: getFormasPagamento });
  const { data: faturasRes } = useQuery({
    queryKey: ['pg-faturas'],
    queryFn: () => getFaturas(1, 200),
  });

  const mut = useMutation({
    mutationFn: () =>
      createPagamento({
        fatura_id: form.fatura_id,
        forma_pagamento_id: form.forma_pagamento_id,
        valor: Number(form.valor) * 100,
        data_emissao: form.data_emissao,
        data_vencimento: form.data_vencimento || undefined,
        numero_documento: form.numero_documento || undefined,
        observacao: form.observacao || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagamentos'] });
      setForm({ ...form, valor: '', numero_documento: '', observacao: '' });
    },
  });

  const baixa = useMutation({
    mutationFn: (id: string) => baixarPagamento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pagamentos'] }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-slate-500" /> Registrar Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              label="Fatura"
              placeholder="Selecione"
              options={(faturasRes?.data || []).map((f) => ({
                value: f.id,
                label: `${f.numero} - ${f.cliente_nome}`,
              }))}
              value={form.fatura_id}
              onChange={(e) => setForm({ ...form, fatura_id: e.target.value })}
            />
            <Select
              label="Forma de Pagamento"
              placeholder="Selecione"
              options={(formasRes || []).map((f) => ({ value: f.id, label: f.descricao }))}
              value={form.forma_pagamento_id}
              onChange={(e) => setForm({ ...form, forma_pagamento_id: e.target.value })}
            />
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
            <Input
              label="Data Emissao"
              type="date"
              value={form.data_emissao}
              onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
            />
            <Input
              label="Data Vencimento"
              type="date"
              value={form.data_vencimento}
              onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
            />
            <Input
              label="Numero Documento"
              value={form.numero_documento}
              onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
            />
            <Input
              label="Descricao"
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
            <div className="flex items-end">
              <Button
                variant="success"
                isLoading={mut.isPending}
                onClick={() => mut.mutate()}
                disabled={!form.fatura_id || !form.forma_pagamento_id || !form.valor}
              >
                Registrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pagamentos</CardTitle>
          <div className="w-64">
            <Select
              placeholder="Todas as faturas"
              options={(faturasRes?.data || []).map((f) => ({ value: f.id, label: f.numero }))}
              value={faturaFilter}
              onChange={(e) => setFaturaFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Fatura</TableHeader>
                <TableHeader>Forma</TableHeader>
                <TableHeader>Valor</TableHeader>
                <TableHeader>Emissao</TableHeader>
                <TableHeader>Vencimento</TableHeader>
                <TableHeader>Documento</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {(pags?.data || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum pagamento
                  </TableCell>
                </TableRow>
              ) : (
                (pags?.data || []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.fatura_id}</TableCell>
                    <TableCell>{p.forma_pagamento_descricao}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.valor / 100)}</TableCell>
                    <TableCell>{formatDateShort(p.data_emissao)}</TableCell>
                    <TableCell>{formatDateShort(p.data_vencimento)}</TableCell>
                    <TableCell className="text-xs">{p.numero_documento || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => baixa.mutate(p.id)}
                        isLoading={baixa.isPending && baixa.variables === p.id}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Dar baixa
                      </Button>
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

// ==================== SALDOS TAB ====================
function SaldosTab() {
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null);
  const { data: saldos } = useQuery({ queryKey: ['saldos'], queryFn: () => getSaldosClientes() });
  const { data: extrato } = useQuery({
    queryKey: ['extrato', selectedCliente],
    queryFn: () => (selectedCliente ? getExtratoCliente(selectedCliente) : null),
    enabled: !!selectedCliente,
  });

  if (selectedCliente) {
    const cliente = saldos?.find((s) => s.cliente_id === selectedCliente);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCliente(null)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{cliente?.cliente_nome}</h2>
            <p className="text-sm text-slate-500">
              Saldo: {formatCurrency(cliente?.saldo_atual || 0)}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extrato</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Tipo</TableHeader>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Descricao</TableHeader>
                  <TableHeader>Referencia</TableHeader>
                  <TableHeader>Valor</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {(extrato || []).map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <Badge
                        variant={
                          it.tipo === 'PAGAMENTO'
                            ? 'success'
                            : it.tipo === 'FATURA'
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        {it.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(it.data)}</TableCell>
                    <TableCell>{it.descricao}</TableCell>
                    <TableCell className="font-mono text-xs">{it.referencia}</TableCell>
                    <TableCell
                      className={`font-medium ${it.valor < 0 ? 'text-emerald-600' : 'text-slate-800'}`}
                    >
                      {formatCurrency(it.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saldos por Cliente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Cliente</TableHeader>
              <TableHeader>Total Faturado</TableHeader>
              <TableHeader>Total Pago</TableHeader>
              <TableHeader>Saldo Atual</TableHeader>
              <TableHeader>Ultimo Saldo</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(saldos || []).map((s) => (
              <TableRow
                key={s.cliente_id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedCliente(s.cliente_id)}
              >
                <TableCell className="font-medium">{s.cliente_nome}</TableCell>
                <TableCell>{formatCurrency(s.total_faturado)}</TableCell>
                <TableCell>{formatCurrency(s.total_pago)}</TableCell>
                <TableCell
                  className={`font-bold ${s.saldo_atual < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  {formatCurrency(s.saldo_atual)}
                </TableCell>
                <TableCell>{formatDateShort(s.data_ultimo_saldo)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Eye className="w-4 h-4 text-slate-500" />
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

function InfoBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`text-sm font-medium ${accent ? 'text-emerald-700 text-lg font-bold' : 'text-slate-800'}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">Faturas, pagamentos e saldos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/financeiro/ajuste-preco">
            <Button variant="secondary">
              <FileDown className="w-4 h-4 mr-2" /> Ajuste de Preco
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        tabs={[
          {
            value: 'faturas',
            label: 'Faturas',
            content: (
              <div className="space-y-1">
                <TabHeader
                  icon={<Receipt className="w-4 h-4" />}
                  label="Gerenciamento de faturas"
                />
                <FaturasTab />
              </div>
            ),
          },
          {
            value: 'pagamentos',
            label: 'Pagamentos',
            content: (
              <div className="space-y-1">
                <TabHeader
                  icon={<Wallet className="w-4 h-4" />}
                  label="Registro e baixa de pagamentos"
                />
                <PagamentosTab />
              </div>
            ),
          },
          {
            value: 'saldos',
            label: 'Saldos',
            content: (
              <div className="space-y-1">
                <TabHeader icon={<Users className="w-4 h-4" />} label="Saldos por cliente" />
                <SaldosTab />
              </div>
            ),
          },
        ]}
        defaultValue="faturas"
      />
    </div>
  );
}
