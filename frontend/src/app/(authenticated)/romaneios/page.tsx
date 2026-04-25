'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { getRomaneios, getClientes, createRomaneio } from '@/lib/api';
import { formatWeight, formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { ClipboardList, Plus, Save, Eye } from 'lucide-react';

export default function RomaneiosPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    cliente_id: '',
    data_inicio: '',
    data_fim: '',
    observacao: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['romaneios', page],
    queryFn: () => getRomaneios(page, 10),
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: () => getClientes(1, 100),
  });

  const createMut = useMutation({
    mutationFn: createRomaneio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['romaneios'] });
      setDialogOpen(false);
      setForm({ cliente_id: '', data_inicio: '', data_fim: '', observacao: '' });
    },
  });

  const clienteOptions = (clientes?.data || []).map((c) => ({
    value: c.id,
    label: c.razao_social,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Romaneios</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} romaneios emitidos</p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Romaneio
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Numero</TableHeader>
                <TableHeader>Cliente</TableHeader>
                <TableHeader>Periodo</TableHeader>
                <TableHeader>Peso Total</TableHeader>
                <TableHeader>Valor Total</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Emitido em</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                    Nenhum romaneio encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.numero}</TableCell>
                    <TableCell>{r.cliente_nome || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {formatDateShort(r.data_inicio)} a {formatDateShort(r.data_fim)}
                    </TableCell>
                    <TableCell className="font-mono">{formatWeight(r.peso_total)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(r.valor_total)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'FECHADO' ? 'success' : 'primary'}>
                        {r.status === 'FECHADO'
                          ? 'Fechado'
                          : r.status === 'ABERTO'
                            ? 'Aberto'
                            : r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(r.emitido_em)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="p-1" aria-label="Visualizar">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
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

      {/* Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Novo Romaneio"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <Select
            label="Cliente *"
            options={[{ value: '', label: 'Selecione...' }, ...clienteOptions]}
            value={form.cliente_id}
            onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
          />
          <Input
            label="Data Inicio *"
            type="date"
            value={form.data_inicio}
            onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
          />
          <Input
            label="Data Fim *"
            type="date"
            value={form.data_fim}
            onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
          />
          <Input
            label="Observacao"
            value={form.observacao}
            onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
            placeholder="Observacoes sobre o romaneio"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => createMut.mutate(form)}
              isLoading={createMut.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Emitir Romaneio
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
