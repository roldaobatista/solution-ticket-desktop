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
import { getArmazens, createArmazem, updateArmazem, deleteArmazem } from '@/lib/api';
import { Armazem } from '@/types';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const armazemSchema = z.object({
  codigo: z.string().optional(),
  descricao: z.string().min(1, 'Descricao obrigatoria'),
  capacidade: z.coerce.number().optional(),
  limiteMIN: z.coerce.number().optional(),
  limiteMAX: z.coerce.number().optional(),
  saldoInicial: z.coerce.number().optional(),
  dataSaldo: z.string().optional(),
});

type ArmazemForm = z.infer<typeof armazemSchema>;

export default function ArmazensPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ArmazemForm, string>>>({});
  const [form, setForm] = useState<Partial<ArmazemForm>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['armazens', page, search],
    queryFn: () => getArmazens(page, 10, search),
  });

  const createMutation = useMutation({
    mutationFn: createArmazem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armazens'] });
      setDialogOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Armazem> }) => updateArmazem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armazens'] });
      setDialogOpen(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteArmazem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armazens'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = armazemSchema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof ArmazemForm] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: Record<string, unknown> = { ...form };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (a: Armazem) => {
    setEditingId(a.id);
    setForm({
      codigo: a.codigo || '',
      descricao: a.descricao,
      capacidade: a.capacidade,
      limiteMIN: a.limiteMIN,
      limiteMAX: a.limiteMAX,
      saldoInicial: a.saldoInicial,
      dataSaldo: a.dataSaldo ? a.dataSaldo.substring(0, 10) : '',
    });
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
          <h1 className="text-2xl font-bold text-slate-900">Armazens</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} armazens cadastrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Armazem
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por codigo ou descricao..."
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
                <TableHeader>Codigo</TableHeader>
                <TableHeader>Descricao</TableHeader>
                <TableHeader>Capacidade</TableHeader>
                <TableHeader>Limite MIN</TableHeader>
                <TableHeader>Limite MAX</TableHeader>
                <TableHeader>Saldo Inicial</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum armazem encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-sm">{a.codigo || '-'}</TableCell>
                    <TableCell className="font-medium">{a.descricao}</TableCell>
                    <TableCell>{a.capacidade ?? '-'}</TableCell>
                    <TableCell>{a.limiteMIN ?? '-'}</TableCell>
                    <TableCell>{a.limiteMAX ?? '-'}</TableCell>
                    <TableCell>{a.saldoInicial ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(a.id)}
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
        title={editingId ? 'Editar Armazem' : 'Novo Armazem'}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Codigo"
            value={form.codigo || ''}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
          />
          <Input
            label="Descricao *"
            value={form.descricao || ''}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={errors.descricao}
          />
          <Input
            label="Capacidade"
            type="number"
            step="0.01"
            value={form.capacidade ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                capacidade: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Limite MIN"
            type="number"
            step="0.01"
            value={form.limiteMIN ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                limiteMIN: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Limite MAX"
            type="number"
            step="0.01"
            value={form.limiteMAX ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                limiteMAX: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Saldo Inicial"
            type="number"
            step="0.01"
            value={form.saldoInicial ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                saldoInicial: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Data Saldo"
            type="date"
            value={form.dataSaldo || ''}
            onChange={(e) => setForm((f) => ({ ...f, dataSaldo: e.target.value }))}
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
        title="Excluir Armazem"
        description="Tem certeza que deseja excluir este armazem?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
