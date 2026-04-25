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
  getUsuariosCadastro,
  createUsuarioCadastro,
  updateUsuarioCadastro,
  deleteUsuarioCadastro,
  getPerfis,
} from '@/lib/api';
import { UsuarioCadastro } from '@/types';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const createSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio'),
  email: z.string().email('Email invalido'),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});
const updateSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio'),
  email: z.string().email('Email invalido'),
  senha: z.string().optional(),
});

type FormT = { nome?: string; email?: string; senha?: string; perfilIds?: string[] };

export default function UsuariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormT, string>>>({});
  const [form, setForm] = useState<FormT>({ perfilIds: [] });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usuarios-cad', page, search],
    queryFn: () => getUsuariosCadastro(page, 10, search),
  });

  const { data: perfis = [] } = useQuery({
    queryKey: ['perfis'],
    queryFn: getPerfis,
  });

  const createMutation = useMutation({
    mutationFn: createUsuarioCadastro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-cad'] });
      setDialogOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UsuarioCadastro> }) =>
      updateUsuarioCadastro(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-cad'] });
      setDialogOpen(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteUsuarioCadastro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-cad'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const schema = editingId ? updateSchema : createSchema;
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
    const payload: any = { nome: form.nome, email: form.email, perfilIds: form.perfilIds || [] };
    if (form.senha) payload.senha = form.senha;
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (u: UsuarioCadastro) => {
    setEditingId(u.id);
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      perfilIds: u.perfilIds || u.perfis?.map((p) => p.id) || [],
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ perfilIds: [] });
    setErrors({});
    setDialogOpen(true);
  };

  const togglePerfil = (id: string) => {
    setForm((f) => {
      const set = new Set(f.perfilIds || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, perfilIds: Array.from(set) };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} usuarios cadastrados</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuario
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nome ou email..."
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
                <TableHeader>Email</TableHeader>
                <TableHeader>Perfis</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                    Nenhum usuario encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.perfis?.map((p) => (
                          <Badge key={p.id} variant="default">
                            {p.nome}
                          </Badge>
                        ))}
                        {(!u.perfis || u.perfis.length === 0) && (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(u.id)}
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
        title={editingId ? 'Editar Usuario' : 'Novo Usuario'}
        maxWidth="max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome *"
            value={form.nome || ''}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
          />
          <Input
            label="Email *"
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />
          <Input
            label={editingId ? 'Senha (deixe em branco para manter)' : 'Senha *'}
            type="password"
            value={form.senha || ''}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
            error={errors.senha}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Perfis</label>
          {perfis.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum perfil disponivel</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {perfis.map((p) => {
                const selected = (form.perfilIds || []).includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => togglePerfil(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selected ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {p.nome}
                  </button>
                );
              })}
            </div>
          )}
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
        title="Excluir Usuario"
        description="Tem certeza que deseja excluir este usuario?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
