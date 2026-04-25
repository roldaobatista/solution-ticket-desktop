'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { Toast, useToast } from '@/components/ui/toast';
import {
  getBalancas,
  createBalanca,
  updateBalanca,
  deleteBalanca,
  getIndicadores,
  getUnidades,
  testarBalanca,
} from '@/lib/api';
import { Balanca } from '@/types';
import { Search, Plus, Pencil, Trash2, Save, Wifi, WifiOff, Zap } from 'lucide-react';
import { z } from 'zod';
import { AjusteLeituraSection } from '@/components/balanca/AjusteLeituraSection';
import { extractMessage } from '@/lib/errors';

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio'),
  unidadeId: z.string().min(1, 'Unidade obrigatoria'),
  indicadorId: z.string().min(1, 'Indicador obrigatorio'),
  tipoConexao: z.enum(['SERIAL', 'TCP', 'MODBUS_RTU', 'MODBUS_TCP']),
  porta: z.string().min(1, 'Porta obrigatoria'),
  ativa: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

const tipoConexaoOptions = [
  { value: 'SERIAL', label: 'Serial (RS-232)' },
  { value: 'TCP', label: 'TCP/IP' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU' },
  { value: 'MODBUS_TCP', label: 'Modbus TCP' },
];

export default function BalancasPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<Partial<FormData>>({
    tipoConexao: 'SERIAL',
    ativa: true,
    porta: 'COM1',
  });
  const [testing, setTesting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['balancas', page, search],
    queryFn: () => getBalancas(page, 10, search),
  });

  const { data: indicadores } = useQuery({
    queryKey: ['indicadores'],
    queryFn: getIndicadores,
  });

  const { data: unidades } = useQuery({
    queryKey: ['unidades'],
    queryFn: getUnidades,
  });

  const createMut = useMutation({
    mutationFn: createBalanca,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancas'] });
      setDialogOpen(false);
      showToast('Balanca criada com sucesso', 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao criar'), 'error'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Balanca> }) => updateBalanca(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancas'] });
      setDialogOpen(false);
      showToast('Balanca atualizada', 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao atualizar'), 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteBalanca,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balancas'] });
      setDeleteId(null);
      showToast('Balanca excluida', 'success');
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao excluir'), 'error'),
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
    const payload: Partial<Balanca> = {
      nome: form.nome,
      unidadeId: form.unidadeId,
      indicadorId: form.indicadorId,
      tipoConexao: form.tipoConexao,
      porta: form.porta,
      ativa: form.ativa ?? true,
    };
    editingId ? updateMut.mutate({ id: editingId, data: payload }) : createMut.mutate(payload);
  };

  const handleTestar = async () => {
    if (!editingId) {
      showToast('Salve a balanca antes de testar', 'warning');
      return;
    }
    setTesting(true);
    try {
      const result = await testarBalanca(editingId);
      if (result.sucesso) {
        showToast('Conexao bem-sucedida!', 'success');
      } else {
        showToast(`Falha: ${result.erro || 'erro desconhecido'}`, 'error');
      }
    } catch (e: unknown) {
      showToast(extractMessage(e, 'Erro ao testar'), 'error');
    } finally {
      setTesting(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ tipoConexao: 'SERIAL', ativa: true, porta: 'COM1' });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: Balanca) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      unidadeId: item.unidadeId || item.unidade_id || '',
      indicadorId: item.indicadorId || item.indicador_id || '',
      tipoConexao: (item.tipoConexao || item.tipo_conexao || 'SERIAL') as FormData['tipoConexao'],
      porta: item.porta || '',
      ativa: item.ativa ?? item.ativo ?? true,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const indicadorOptions = [
    { value: '', label: 'Selecione...' },
    ...(indicadores || []).map((i) => ({
      value: i.id,
      label: `${i.fabricante} - ${i.modelo}`,
    })),
  ];

  const unidadeOptions = [
    { value: '', label: 'Selecione...' },
    ...(unidades || []).map((u) => ({ value: u.id, label: u.nome })),
  ];

  const renderStatus = (b: Balanca) => {
    const online = b.status_conexao === 'ONLINE';
    const erro = b.status_conexao === 'ERRO';
    if (erro) {
      return (
        <Badge variant="warning" className="flex items-center gap-1 w-fit">
          <WifiOff className="w-3 h-3" /> ERRO
        </Badge>
      );
    }
    return (
      <Badge variant={online ? 'success' : 'danger'} className="flex items-center gap-1 w-fit">
        {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {online ? 'ONLINE' : 'OFFLINE'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Balancas</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} balancas cadastradas</p>
        </div>
        <Button variant="primary" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Balanca
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
                <TableHeader>Unidade</TableHeader>
                <TableHeader>Indicador</TableHeader>
                <TableHeader>Conexao</TableHeader>
                <TableHeader>Porta</TableHeader>
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
                    Nenhuma balanca encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.nome}</TableCell>
                    <TableCell>{b.unidade_nome || '-'}</TableCell>
                    <TableCell>
                      {b.indicador
                        ? `${b.indicador.fabricante} ${b.indicador.modelo}`
                        : b.indicador_nome || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {b.tipoConexao || b.tipo_conexao || b.protocolo || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {b.porta || (b.host ? `${b.host}:${b.porta_tcp || ''}` : '-')}
                    </TableCell>
                    <TableCell>{renderStatus(b)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => openEdit(b)}
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => setDeleteId(b.id)}
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
        title={editingId ? 'Editar Balanca' : 'Nova Balanca'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome *"
            value={form.nome || ''}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={errors.nome}
          />
          <Select
            label="Unidade *"
            options={unidadeOptions}
            value={form.unidadeId || ''}
            onChange={(e) => setForm((f) => ({ ...f, unidadeId: e.target.value }))}
            error={errors.unidadeId}
          />
          <Select
            label="Indicador de Pesagem *"
            options={indicadorOptions}
            value={form.indicadorId || ''}
            onChange={(e) => setForm((f) => ({ ...f, indicadorId: e.target.value }))}
            error={errors.indicadorId}
          />

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Tipo de Conexao *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tipoConexaoOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm ${
                    form.tipoConexao === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoConexao"
                    value={opt.value}
                    checked={form.tipoConexao === opt.value}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        tipoConexao: e.target.value as FormData['tipoConexao'],
                      }))
                    }
                    className="accent-emerald-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.tipoConexao && (
              <p className="text-xs text-red-500 mt-1">{errors.tipoConexao}</p>
            )}
          </div>

          <Input
            label="Porta *"
            value={form.porta || ''}
            onChange={(e) => setForm((f) => ({ ...f, porta: e.target.value }))}
            placeholder={
              form.tipoConexao === 'SERIAL' || form.tipoConexao === 'MODBUS_RTU'
                ? 'COM1'
                : '192.168.1.100:4001'
            }
            error={errors.porta}
          />
          <p className="text-xs text-slate-500 -mt-3">
            {form.tipoConexao === 'SERIAL' || form.tipoConexao === 'MODBUS_RTU'
              ? 'Ex.: COM1, COM3 (Windows) ou /dev/ttyUSB0 (Linux)'
              : 'Formato IP:PORTA (ex.: 192.168.1.100:4001)'}
          </p>

          <div className="flex items-center gap-3 py-2">
            <Switch
              checked={form.ativa ?? true}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, ativa: checked }))}
            />
            <label className="text-sm text-slate-700">Balanca ativa</label>
          </div>

          {editingId && (
            <AjusteLeituraSection
              balancaId={editingId}
              indicadorId={form.indicadorId || ''}
              onApplied={() => showToast('Ajuste aplicado com sucesso', 'success')}
              onError={(m) => showToast(m, 'error')}
            />
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={handleTestar}
              disabled={!editingId || testing}
              title={!editingId ? 'Salve a balanca primeiro' : 'Testar conexao'}
            >
              <Zap className="w-4 h-4 mr-2" />
              {testing ? 'Testando...' : 'Testar Conexao'}
            </Button>
            <div className="flex gap-3">
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
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title="Excluir Balanca"
        description="Tem certeza que deseja excluir esta balanca?"
        confirmText="Excluir"
        variant="danger"
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
