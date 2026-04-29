'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { Toast, useToast } from '@/components/ui/toast';
import {
  createIndicador,
  deleteIndicador,
  IndicadorBalanca,
  listIndicadores,
  seedBuiltins,
  updateIndicador,
} from '@/lib/api/indicador';
import { extractMessage } from '@/lib/errors';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { IndicadorEditorDialog } from './components/IndicadorEditorDialog';

export default function IndicadoresPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IndicadorBalanca | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['indicadores-cad'],
    queryFn: listIndicadores,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['indicadores-cad'] });
  const createMut = useMutation({
    mutationFn: createIndicador,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      showToast('Indicador criado', 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao criar indicador'), 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<IndicadorBalanca> }) =>
      updateIndicador(id, payload),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      showToast('Indicador atualizado', 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao atualizar indicador'), 'error'),
  });
  const deleteMut = useMutation({
    mutationFn: deleteIndicador,
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      showToast('Indicador excluido', 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao excluir indicador'), 'error'),
  });
  const seedMut = useMutation({
    mutationFn: seedBuiltins,
    onSuccess: (result) => {
      invalidate();
      showToast(`${result.criados} preset(s) adicionados`, 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao semear presets'), 'error'),
  });

  const openNew = () => {
    setEditing(null);
    setDuplicating(false);
    setDialogOpen(true);
  };

  const submit = (payload: Partial<IndicadorBalanca>) => {
    if (editing && !duplicating) {
      updateMut.mutate({ id: editing.id, payload });
    } else {
      createMut.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Indicadores de Pesagem</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data ? `${data.length} indicadores disponiveis.` : 'Catalogo de protocolos e modelos.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => seedMut.mutate()}
            isLoading={seedMut.isPending}
          >
            Presets
          </Button>
          <Button variant="primary" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Indicador
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Modelo</TableHeader>
                <TableHeader>Fabricante</TableHeader>
                <TableHeader>Parser</TableHeader>
                <TableHeader>Serial</TableHeader>
                <TableHeader>Leitura</TableHeader>
                <TableHeader>Tipo</TableHeader>
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
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    Nenhum indicador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((ind) => (
                  <TableRow key={ind.id}>
                    <TableCell className="font-medium">{ind.modelo || ind.descricao}</TableCell>
                    <TableCell>{ind.fabricante || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{ind.parserTipo || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {[ind.baudrate, ind.databits, ind.parity, ind.stopbits]
                        .filter(Boolean)
                        .join('/')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {ind.readMode || 'continuous'}
                      {ind.readCommandHex ? ` ${ind.readCommandHex}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ind.builtin ? 'outline' : 'success'}>
                        {ind.builtin ? 'builtin' : 'custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          aria-label="Editar"
                          disabled={ind.builtin}
                          onClick={() => {
                            setEditing(ind);
                            setDuplicating(false);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          aria-label="Duplicar"
                          onClick={() => {
                            setEditing(ind);
                            setDuplicating(true);
                            setDialogOpen(true);
                          }}
                        >
                          <Copy className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          aria-label="Excluir"
                          disabled={ind.builtin}
                          onClick={() => setDeleteId(ind.id)}
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

      <IndicadorEditorDialog
        open={dialogOpen}
        indicador={editing}
        duplicating={duplicating}
        onClose={() => setDialogOpen(false)}
        onSubmit={submit}
        isSaving={createMut.isPending || updateMut.isPending}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title="Excluir Indicador"
        description="Indicadores customizados excluidos deixam de aparecer para novos cadastros."
        confirmText="Excluir"
        variant="danger"
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
