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
  getRecibos,
  createRecibo,
  updateRecibo,
  deleteRecibo,
  imprimirRecibo,
  Recibo,
} from '@/lib/api';
import { Plus, Pencil, Trash2, Save, Printer } from 'lucide-react';
import { z } from 'zod';

const reciboSchema = z.object({
  data: z.string().min(1, 'Data obrigatoria'),
  cedente: z.string().min(1, 'Cedente obrigatorio'),
  sacado: z.string().min(1, 'Sacado obrigatorio'),
  valor: z
    .number({ invalid_type_error: 'Valor obrigatorio' })
    .positive('Valor deve ser maior que zero'),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  cpf: z.string().optional(),
  endereco: z.string().optional(),
  valorExtenso: z.string().optional(),
  referente: z.string().optional(),
});

type ReciboForm = z.infer<typeof reciboSchema>;

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

export default function RecibosPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ReciboForm, string>>>({});
  const [form, setForm] = useState<Partial<ReciboForm>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['recibos'],
    queryFn: () => getRecibos(),
  });

  const createMutation = useMutation({
    mutationFn: createRecibo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Recibo> }) => updateRecibo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos'] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecibo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = reciboSchema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof ReciboForm] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: Partial<Recibo> = {
      data: form.data,
      cedente: form.cedente,
      sacado: form.sacado,
      valor: Number(form.valor),
      telefone: form.telefone || null,
      celular: form.celular || null,
      cpf: form.cpf || null,
      endereco: form.endereco || null,
      valorExtenso: form.valorExtenso || null,
      referente: form.referente || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (r: Recibo) => {
    setEditingId(r.id);
    setForm({
      data: r.data ? r.data.substring(0, 10) : '',
      cedente: r.cedente,
      sacado: r.sacado,
      valor: Number(r.valor),
      telefone: r.telefone || '',
      celular: r.celular || '',
      cpf: r.cpf || '',
      endereco: r.endereco || '',
      valorExtenso: r.valorExtenso || '',
      referente: r.referente || '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ data: new Date().toISOString().substring(0, 10) });
    setErrors({});
    setDialogOpen(true);
  };

  const handleImprimir = async (id: string) => {
    try {
      await imprimirRecibo(id);
    } catch (e) {
      console.error('Erro ao imprimir recibo', e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recibos</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.length || 0} recibo(s) cadastrado(s)</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Recibo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Data</TableHeader>
                <TableHeader>Sacado</TableHeader>
                <TableHeader>Valor</TableHeader>
                <TableHeader>Cedente</TableHeader>
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
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    Nenhum recibo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{r.sacado}</TableCell>
                    <TableCell className="font-mono">{brl(Number(r.valor))}</TableCell>
                    <TableCell>{r.cedente}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => handleImprimir(r.id)}
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(r.id)}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Editar Recibo' : 'Novo Recibo'}
        maxWidth="max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data *"
            type="date"
            value={form.data || ''}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            error={errors.data}
          />
          <Input
            label="Valor (R$) *"
            type="number"
            step="0.01"
            value={form.valor ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                valor: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
            error={errors.valor}
          />
          <Input
            label="Cedente *"
            value={form.cedente || ''}
            onChange={(e) => setForm((f) => ({ ...f, cedente: e.target.value }))}
            error={errors.cedente}
          />
          <Input
            label="Sacado *"
            value={form.sacado || ''}
            onChange={(e) => setForm((f) => ({ ...f, sacado: e.target.value }))}
            error={errors.sacado}
          />
          <Input
            label="CPF/CNPJ"
            value={form.cpf || ''}
            onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
          />
          <Input
            label="Telefone"
            value={form.telefone || ''}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
          />
          <Input
            label="Celular"
            value={form.celular || ''}
            onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
          />
          <Input
            label="Endereco"
            value={form.endereco || ''}
            onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
          />
          <div className="md:col-span-2">
            <Input
              label="Valor por Extenso (opcional - auto-preenchido)"
              value={form.valorExtenso || ''}
              onChange={(e) => setForm((f) => ({ ...f, valorExtenso: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Referente</label>
            <textarea
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm text-slate-900 px-3 py-2 border transition-colors bg-white"
              rows={3}
              value={form.referente || ''}
              onChange={(e) => setForm((f) => ({ ...f, referente: e.target.value }))}
            />
          </div>
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
        title="Excluir Recibo"
        description="Tem certeza que deseja excluir este recibo?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
