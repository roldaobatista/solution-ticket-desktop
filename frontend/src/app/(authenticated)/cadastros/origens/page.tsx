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
import { getOrigens, createOrigem, updateOrigem, deleteOrigem, Origem } from '@/lib/api';
import { Search, Plus, Pencil, Trash2, Save } from 'lucide-react';

interface Form {
  descricao?: string;
  cidade?: string;
  uf?: string;
  endereco?: string;
  ativo?: boolean;
}

export default function OrigensPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({});
  const [erroDesc, setErroDesc] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['origens', page, search],
    queryFn: () => getOrigens(page, 10, search),
  });

  const createMut = useMutation({
    mutationFn: createOrigem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['origens'] });
      setDialogOpen(false);
    },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Origem> }) => updateOrigem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['origens'] });
      setDialogOpen(false);
    },
  });
  const delMut = useMutation({
    mutationFn: deleteOrigem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['origens'] });
      setDeleteId(null);
    },
  });

  const handleSubmit = () => {
    if (!form.descricao || form.descricao.trim().length === 0) {
      setErroDesc('Nome obrigatorio');
      return;
    }
    setErroDesc('');
    if (editingId) updateMut.mutate({ id: editingId, data: form });
    else createMut.mutate(form as Partial<Origem>);
  };

  const openEdit = (o: Origem) => {
    setEditingId(o.id);
    setForm({
      descricao: o.descricao,
      cidade: o.cidade || '',
      uf: o.uf || '',
      endereco: o.endereco || '',
      ativo: o.ativo,
    });
    setDialogOpen(true);
  };
  const openCreate = () => {
    setEditingId(null);
    setForm({ ativo: true });
    setErroDesc('');
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Origens</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} origens cadastradas</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Origem
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por nome..."
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
                <TableHeader>Cidade</TableHeader>
                <TableHeader>UF</TableHeader>
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
                    Nenhuma origem encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.descricao}</TableCell>
                    <TableCell>{o.cidade || '-'}</TableCell>
                    <TableCell>{o.uf || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={o.ativo ? 'success' : 'default'}>
                        {o.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(o)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(o.id)}
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
        title={editingId ? 'Editar Origem' : 'Nova Origem'}
        maxWidth="max-w-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome *"
            value={form.descricao || ''}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={erroDesc}
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
            onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase() }))}
            maxLength={2}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.ativo ?? true}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
            />
            Ativo
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
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
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && delMut.mutate(deleteId)}
        title="Excluir Origem"
        description="Tem certeza que deseja excluir esta origem?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
