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
  getTiposDesconto,
  createTipoDesconto,
  updateTipoDesconto,
  deleteTipoDesconto,
  TipoDesconto,
} from '@/lib/api';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import { z } from 'zod';

const tipoDescontoSchema = z.object({
  descricao: z.string().min(1, 'Descricao obrigatoria'),
  tipo: z.enum(['PERCENTUAL', 'FIXO']),
  teto: z.number().optional().nullable(),
  carencia: z.number().optional().nullable(),
  valor: z.number({ invalid_type_error: 'Valor obrigatorio' }),
  visivelPE: z.boolean(),
  visivelPS: z.boolean(),
  visivelPortaria: z.boolean(),
  visivelApontamento: z.boolean(),
  visivelPosApontamento: z.boolean(),
  calcula: z.boolean(),
  mantem: z.boolean(),
  ativo: z.boolean(),
});

type TipoDescontoForm = z.infer<typeof tipoDescontoSchema>;

const defaultForm: Partial<TipoDescontoForm> = {
  tipo: 'PERCENTUAL',
  valor: 0,
  visivelPE: false,
  visivelPS: false,
  visivelPortaria: false,
  visivelApontamento: false,
  visivelPosApontamento: false,
  calcula: false,
  mantem: false,
  ativo: true,
};

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      {label}
    </label>
  );
}

export default function TiposDescontoPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof TipoDescontoForm, string>>>({});
  const [form, setForm] = useState<Partial<TipoDescontoForm>>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['tipos-desconto'],
    queryFn: () => getTiposDesconto(),
  });

  const createMutation = useMutation({
    mutationFn: createTipoDesconto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-desconto'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TipoDesconto> }) =>
      updateTipoDesconto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-desconto'] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTipoDesconto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-desconto'] });
      setDeleteId(null);
    },
  });

  const validate = () => {
    const result = tipoDescontoSchema.safeParse(form);
    if (!result.success) {
      const errs: typeof errors = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as keyof TipoDescontoForm] = e.message;
      });
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: Partial<TipoDesconto> = {
      descricao: form.descricao,
      tipo: form.tipo as 'PERCENTUAL' | 'FIXO',
      teto: form.teto ?? null,
      carencia: form.carencia ?? null,
      valor: Number(form.valor),
      visivelPE: !!form.visivelPE,
      visivelPS: !!form.visivelPS,
      visivelPortaria: !!form.visivelPortaria,
      visivelApontamento: !!form.visivelApontamento,
      visivelPosApontamento: !!form.visivelPosApontamento,
      calcula: !!form.calcula,
      mantem: !!form.mantem,
      ativo: !!form.ativo,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (t: TipoDesconto) => {
    setEditingId(t.id);
    setForm({
      descricao: t.descricao,
      tipo: t.tipo,
      teto: t.teto ?? undefined,
      carencia: t.carencia ?? undefined,
      valor: Number(t.valor),
      visivelPE: !!t.visivelPE,
      visivelPS: !!t.visivelPS,
      visivelPortaria: !!t.visivelPortaria,
      visivelApontamento: !!t.visivelApontamento,
      visivelPosApontamento: !!t.visivelPosApontamento,
      calcula: !!t.calcula,
      mantem: !!t.mantem,
      ativo: !!t.ativo,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setErrors({});
    setDialogOpen(true);
  };

  const visibilidadeBadges = (t: TipoDesconto) => {
    const items = [
      { key: 'PE', on: t.visivelPE },
      { key: 'PS', on: t.visivelPS },
      { key: 'Portaria', on: t.visivelPortaria },
      { key: 'Apont.', on: t.visivelApontamento },
      { key: 'PosApont.', on: t.visivelPosApontamento },
    ];
    return (
      <div className="flex flex-wrap gap-1">
        {items
          .filter((i) => i.on)
          .map((i) => (
            <Badge key={i.key} variant="success">
              {i.key}
            </Badge>
          ))}
        {items.every((i) => !i.on) && <span className="text-slate-400 text-xs">-</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tipos de Desconto</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.length || 0} tipo(s) cadastrado(s)</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Descricao</TableHeader>
                <TableHeader>Tipo</TableHeader>
                <TableHeader>Valor</TableHeader>
                <TableHeader>Visibilidades</TableHeader>
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
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhum tipo de desconto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.descricao}</TableCell>
                    <TableCell>
                      <Badge variant={t.tipo === 'PERCENTUAL' ? 'info' : 'default'}>{t.tipo}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {t.tipo === 'PERCENTUAL'
                        ? `${Number(t.valor).toFixed(2)}%`
                        : Number(t.valor).toFixed(2)}
                    </TableCell>
                    <TableCell>{visibilidadeBadges(t)}</TableCell>
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Editar Tipo de Desconto' : 'Novo Tipo de Desconto'}
        maxWidth="max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Descricao *"
              value={form.descricao || ''}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              error={errors.descricao}
            />
          </div>
          <Select
            label="Tipo *"
            value={form.tipo || 'PERCENTUAL'}
            onChange={(e) =>
              setForm((f) => ({ ...f, tipo: e.target.value as 'PERCENTUAL' | 'FIXO' }))
            }
            options={[
              { value: 'PERCENTUAL', label: 'Percentual (%)' },
              { value: 'FIXO', label: 'Fixo (R$)' },
            ]}
          />
          <Input
            label="Valor *"
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
            label="Teto"
            type="number"
            step="0.01"
            value={form.teto ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                teto: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
          <Input
            label="Carencia"
            type="number"
            value={form.carencia ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                carencia: e.target.value === '' ? undefined : Number(e.target.value),
              }))
            }
          />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Visibilidade</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
            <Checkbox
              label="Pesagem Entrada"
              checked={!!form.visivelPE}
              onChange={(v) => setForm((f) => ({ ...f, visivelPE: v }))}
            />
            <Checkbox
              label="Pesagem Saida"
              checked={!!form.visivelPS}
              onChange={(v) => setForm((f) => ({ ...f, visivelPS: v }))}
            />
            <Checkbox
              label="Portaria"
              checked={!!form.visivelPortaria}
              onChange={(v) => setForm((f) => ({ ...f, visivelPortaria: v }))}
            />
            <Checkbox
              label="Apontamento"
              checked={!!form.visivelApontamento}
              onChange={(v) => setForm((f) => ({ ...f, visivelApontamento: v }))}
            />
            <Checkbox
              label="Pos Apontamento"
              checked={!!form.visivelPosApontamento}
              onChange={(v) => setForm((f) => ({ ...f, visivelPosApontamento: v }))}
            />
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Opcoes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
            <Checkbox
              label="Calcula"
              checked={!!form.calcula}
              onChange={(v) => setForm((f) => ({ ...f, calcula: v }))}
            />
            <Checkbox
              label="Mantem"
              checked={!!form.mantem}
              onChange={(v) => setForm((f) => ({ ...f, mantem: v }))}
            />
            <Checkbox
              label="Ativo"
              checked={!!form.ativo}
              onChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
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
        title="Excluir Tipo de Desconto"
        description="Tem certeza que deseja excluir este tipo de desconto?"
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
