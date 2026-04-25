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
  getMotoristas,
  getTransportadoras,
  createMotorista,
  updateMotorista,
  deleteMotorista,
} from '@/lib/api';
import { Motorista } from '@/types';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio'),
  documento: z.string().optional(),
  cnh: z.string().optional(),
  telefone: z.string().optional(),
  transportadora_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function MotoristasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<Partial<FormData>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['motoristas', page, search],
    queryFn: () => getMotoristas(page, 10, search),
  });

  const { data: transportadoras } = useQuery({
    queryKey: ['transportadoras-select'],
    queryFn: () => getTransportadoras(1, 100),
  });

  const transpOptions = (transportadoras?.data || []).map((t) => ({ value: t.id, label: t.nome }));

  const createMut = useMutation({
    mutationFn: createMotorista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Motorista> }) =>
      updateMotorista(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
      setDialogOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteMotorista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoristas'] });
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

  const openEdit = (item: Motorista) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      documento: item.documento || '',
      cnh: item.cnh || '',
      telefone: item.telefone || '',
      transportadora_id: item.transportadora_id || '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Motoristas</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} motoristas cadastrados</p>
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
          Novo Motorista
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nome, documento ou CNH..."
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
                <TableHeader>CNH</TableHeader>
                <TableHeader>Transportadora</TableHeader>
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
                    Nenhum motorista encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{m.documento || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{m.cnh || '-'}</TableCell>
                    <TableCell>{m.transportadora_nome || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={m.ativo ? 'success' : 'default'}>
                        {m.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(m)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(m.id)}
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
        title={editingId ? 'Editar Motorista' : 'Novo Motorista'}
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
            label="Documento (CPF)"
            value={form.documento || ''}
            onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
          />
          <Input
            label="CNH"
            value={form.cnh || ''}
            onChange={(e) => setForm((f) => ({ ...f, cnh: e.target.value }))}
          />
          <Input
            label="Telefone"
            value={form.telefone || ''}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
          />
          <Select
            label="Transportadora"
            options={[{ value: '', label: 'Selecione...' }, ...transpOptions]}
            value={form.transportadora_id || ''}
            onChange={(e) => setForm((f) => ({ ...f, transportadora_id: e.target.value }))}
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
        title="Excluir Motorista"
        description="Tem certeza que deseja excluir este motorista?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
