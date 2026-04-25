'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  getVeiculos,
  getTransportadoras,
  createVeiculo,
  updateVeiculo,
  deleteVeiculo,
} from '@/lib/api';
import { Veiculo } from '@/types';
import { formatWeight } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  placa: z.string().min(1, 'Placa obrigatoria'),
  transportadora_id: z.string().optional(),
  tara_cadastrada: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function VeiculosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<Partial<FormData>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['veiculos', page, search],
    queryFn: () => getVeiculos(page, 10, search),
  });

  const { data: transportadoras } = useQuery({
    queryKey: ['transportadoras-select'],
    queryFn: () => getTransportadoras(1, 100),
  });

  const transpOptions = (transportadoras?.data || []).map((t) => ({ value: t.id, label: t.nome }));

  const createMut = useMutation({
    mutationFn: createVeiculo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Veiculo> }) => updateVeiculo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      setDialogOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteVeiculo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof FormData] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      ...form,
      tara_cadastrada: form.tara_cadastrada ? parseFloat(form.tara_cadastrada) : undefined,
    };
    editingId ? updateMut.mutate({ id: editingId, data: payload }) : createMut.mutate(payload);
  };

  const openEdit = (item: Veiculo) => {
    setEditingId(item.id);
    setForm({
      placa: item.placa,
      transportadora_id: item.transportadora_id || '',
      tara_cadastrada: item.tara_cadastrada?.toString() || '',
      observacoes: item.observacoes || '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Veiculos</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} veiculos cadastrados</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingId(null);
            setForm({});
            setErrors({});
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Veiculo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refetch()}
            />
            <Button variant="secondary" onClick={() => refetch()}>
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
                <TableHeader>Placa</TableHeader>
                <TableHeader>Transportadora</TableHeader>
                <TableHeader>Tara Cadastrada</TableHeader>
                <TableHeader>Observacoes</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhum veiculo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-bold text-lg">{v.placa}</TableCell>
                    <TableCell>{v.transportadora_nome || '-'}</TableCell>
                    <TableCell className="font-mono">
                      {v.tara_cadastrada ? formatWeight(v.tara_cadastrada) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                      {v.observacoes || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.ativo ? 'success' : 'default'}>
                        {v.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(v)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(v.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Editar Veiculo' : 'Novo Veiculo'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Placa *"
            value={form.placa || ''}
            onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value.toUpperCase() }))}
            error={errors.placa}
            placeholder="ABC-1234"
          />
          <Select
            label="Transportadora"
            options={[{ value: '', label: 'Selecione...' }, ...transpOptions]}
            value={form.transportadora_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, transportadora_id: e.target.value }))}
          />
          <Input
            label="Tara Cadastrada (kg)"
            type="number"
            value={form.tara_cadastrada || ''}
            onChange={(e) => setForm((f) => ({ ...f, tara_cadastrada: e.target.value }))}
            placeholder="Peso da tara do veiculo"
          />
          <Input
            label="Observacoes"
            value={form.observacoes || ''}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={createMut.isPending || updateMut.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title="Excluir Veiculo"
        description="Tem certeza que deseja excluir este veiculo?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
