'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Toast, useToast } from '@/components/ui/toast';
import {
  createBalanca,
  deleteBalanca,
  getBalancas,
  getIndicadores,
  getUnidades,
  testarBalanca,
  updateBalanca,
} from '@/lib/api';
import { Balanca } from '@/types';
import { extractMessage } from '@/lib/errors';
import { BalancaEditorDialog } from './components/BalancaEditorDialog';
import { BalancaList } from './components/BalancaList';
import { BalancaForm, BalancaFormErrors } from './components/types';

function emptyForm(): BalancaForm {
  return {
    tipoConexao: 'SERIAL',
    ativa: true,
    ativo: true,
    porta: 'COM1',
    baudRate: 9600,
    portaTcp: 4001,
    modbusUnitId: 1,
    modbusRegister: 0,
    modbusFunction: 'holding',
    modbusByteOrder: 'BE',
    modbusWordOrder: 'BE',
    modbusSigned: false,
    modbusScale: 1,
    modbusOffset: 0,
    readMode: 'continuous',
    readTimeoutMs: 2000,
  };
}

function validateForm(form: BalancaForm): BalancaFormErrors {
  const errors: BalancaFormErrors = {};
  if (!form.nome) errors.nome = 'Nome obrigatorio';
  if (!form.unidadeId) errors.unidadeId = 'Unidade obrigatoria';
  if (!form.indicadorId) errors.indicadorId = 'Indicador obrigatorio';
  if ((form.tipoConexao === 'SERIAL' || form.tipoConexao === 'MODBUS_RTU') && !form.porta) {
    errors.porta = 'Porta obrigatoria';
  }
  if (
    (form.tipoConexao === 'TCP' || form.tipoConexao === 'MODBUS_TCP') &&
    !form.host &&
    !form.enderecoIp
  ) {
    errors.host = 'Host/IP obrigatorio';
  }
  if ((form.tipoConexao === 'TCP' || form.tipoConexao === 'MODBUS_TCP') && !form.portaTcp) {
    errors.portaTcp = 'Porta TCP obrigatoria';
  }
  if (form.tipoConexao === 'MODBUS_RTU' || form.tipoConexao === 'MODBUS_TCP') {
    if (!form.modbusUnitId) errors.modbusUnitId = 'Unit ID obrigatorio';
    if (form.modbusRegister === undefined || form.modbusRegister === null) {
      errors.modbusRegister = 'Registrador obrigatorio';
    }
  }
  if (form.readMode === 'polling' && !form.readCommandHex) {
    errors.readCommandHex = 'Comando hex obrigatorio para polling';
  }
  return errors;
}

function buildPayload(
  form: BalancaForm,
  unidades?: Array<{ id: string; empresaId?: string; empresa_id?: string }>,
) {
  const unidade = unidades?.find((u) => u.id === form.unidadeId);
  const isModbus = form.tipoConexao === 'MODBUS_RTU' || form.tipoConexao === 'MODBUS_TCP';
  const usaSerial = form.tipoConexao === 'SERIAL' || form.tipoConexao === 'MODBUS_RTU';
  const usaTcp = form.tipoConexao === 'TCP' || form.tipoConexao === 'MODBUS_TCP';
  return {
    ...form,
    empresaId: unidade?.empresaId || unidade?.empresa_id,
    unidadeId: form.unidadeId,
    indicadorId: form.indicadorId,
    tipoConexao: form.tipoConexao,
    porta: usaSerial ? form.porta : undefined,
    host: usaTcp ? form.host || form.enderecoIp : undefined,
    portaTcp: usaTcp ? form.portaTcp : undefined,
    ativo: form.ativo ?? form.ativa ?? true,
    modbusUnitId: isModbus ? form.modbusUnitId : undefined,
    modbusRegister: isModbus ? form.modbusRegister : undefined,
    modbusFunction: isModbus ? form.modbusFunction || 'holding' : undefined,
    modbusByteOrder: isModbus ? form.modbusByteOrder || 'BE' : undefined,
    modbusWordOrder: isModbus ? form.modbusWordOrder || 'BE' : undefined,
    modbusSigned: isModbus ? (form.modbusSigned ?? false) : undefined,
    modbusScale: isModbus ? (form.modbusScale ?? 1) : undefined,
    modbusOffset: isModbus ? (form.modbusOffset ?? 0) : undefined,
  };
}

export default function BalancasPage() {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<BalancaFormErrors>({});
  const [form, setForm] = useState<BalancaForm>(emptyForm);
  const [testing, setTesting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['balancas', page, search],
    queryFn: () => getBalancas(page, 10, search),
  });
  const { data: indicadores } = useQuery({ queryKey: ['indicadores'], queryFn: getIndicadores });
  const { data: unidades } = useQuery({ queryKey: ['unidades'], queryFn: getUnidades });

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
    mutationFn: ({ id, data: payload }: { id: string; data: Partial<Balanca> }) =>
      updateBalanca(id, payload),
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

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: Balanca) => {
    setEditingId(item.id);
    setForm({
      ...emptyForm(),
      ...item,
      unidadeId: item.unidadeId || item.unidade_id || '',
      indicadorId: item.indicadorId || item.indicador_id || '',
      tipoConexao: (item.tipoConexao ||
        item.tipo_conexao ||
        'SERIAL') as BalancaForm['tipoConexao'],
      host: item.host || item.enderecoIp || item.endereco_ip || '',
      ativa: item.ativa ?? item.ativo ?? true,
      ativo: item.ativo ?? item.ativa ?? true,
      baudRate: item.baudRate ?? item.baud_rate ?? 9600,
      readMode: item.readMode ?? item.read_mode ?? 'continuous',
      readCommandHex: item.readCommandHex ?? item.read_command_hex ?? null,
      readIntervalMs: item.readIntervalMs ?? item.read_interval_ms ?? null,
      readTimeoutMs: item.readTimeoutMs ?? item.read_timeout_ms ?? 2000,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    const payload = buildPayload(form, unidades);
    if (!payload.empresaId) {
      showToast('Unidade sem empresa associada', 'error');
      return;
    }
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
      showToast(
        result.sucesso ? 'Conexao bem-sucedida' : `Falha: ${result.erro || 'erro desconhecido'}`,
        result.sucesso ? 'success' : 'error',
      );
    } catch (e: unknown) {
      showToast(extractMessage(e, 'Erro ao testar'), 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <BalancaList
        data={data}
        isLoading={isLoading}
        search={search}
        page={page}
        onSearchChange={setSearch}
        onPageChange={setPage}
        onRefetch={refetch}
        onCreate={openNew}
        onEdit={openEdit}
        onDelete={setDeleteId}
      />
      <BalancaEditorDialog
        open={dialogOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        errors={errors}
        unidades={unidades}
        indicadores={indicadores}
        isSaving={createMut.isPending || updateMut.isPending}
        testing={testing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        onTestar={handleTestar}
        onMessage={showToast}
      />
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
