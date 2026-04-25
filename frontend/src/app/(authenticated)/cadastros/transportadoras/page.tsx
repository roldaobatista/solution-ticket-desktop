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
import { Badge } from '@/components/ui/badge';
import {
  getTransportadoras,
  createTransportadora,
  updateTransportadora,
  deleteTransportadora,
} from '@/lib/api';
import { Transportadora } from '@/types';
import { Search, Plus, Pencil, Trash2, Save, Truck } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio'),
  documento: z.string().optional(),
  contatos: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TransportadorasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<Partial<FormData>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transportadoras', page, search],
    queryFn: () => getTransportadoras(page, 10, search),
  });

  const createMut = useMutation({
    mutationFn: createTransportadora,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transportadora> }) =>
      updateTransportadora(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
      setDialogOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteTransportadora,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadoras'] });
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
    editingId ? updateMut.mutate({ id: editingId, data: form }) : createMut.mutate(form);
  };

  const openEdit = (item: Transportadora) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      documento: item.documento || '',
      contatos: item.contatos || '',
      observacoes: item.observacoes || '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transportadoras</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.total || 0} transportadoras cadastradas
          </p>
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
          Nova Transportadora
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nome ou documento..."
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
                <TableHeader>Nome</TableHeader>
                <TableHeader>Documento</TableHeader>
                <TableHeader>Contatos</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    Nenhuma transportadora encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{t.documento || '-'}</TableCell>
                    <TableCell>{t.contatos || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={t.ativo ? 'success' : 'default'}>
                        {t.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
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
        title={editingId ? 'Editar Transportadora' : 'Nova Transportadora'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome || ''}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
          />
          <Input
            label="Documento"
            value={form.documento || ''}
            onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
          />
          <Input
            label="Contatos"
            value={form.contatos || ''}
            onChange={(e) => setForm((f) => ({ ...f, contatos: e.target.value }))}
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
        title="Excluir Transportadora"
        description="Tem certeza que deseja excluir esta transportadora?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
