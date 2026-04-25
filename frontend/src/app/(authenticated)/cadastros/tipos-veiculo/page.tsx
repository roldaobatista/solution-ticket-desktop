'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import {
  getTiposVeiculo,
  createTipoVeiculo,
  updateTipoVeiculo,
  deleteTipoVeiculo,
} from '@/lib/api';
import { TipoVeiculo } from '@/types';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  descricao: z.string().min(1, 'Descricao obrigatoria'),
  precoPesagem: z.coerce.number().optional(),
});

type FormT = z.infer<typeof schema>;

export default function TiposVeiculoPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormT, string>>>({});
  const [form, setForm] = useState<Partial<FormT>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tipos-veiculo', page, search],
    queryFn: () => getTiposVeiculo(page, 10, search),
  });

  const createMutation = useMutation({
    mutationFn: createTipoVeiculo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-veiculo'] });
      setDialogOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TipoVeiculo> }) =>
      updateTipoVeiculo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-veiculo'] });
      setDialogOpen(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTipoVeiculo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-veiculo'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof FormT] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const openEdit = (t: TipoVeiculo) => {
    setEditingId(t.id);
    setForm({ descricao: t.descricao, precoPesagem: t.precoPesagem });
    setErrors({});
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({});
    setErrors({});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tipos de Veiculo</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} tipos cadastrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por descricao..."
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
                <TableHeader>Descricao</TableHeader>
                <TableHeader>Preco Pesagem</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-slate-400">
                    Nenhum tipo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.descricao}</TableCell>
                    <TableCell>
                      {t.precoPesagem != null ? `R$ ${Number(t.precoPesagem).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(t)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(t.id)}
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
        title={editingId ? 'Editar Tipo' : 'Novo Tipo'}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-1 gap-4">
          <Input
            label="Descricao *"
            value={form.descricao || ''}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={errors.descricao}
          />
          <Input
            label="Preco Pesagem"
            type="number"
            step="0.01"
            value={form.precoPesagem ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                precoPesagem: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Excluir Tipo de Veiculo"
        description="Tem certeza que deseja excluir este tipo?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
