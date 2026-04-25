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
import { getProdutos, createProduto, updateProduto, deleteProduto } from '@/lib/api';
import { Produto } from '@/types';
import { Search, Plus, Pencil, Trash2, Save, Package } from 'lucide-react';
import { z } from 'zod';

const schema = z.object({
  descricao: z.string().min(1, 'Descricao obrigatoria'),
  codigo_interno: z.string().optional(),
  unidade: z.string().min(1, 'Unidade obrigatoria'),
  densidade: z.string().optional(),
  tipo_operacao: z.string().optional(),
  permite_fracionado: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProdutosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<Partial<FormData>>({ unidade: 'kg', permite_fracionado: false });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['produtos', page, search],
    queryFn: () => getProdutos(page, 10, search),
  });

  const createMut = useMutation({
    mutationFn: createProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setDialogOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Produto> }) => updateProduto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setDialogOpen(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
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
    const payload = { ...form, densidade: form.densidade ? parseFloat(form.densidade) : undefined };
    editingId ? updateMut.mutate({ id: editingId, data: payload }) : createMut.mutate(payload);
  };

  const openEdit = (item: Produto) => {
    setEditingId(item.id);
    setForm({
      descricao: item.descricao,
      codigo_interno: item.codigo_interno || '',
      unidade: item.unidade,
      densidade: item.densidade?.toString() || '',
      tipo_operacao: item.tipo_operacao || '',
      permite_fracionado: item.permite_fracionado,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const tipoOperacaoOptions = [
    { value: '', label: 'Selecione...' },
    { value: 'Compra', label: 'Compra' },
    { value: 'Venda', label: 'Venda' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Industrializacao', label: 'Industrializacao' },
  ];

  const unidadeOptions = [
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'ton', label: 'Tonelada (ton)' },
    { value: 'lb', label: 'Libra (lb)' },
    { value: 'sc', label: 'Saca (sc)' },
    { value: 'm3', label: 'Metro Cubico (m3)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} produtos cadastrados</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingId(null);
            setForm({ unidade: 'kg', permite_fracionado: false });
            setErrors({});
            setDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por descricao ou codigo..."
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
                <TableHeader>Unidade</TableHeader>
                <TableHeader>Tipo Operacao</TableHeader>
                <TableHeader>Fracionado</TableHeader>
                <TableHeader>Status</TableHeader>
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
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.codigo_interno || '-'}</TableCell>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell>{p.unidade}</TableCell>
                    <TableCell>{p.tipo_operacao || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={p.permite_fracionado ? 'success' : 'default'}>
                        {p.permite_fracionado ? 'Sim' : 'Nao'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.ativo ? 'success' : 'default'}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(p.id)}
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
        title={editingId ? 'Editar Produto' : 'Novo Produto'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Descricao *"
            value={form.descricao || ''}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={errors.descricao}
          />
          <Input
            label="Codigo Interno"
            value={form.codigo_interno || ''}
            onChange={(e) => setForm((f) => ({ ...f, codigo_interno: e.target.value }))}
          />
          <Select
            label="Unidade *"
            options={unidadeOptions}
            value={form.unidade || 'kg'}
            onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
            error={errors.unidade}
          />
          <Input
            label="Densidade"
            type="number"
            step="0.01"
            value={form.densidade || ''}
            onChange={(e) => setForm((f) => ({ ...f, densidade: e.target.value }))}
          />
          <Select
            label="Tipo Operacao"
            options={tipoOperacaoOptions}
            value={form.tipo_operacao || ''}
            onChange={(e) => setForm((f) => ({ ...f, tipo_operacao: e.target.value }))}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fracionado"
              checked={form.permite_fracionado || false}
              onChange={(e) => setForm((f) => ({ ...f, permite_fracionado: e.target.checked }))}
              className="rounded border-slate-300"
            />
            <label htmlFor="fracionado" className="text-sm text-slate-700">
              Permite fracionado
            </label>
          </div>
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
        title="Excluir Produto"
        description="Tem certeza que deseja excluir este produto?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
