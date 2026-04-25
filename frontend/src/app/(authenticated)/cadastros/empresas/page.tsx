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
import { getEmpresas, createEmpresa, updateEmpresa, deleteEmpresa } from '@/lib/api';
import { Empresa } from '@/types';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const empresaSchema = z.object({
  nomeEmpresarial: z.string().min(1, 'Nome empresarial obrigatorio'),
  nomeFantasia: z.string().optional(),
  documento: z.string().min(1, 'CNPJ obrigatorio'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  site: z.string().optional(),
  logoPrincipal: z.string().optional(),
  logoRelatorios: z.string().optional(),
});

type EmpresaForm = z.infer<typeof empresaSchema>;

export default function EmpresasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof EmpresaForm, string>>>({});
  const [form, setForm] = useState<Partial<EmpresaForm>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['empresas', page, search],
    queryFn: () => getEmpresas(page, 10, search),
  });

  const createMutation = useMutation({
    mutationFn: createEmpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setDialogOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Empresa> }) => updateEmpresa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setDialogOpen(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = empresaSchema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof EmpresaForm] = e.message;
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

  const openEdit = (e: Empresa) => {
    setEditingId(e.id);
    setForm({
      nomeEmpresarial: e.nomeEmpresarial,
      nomeFantasia: e.nomeFantasia || '',
      documento: e.documento,
      endereco: e.endereco || '',
      cidade: e.cidade || '',
      uf: e.uf || '',
      telefone: e.telefone || '',
      email: e.email || '',
      site: e.site || '',
      logoPrincipal: e.logoPrincipal || '',
      logoRelatorios: e.logoRelatorios || '',
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
          <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} empresas cadastradas</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nome ou CNPJ..."
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
                <TableHeader>Nome Empresarial</TableHeader>
                <TableHeader>Nome Fantasia</TableHeader>
                <TableHeader>CNPJ</TableHeader>
                <TableHeader>Cidade/UF</TableHeader>
                <TableHeader>Telefone</TableHeader>
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
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nomeEmpresarial}</TableCell>
                    <TableCell>{e.nomeFantasia || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{e.documento}</TableCell>
                    <TableCell>
                      {e.cidade}
                      {e.uf ? `/${e.uf}` : ''}
                    </TableCell>
                    <TableCell>{e.telefone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(e)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(e.id)}
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
        title={editingId ? 'Editar Empresa' : 'Nova Empresa'}
        maxWidth="max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome Empresarial *"
            value={form.nomeEmpresarial || ''}
            onChange={(e) => setForm((f) => ({ ...f, nomeEmpresarial: e.target.value }))}
            error={errors.nomeEmpresarial}
          />
          <Input
            label="Nome Fantasia"
            value={form.nomeFantasia || ''}
            onChange={(e) => setForm((f) => ({ ...f, nomeFantasia: e.target.value }))}
          />
          <Input
            label="CNPJ *"
            value={form.documento || ''}
            onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
            error={errors.documento}
          />
          <Input
            label="Telefone"
            value={form.telefone || ''}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
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
            label="Email"
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
          />
          <Input
            label="Site"
            value={form.site || ''}
            onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))}
          />
          <Input
            label="Logo Principal (URL)"
            value={form.logoPrincipal || ''}
            onChange={(e) => setForm((f) => ({ ...f, logoPrincipal: e.target.value }))}
          />
          <Input
            label="Logo Relatorios (URL)"
            value={form.logoRelatorios || ''}
            onChange={(e) => setForm((f) => ({ ...f, logoRelatorios: e.target.value }))}
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
        title="Excluir Empresa"
        description="Tem certeza que deseja excluir esta empresa?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
