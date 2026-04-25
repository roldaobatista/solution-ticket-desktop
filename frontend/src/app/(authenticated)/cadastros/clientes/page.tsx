'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getClientes, createCliente, updateCliente, deleteCliente } from '@/lib/api';
import { Cliente } from '@/types';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const clienteSchema = z.object({
  razao_social: z.string().min(1, 'Razao social obrigatoria'),
  documento: z.string().min(1, 'Documento obrigatorio'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  codigo_integracao: z.string().optional(),
});

type ClienteForm = z.infer<typeof clienteSchema>;

export default function ClientesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ClienteForm, string>>>({});
  const [form, setForm] = useState<Partial<ClienteForm>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clientes', page, search],
    queryFn: () => getClientes(page, 10, search),
  });

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cliente> }) => updateCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = clienteSchema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof ClienteForm] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const openEdit = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setForm({
      razao_social: cliente.razao_social,
      documento: cliente.documento,
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      uf: cliente.uf || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      codigo_integracao: cliente.codigo_integracao || '',
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
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} clientes cadastrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nome, documento ou codigo..."
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
                <TableHeader>Razao Social</TableHeader>
                <TableHeader>Documento</TableHeader>
                <TableHeader>Cidade/UF</TableHeader>
                <TableHeader>Telefone</TableHeader>
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
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.razao_social}</TableCell>
                    <TableCell className="font-mono text-sm">{c.documento}</TableCell>
                    <TableCell>
                      {c.cidade}
                      {c.uf ? `/${c.uf}` : ''}
                    </TableCell>
                    <TableCell>{c.telefone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={c.ativo ? 'success' : 'default'}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(c.id)}
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
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Razao Social *"
            value={form.razao_social || ''}
            onChange={(e) => setForm((f) => ({ ...f, razao_social: e.target.value }))}
            error={errors.razao_social}
          />
          <Input
            label="Documento (CNPJ/CPF) *"
            value={form.documento || ''}
            onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
            error={errors.documento}
          />
          <Input
            label="Endereco"
            value={form.endereco || ''}
            onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
          />
          <Input
            label="Cidade"
            value={form.cidade || ''}
            onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
          />
          <Input
            label="UF"
            value={form.uf || ''}
            onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
            maxLength={2}
          />
          <Input
            label="Telefone"
            value={form.telefone || ''}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />
          <Input
            label="Codigo Integracao"
            value={form.codigo_integracao || ''}
            onChange={(e) => setForm((f) => ({ ...f, codigo_integracao: e.target.value }))}
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
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
