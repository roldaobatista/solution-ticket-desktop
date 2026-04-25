'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import {
  getTicketsFechados,
  getTicketById,
  getHistoricoTicket,
  updateTicketManutencao,
} from '@/lib/api';
import { formatDate, formatWeight } from '@/lib/utils';
import { Pencil, History, Search, Save, X } from 'lucide-react';

export default function ManutencaoTicketPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [motivo, setMotivo] = useState('');
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['manutencao-tickets', page, search],
    queryFn: () => getTicketsFechados(page, 10, search),
  });

  const { data: ticket } = useQuery({
    queryKey: ['ticket-edit', editingId],
    queryFn: () => getTicketById(editingId!),
    enabled: !!editingId,
  });

  const { data: historico } = useQuery({
    queryKey: ['ticket-historico', editingId],
    queryFn: () => getHistoricoTicket(editingId!),
    enabled: !!editingId,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateTicketManutencao(editingId!, { ...form, motivo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manutencao-tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-edit'] });
      qc.invalidateQueries({ queryKey: ['ticket-historico'] });
      setEditingId(null);
      setMotivo('');
      setForm({});
    },
  });

  const openEdit = (id: string) => {
    setEditingId(id);
    setMotivo('');
  };

  // Quando carregar ticket, preenche form
  useMemo(() => {
    if (ticket && editingId) {
      setForm({
        veiculo_placa: ticket.veiculo_placa,
        nota_fiscal: ticket.nota_fiscal || '',
        peso_nf: ticket.peso_nf || '',
        peso_bruto_apurado: ticket.peso_bruto_apurado || '',
        peso_tara_apurada: ticket.peso_tara_apurada || '',
        observacao: ticket.observacao || '',
      });
    }
  }, [ticket, editingId]);

  const tickets = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manutencao de Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Edicao de tickets fechados com rastreamento</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por numero, placa ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
            />
            <Button variant="secondary" onClick={() => setPage(1)}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
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
                <TableHeader>Placa</TableHeader>
                <TableHeader>Cliente</TableHeader>
                <TableHeader>Produto</TableHeader>
                <TableHeader>Peso Liq.</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    Nenhum ticket fechado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.numero}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(t.created_at)}
                    </TableCell>
                    <TableCell className="font-mono">{t.veiculo_placa}</TableCell>
                    <TableCell>{t.cliente_nome || '-'}</TableCell>
                    <TableCell>{t.produto_nome || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {t.peso_liquido_final ? formatWeight(t.peso_liquido_final) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Fechado</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="secondary" size="sm" onClick={() => openEdit(t.id)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog edicao */}
      <Dialog
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title={ticket ? `Editar Ticket #${ticket.numero}` : 'Editar Ticket'}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Placa"
              value={form.veiculo_placa || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, veiculo_placa: e.target.value }))}
            />
            <Input
              label="Nota Fiscal"
              value={form.nota_fiscal || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, nota_fiscal: e.target.value }))}
            />
            <Input
              label="Peso NF (kg)"
              type="number"
              value={form.peso_nf || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, peso_nf: Number(e.target.value) }))}
            />
            <Input
              label="Peso Bruto (kg)"
              type="number"
              value={form.peso_bruto_apurado || ''}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, peso_bruto_apurado: Number(e.target.value) }))
              }
            />
            <Input
              label="Peso Tara (kg)"
              type="number"
              value={form.peso_tara_apurada || ''}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, peso_tara_apurada: Number(e.target.value) }))
              }
            />
            <Input
              label="Observacao"
              value={form.observacao || ''}
              onChange={(e) => setForm((f: any) => ({ ...f, observacao: e.target.value }))}
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <Input
              label="Motivo da Alteracao *"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo desta alteracao"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
              <History className="w-4 h-4" />
              Historico de Alteracoes
            </div>
            {!historico || historico.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma alteracao registrada</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {historico.map((h) => (
                  <div
                    key={h.id}
                    className="text-xs p-2 bg-slate-50 rounded border border-slate-200"
                  >
                    <div className="flex justify-between">
                      <strong>{h.campo}</strong>
                      <span className="text-slate-500">{formatDate(h.data_alteracao)}</span>
                    </div>
                    <div className="text-slate-600">
                      {h.valor_anterior} -&gt; {h.valor_novo}
                    </div>
                    <div className="text-slate-500 italic">{h.motivo}</div>
                    <div className="text-slate-400">por {h.usuario_nome || h.usuario_id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setEditingId(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => updateMutation.mutate()}
              disabled={!motivo.trim()}
              isLoading={updateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alteracoes
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
