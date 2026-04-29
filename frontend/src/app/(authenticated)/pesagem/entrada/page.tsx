'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  getBalancas,
  getVeiculos,
  getMotoristas,
  getTransportadoras,
  getClientes,
  getProdutos,
  createTicket,
  registrarPassagem,
  fecharTicket,
  capturarPeso,
} from '@/lib/api';
import { formatWeight } from '@/lib/utils';
import PesoRealtime from '@/components/peso/PesoRealtime';
import TicketPreview from '@/components/ticket/TicketPreview';
import { Toast, useToast } from '@/components/ui/toast';
import { extractMessage } from '@/lib/errors';
import { Save, X, ArrowDownToLine, Plus } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function PesagemEntradaPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    balanca_id: '',
    veiculo_placa: '',
    veiculo_id: '',
    tara_veiculo: '',
    motorista_id: '',
    transportadora_id: '',
    cliente_id: '',
    produto_id: '',
    nota_fiscal: '',
    peso_nf: '',
    observacao: '',
  });

  const [pesagemManual, setPesagemManual] = useState(false);
  const [pesagemComTara, setPesagemComTara] = useState(false);
  const [pesoAtual, setPesoAtual] = useState(0);
  const [estavel, setEstavel] = useState(false);
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const { data: balancas } = useQuery({
    queryKey: ['balancas'],
    queryFn: () => getBalancas(1, 100),
  });
  const { data: veiculos } = useQuery({
    queryKey: ['veiculos'],
    queryFn: () => getVeiculos(1, 200),
  });
  const { data: motoristas } = useQuery({
    queryKey: ['motoristas'],
    queryFn: () => getMotoristas(1, 200),
  });
  const { data: transportadoras } = useQuery({
    queryKey: ['transportadoras'],
    queryFn: () => getTransportadoras(1, 200),
  });
  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(1, 200),
  });
  const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => getProdutos(1, 200),
  });

  const balancaOptions = useMemo(
    () => [
      { value: '', label: 'Selecione a balanca...' },
      ...(balancas?.data || []).map((b) => ({ value: b.id, label: b.nome })),
    ],
    [balancas],
  );
  const veiculoOptions = useMemo(
    () => [
      { value: '', label: 'Selecione placa...' },
      ...(veiculos?.data || []).map((v) => ({ value: v.id, label: v.placa })),
    ],
    [veiculos],
  );
  const motoristaOptions = useMemo(
    () => [
      { value: '', label: 'Selecione motorista...' },
      ...(motoristas?.data || []).map((m) => ({ value: m.id, label: m.nome })),
    ],
    [motoristas],
  );
  const transportadoraOptions = useMemo(
    () => [
      { value: '', label: 'Selecione transportadora...' },
      ...(transportadoras?.data || []).map((t) => ({ value: t.id, label: t.nome })),
    ],
    [transportadoras],
  );
  const clienteOptions = useMemo(
    () => [
      { value: '', label: 'Selecione cliente...' },
      ...(clientes?.data || []).map((c) => ({ value: c.id, label: c.razao_social })),
    ],
    [clientes],
  );
  const produtoOptions = useMemo(
    () => [
      { value: '', label: 'Selecione produto...' },
      ...(produtos?.data || []).map((p) => ({ value: p.id, label: p.descricao })),
    ],
    [produtos],
  );

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const balanca = balancas?.data?.find((b) => b.id === form.balanca_id);
      const taraManual = Number(form.tara_veiculo) || undefined;
      const ticket = await createTicket({
        unidade_id: balanca?.unidade_id ?? balanca?.unidadeId,
        cliente_id: form.cliente_id,
        produto_id: form.produto_id,
        veiculo_id: form.veiculo_id || undefined,
        veiculo_placa: form.veiculo_placa,
        motorista_id: form.motorista_id || undefined,
        transportadora_id: form.transportadora_id || undefined,
        nota_fiscal: form.nota_fiscal || undefined,
        peso_nf: form.peso_nf ? Number(form.peso_nf) : undefined,
        observacao: form.observacao || undefined,
        fluxo_pesagem: pesagemComTara ? '1PF_TARA_REFERENCIADA' : '2PF_BRUTO_TARA',
        tara_referencia_tipo: pesagemComTara && taraManual ? 'MANUAL' : undefined,
        tara_manual: pesagemComTara && taraManual ? taraManual : undefined,
      });

      await registrarPassagem(ticket.id, {
        tipo_passagem: 'ENTRADA',
        direcao_operacional: 'ENTRADA',
        papel_calculo: 'BRUTO_OFICIAL',
        condicao_veiculo: 'CARREGADO',
        peso_capturado: pesoAtual,
        balanca_id: form.balanca_id,
        origem_leitura: pesagemManual ? 'MANUAL' : 'BALANCA',
        indicador_estabilidade: estavel ? 1 : 0,
      });

      if (pesagemComTara) {
        await fecharTicket(ticket.id);
      }

      return ticket;
    },
    onSuccess: (ticket) => {
      setPreviewTicketId(ticket.id);
    },
    onError: (e: unknown) => showToast(extractMessage(e, 'Erro ao salvar pesagem'), 'error'),
  });

  const handlePesoChange = useCallback(
    (p: number, e: boolean) => {
      if (!pesagemManual) {
        setPesoAtual(p);
        setEstavel(e);
      }
    },
    [pesagemManual],
  );

  const canSave =
    !!form.balanca_id &&
    !!form.veiculo_placa &&
    !!form.cliente_id &&
    !!form.produto_id &&
    pesoAtual > 0 &&
    (pesagemManual || estavel);

  const capturarPesoAtual = useCallback(async () => {
    if (!form.balanca_id) {
      showToast('Selecione uma balanca antes de capturar', 'warning');
      return;
    }
    try {
      const leitura = await capturarPeso(form.balanca_id);
      setPesoAtual(leitura.peso);
      setEstavel(leitura.estavel);
    } catch (e: unknown) {
      showToast(extractMessage(e, 'Erro ao capturar peso'), 'error');
    }
  }, [form.balanca_id, showToast]);

  const salvarPesagem = useCallback(() => {
    if (canSave && !salvarMutation.isPending) salvarMutation.mutate();
  }, [canSave, salvarMutation]);

  const shortcuts = useMemo(
    () => ({
      F1: capturarPesoAtual,
      F2: salvarPesagem,
      Escape: () => router.push('/tickets'),
    }),
    [capturarPesoAtual, salvarPesagem, router],
  );
  useKeyboardShortcuts(shortcuts);

  const onSelecionaVeiculo = (id: string) => {
    const v = veiculos?.data?.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      veiculo_id: id,
      veiculo_placa: v?.placa || '',
      tara_veiculo: v?.tara_cadastrada ? String(v.tara_cadastrada) : '',
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesagem de Entrada</h1>
          <p className="text-sm text-slate-500 mt-1">Registrar pesagem de entrada do veiculo</p>
        </div>
        <Badge variant="primary" className="px-3 py-1">
          <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
          Entrada
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel esquerdo */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Balanca *"
                options={balancaOptions}
                value={form.balanca_id}
                onChange={(e) => setForm((f) => ({ ...f, balanca_id: e.target.value }))}
              />

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label="Placa do Veiculo *"
                    options={veiculoOptions}
                    value={form.veiculo_id}
                    onChange={(e) => onSelecionaVeiculo(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  title="Cadastrar veiculo rapido"
                  onClick={() => router.push('/cadastros/veiculos')}
                  aria-label="Adicionar"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Input
                label="Tara do Veiculo (kg)"
                type="number"
                value={form.tara_veiculo}
                onChange={(e) => setForm((f) => ({ ...f, tara_veiculo: e.target.value }))}
                placeholder="Auto-preenchido do cadastro"
              />

              <Select
                label="Motorista"
                options={motoristaOptions}
                value={form.motorista_id}
                onChange={(e) => setForm((f) => ({ ...f, motorista_id: e.target.value }))}
              />

              <Select
                label="Transportadora"
                options={transportadoraOptions}
                value={form.transportadora_id}
                onChange={(e) => setForm((f) => ({ ...f, transportadora_id: e.target.value }))}
              />

              <Select
                label="Cliente / Fornecedor *"
                options={clienteOptions}
                value={form.cliente_id}
                onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
              />

              <Select
                label="Produto *"
                options={produtoOptions}
                value={form.produto_id}
                onChange={(e) => setForm((f) => ({ ...f, produto_id: e.target.value }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Numero NF"
                  value={form.nota_fiscal}
                  onChange={(e) => setForm((f) => ({ ...f, nota_fiscal: e.target.value }))}
                />
                <Input
                  label="Peso NF (kg)"
                  type="number"
                  value={form.peso_nf}
                  onChange={(e) => setForm((f) => ({ ...f, peso_nf: e.target.value }))}
                />
              </div>

              <Input
                label="Observacao"
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Campo configuravel / observacoes"
              />

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pesagemManual}
                    onChange={(e) => setPesagemManual(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Pesagem Manual
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pesagemComTara}
                    onChange={(e) => setPesagemComTara(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Pesagem com Tara (1PF)
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel direito */}
        <div className="space-y-4">
          <PesoRealtime balancaId={form.balanca_id || undefined} onPesoChange={handlePesoChange} />

          {pesagemManual && (
            <Card>
              <CardContent className="pt-6">
                <Input
                  label="Peso Manual (kg)"
                  type="number"
                  value={pesoAtual || ''}
                  onChange={(e) => setPesoAtual(Number(e.target.value) || 0)}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="text-xs text-slate-500">Peso de entrada capturado</div>
              <div className="text-3xl font-mono font-bold text-slate-800">
                {pesoAtual > 0 ? formatWeight(pesoAtual) : '---'}
              </div>
              {estavel && pesoAtual > 0 && (
                <div className="text-xs text-emerald-600">Peso estavel</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botoes inferior */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="secondary" onClick={() => router.push('/tickets')}>
          <X className="w-4 h-4 mr-2" />
          Descartar
        </Button>
        <Button
          variant="primary"
          onClick={salvarPesagem}
          disabled={!canSave}
          isLoading={salvarMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Pesagem
        </Button>
      </div>

      <TicketPreview
        ticketId={previewTicketId}
        open={!!previewTicketId}
        onClose={() => {
          setPreviewTicketId(null);
          router.push('/tickets');
        }}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
