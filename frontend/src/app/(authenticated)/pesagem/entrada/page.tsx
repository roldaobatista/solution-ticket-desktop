'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
  getConfiguracao,
  finalizarPesagemOperacional,
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
  const [motivoManual, setMotivoManual] = useState('');
  const [pesagemComTara, setPesagemComTara] = useState(false);
  const [pesoAtual, setPesoAtual] = useState(0);
  const [estavel, setEstavel] = useState(false);
  const [buscaVeiculo, setBuscaVeiculo] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const { data: balancas } = useQuery({
    queryKey: ['balancas'],
    queryFn: () => getBalancas(1, 100),
  });
  const { data: configPesagem } = useQuery({
    queryKey: ['configuracao-pesagem-entrada'],
    queryFn: () => getConfiguracao(),
  });
  const { data: veiculos } = useQuery({
    queryKey: ['veiculos-pesagem', buscaVeiculo],
    queryFn: () => getVeiculos(1, 25, buscaVeiculo),
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
    queryKey: ['clientes-pesagem', buscaCliente],
    queryFn: () => getClientes(1, 25, buscaCliente),
  });
  const { data: produtos } = useQuery({
    queryKey: ['produtos-pesagem', buscaProduto],
    queryFn: () => getProdutos(1, 25, buscaProduto),
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

  useEffect(() => {
    const padrao =
      configPesagem?.balanca_padrao_entrada ??
      (configPesagem as { balancaPadraoEntrada?: string } | undefined)?.balancaPadraoEntrada;
    if (!form.balanca_id && padrao) {
      setForm((f) => ({ ...f, balanca_id: padrao }));
    }
  }, [configPesagem, form.balanca_id]);

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const balanca = balancas?.data?.find((b) => b.id === form.balanca_id);
      const taraManual = Number(form.tara_veiculo) || undefined;
      return finalizarPesagemOperacional({
        ticket: {
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
        },
        passagem: {
          tipo_passagem: 'ENTRADA',
          direcao_operacional: 'ENTRADA',
          papel_calculo: 'BRUTO_OFICIAL',
          condicao_veiculo: 'CARREGADO',
          peso_capturado: pesoAtual,
          balanca_id: form.balanca_id,
          origem_leitura: pesagemManual ? 'MANUAL' : 'BALANCA',
          indicador_estabilidade: estavel ? 1 : 0,
          observacao: pesagemManual ? motivoManual.trim() : undefined,
        },
        fechar: pesagemComTara,
        idempotency_key: `entrada:${form.balanca_id}:${Date.now()}`,
      });
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
    (pesagemManual || estavel) &&
    (!pesagemManual || motivoManual.trim().length >= 8);

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
      Escape: () => {
        if (pesoAtual > 0 || form.veiculo_placa || form.cliente_id || form.produto_id) {
          if (!window.confirm('Descartar a pesagem em andamento?')) return;
        }
        router.push('/tickets');
      },
    }),
    [
      capturarPesoAtual,
      salvarPesagem,
      router,
      pesoAtual,
      form.veiculo_placa,
      form.cliente_id,
      form.produto_id,
    ],
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
                  <Input
                    label="Buscar placa"
                    value={buscaVeiculo}
                    onChange={(e) => setBuscaVeiculo(e.target.value)}
                    placeholder="Digite placa ou frota..."
                  />
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
              <Input
                label="Buscar cliente"
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                placeholder="Digite nome ou documento..."
              />

              <Select
                label="Produto *"
                options={produtoOptions}
                value={form.produto_id}
                onChange={(e) => setForm((f) => ({ ...f, produto_id: e.target.value }))}
              />
              <Input
                label="Buscar produto"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Digite descricao ou codigo..."
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
                <Input
                  label="Motivo da pesagem manual *"
                  value={motivoManual}
                  onChange={(e) => setMotivoManual(e.target.value)}
                  placeholder="Ex.: indicador sem comunicação, conferido pelo supervisor"
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
        <Button
          variant="secondary"
          onClick={() => {
            if (pesoAtual > 0 || form.veiculo_placa || form.cliente_id || form.produto_id) {
              if (!window.confirm('Descartar a pesagem em andamento?')) return;
            }
            router.push('/tickets');
          }}
        >
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
