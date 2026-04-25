'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTicketStore } from '@/stores/ticket.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  getClientes,
  getTransportadoras,
  getMotoristas,
  getProdutos,
  getVeiculos,
  getBalancas,
  capturarPeso,
  createTicket,
  registrarPassagem,
  fecharTicket,
  cancelarTicket,
} from '@/lib/api';
import { PesoRealtime } from '@/components/balanca/PesoRealtime';
import { PassagensList } from '@/components/pesagem/PassagensList';
import { CancelTicketDialog } from '@/components/pesagem/CancelTicketDialog';
import { Toast, useToast } from '@/components/ui/toast';
import { formatWeight, formatDate, cn } from '@/lib/utils';
import { extractMessage } from '@/lib/errors';
import {
  Scale,
  Play,
  Square,
  X,
  Printer,
  Save,
  RotateCcw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Gauge,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Timer,
} from 'lucide-react';

export default function PesagemPage() {
  const [ticketForm, setTicketForm] = useState({
    cliente_id: '',
    transportadora_id: '',
    motorista_id: '',
    veiculo_id: '',
    veiculo_placa: '',
    produto_id: '',
    origem: '',
    destino: '',
    armazem: '',
    nota_fiscal: '',
    peso_nf: '',
    fluxo_pesagem: '2PF_BRUTO_TARA',
    observacao: '',
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedWeight, setSimulatedWeight] = useState(0);
  const [balancaSelecionadaId, setBalancaSelecionadaId] = useState<string>('');
  const [capturando, setCapturando] = useState(false);
  const { toast: pesoToast, showToast: showPesoToast, hideToast: hidePesoToast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [ticketOpened, setTicketOpened] = useState(false);
  const [passageCount, setPassageCount] = useState(0);
  const [passages, setPassages] = useState<
    Array<{
      id: string;
      sequencia: number;
      tipo: string;
      papel: string;
      peso: number;
      data_hora: string;
      balanca: string;
      status: string;
    }>
  >([]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => getClientes(1, 100),
  });
  const { data: transportadoras } = useQuery({
    queryKey: ['transportadoras'],
    queryFn: () => getTransportadoras(1, 100),
  });
  const { data: motoristas } = useQuery({
    queryKey: ['motoristas'],
    queryFn: () => getMotoristas(1, 100),
  });
  const { data: produtos } = useQuery({
    queryKey: ['produtos'],
    queryFn: () => getProdutos(1, 100),
  });
  const { data: veiculos } = useQuery({
    queryKey: ['veiculos'],
    queryFn: () => getVeiculos(1, 100),
  });
  const { data: balancas } = useQuery({
    queryKey: ['balancas'],
    queryFn: () => getBalancas(1, 100),
  });

  // Seleciona balanca ativa por padrao
  useEffect(() => {
    if (!balancaSelecionadaId && balancas?.data?.length) {
      const ativa =
        balancas.data.find(
          (b: { ativa?: boolean; ativo?: boolean }) => b.ativa !== false && b.ativo !== false,
        ) || balancas.data[0];
      if (ativa) setBalancaSelecionadaId(ativa.id);
    }
  }, [balancas, balancaSelecionadaId]);

  const balancaSelecionada = balancas?.data?.find(
    (b: { id: string }) => b.id === balancaSelecionadaId,
  );

  // Atalhos de teclado para operação sem mouse
  useKeyboardShortcuts(
    {
      F1: () => handleCapturarDaBalanca(),
      F2: () => setShowCloseDialog(true),
      Escape: () => setShowCancelDialog(true),
    },
    ticketOpened,
  );

  const handleCapturarDaBalanca = async () => {
    if (!balancaSelecionadaId) {
      showPesoToast('Selecione uma balanca', 'warning');
      return;
    }
    setCapturando(true);
    try {
      const leitura = await capturarPeso(balancaSelecionadaId);
      if (!leitura.estavel) {
        showPesoToast('Atencao: peso capturado nao estava estavel', 'warning');
      } else {
        showPesoToast(`Peso capturado: ${leitura.peso} kg`, 'success');
      }
      setSimulatedWeight(leitura.peso);
    } catch (e: unknown) {
      showPesoToast(extractMessage(e, 'Erro ao capturar peso'), 'error');
    } finally {
      setCapturando(false);
    }
  };

  const isScaleConnected = true;

  // Calculate derived values
  const fluxoOptions = [
    { value: '1PF_TARA_REFERENCIADA', label: '1 Passagem (Tara Referenciada)' },
    { value: '2PF_BRUTO_TARA', label: '2 Passagens (Bruto + Tara)' },
    { value: '3PF_COM_CONTROLE', label: '3 Passagens (Com Controle)' },
  ];

  const clienteOptions = (clientes?.data || []).map((c) => ({
    value: c.id,
    label: c.razao_social,
  }));
  const transportadoraOptions = (transportadoras?.data || []).map((t) => ({
    value: t.id,
    label: t.nome,
  }));
  const motoristaOptions = (motoristas?.data || []).map((m) => ({ value: m.id, label: m.nome }));
  const produtoOptions = (produtos?.data || []).map((p) => ({
    value: p.id,
    label: `${p.descricao} (${p.unidade})`,
  }));
  const veiculoOptions = (veiculos?.data || []).map((v) => ({
    value: v.id,
    label: `${v.placa} - ${v.transportadora_nome || 'Sem transportadora'}`,
  }));
  const balancaOptions = (balancas?.data || []).map((b) => ({
    value: b.id,
    label: `${b.nome} [${b.status_conexao}]`,
  }));

  const selectedVeiculo = veiculos?.data?.find((v) => v.id === ticketForm.veiculo_id);
  const taraCadastrada = selectedVeiculo?.tara_cadastrada;

  const brutoPassage = passages.find((p) => p.papel === 'BRUTO_OFICIAL');
  const taraPassage = passages.find((p) => p.papel === 'TARA_OFICIAL');

  const pesoBruto = brutoPassage?.peso || 0;
  const pesoTara =
    taraPassage?.peso ||
    (ticketForm.fluxo_pesagem === '1PF_TARA_REFERENCIADA' ? taraCadastrada || 0 : 0);
  const pesoLiquidoBruto = Math.max(0, pesoBruto - pesoTara);
  const descontos = 0;
  const pesoLiquidoFinal = Math.max(0, pesoLiquidoBruto - descontos);

  const canOpenTicket =
    ticketForm.cliente_id &&
    ticketForm.produto_id &&
    (ticketForm.veiculo_placa || ticketForm.veiculo_id);
  const canCapture = ticketOpened && !isSimulating;
  const canClose =
    ticketOpened &&
    ((ticketForm.fluxo_pesagem === '1PF_TARA_REFERENCIADA' && brutoPassage) ||
      (ticketForm.fluxo_pesagem === '2PF_BRUTO_TARA' && brutoPassage && taraPassage) ||
      (ticketForm.fluxo_pesagem === '3PF_COM_CONTROLE' && brutoPassage && taraPassage));

  const missingPassages =
    ticketForm.fluxo_pesagem === '1PF_TARA_REFERENCIADA'
      ? brutoPassage
        ? 0
        : 1
      : ticketForm.fluxo_pesagem === '2PF_BRUTO_TARA'
        ? brutoPassage && taraPassage
          ? 0
          : brutoPassage || taraPassage
            ? 1
            : 2
        : brutoPassage && taraPassage
          ? 0
          : brutoPassage || taraPassage
            ? 1
            : 2;

  const handleOpenTicket = async () => {
    setTicketOpened(true);
    setPassageCount(0);
    setPassages([]);
  };

  const simulateWeightReading = () => {
    setIsSimulating(true);
    let current = 0;
    const target = Math.floor(Math.random() * (55000 - 12000) + 12000);

    const interval = setInterval(() => {
      current += Math.floor((target - current) * 0.15) + Math.floor(Math.random() * 200 - 100);
      if (Math.abs(target - current) < 100) current = target;
      setSimulatedWeight(current);
      if (current === target) {
        clearInterval(interval);
        setTimeout(() => setIsSimulating(false), 500);
      }
    }, 50);
  };

  const handleCaptureWeight = () => {
    if (simulatedWeight === 0) return;

    const is1PF = ticketForm.fluxo_pesagem === '1PF_TARA_REFERENCIADA';
    const hasBruto = passages.some((p) => p.papel === 'BRUTO_OFICIAL');

    let tipo: string;
    let papel: string;

    if (!hasBruto) {
      tipo = 'ENTRADA';
      papel = 'BRUTO_OFICIAL';
    } else if (is1PF) {
      return; // 1PF only needs 1 passage
    } else {
      tipo = 'SAIDA';
      papel = 'TARA_OFICIAL';
    }

    const newPassage = {
      id: `pass-${Date.now()}`,
      sequencia: passages.length + 1,
      tipo,
      papel,
      peso: simulatedWeight,
      data_hora: new Date().toISOString(),
      balanca: balancas?.data?.[0]?.nome || 'Balanca Principal',
      status: 'VALIDA',
    };

    setPassages((prev) => [...prev, newPassage]);
    setPassageCount((prev) => prev + 1);
    setSimulatedWeight(0);
  };

  const handleCloseTicket = () => {
    setShowCloseDialog(true);
  };

  const handleCancelTicket = () => {
    setShowCancelDialog(true);
  };

  const resetAll = () => {
    setTicketOpened(false);
    setPassages([]);
    setPassageCount(0);
    setSimulatedWeight(0);
    setTicketForm({
      cliente_id: '',
      transportadora_id: '',
      motorista_id: '',
      veiculo_id: '',
      veiculo_placa: '',
      produto_id: '',
      origem: '',
      destino: '',
      armazem: '',
      nota_fiscal: '',
      peso_nf: '',
      fluxo_pesagem: '2PF_BRUTO_TARA',
      observacao: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesagem</h1>
          <p className="text-sm text-slate-500 mt-1">Operacao de pesagem veicular</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isScaleConnected ? 'success' : 'danger'}
            className="flex items-center gap-1 px-3 py-1"
          >
            {isScaleConnected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            Balanca {isScaleConnected ? 'Online' : 'Offline'}
          </Badge>
          {ticketOpened && (
            <Badge variant="warning" className="px-3 py-1">
              <Timer className="w-3.5 h-3.5 mr-1" />
              Em Andamento
            </Badge>
          )}
        </div>
      </div>

      {/* Widget de peso em tempo real */}
      {balancas?.data && balancas.data.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1">
                <Select
                  label="Balanca"
                  options={balancaOptions}
                  value={balancaSelecionadaId}
                  onChange={(e) => setBalancaSelecionadaId(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCapturarDaBalanca}
                disabled={!balancaSelecionadaId || capturando}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                {capturando ? 'Capturando...' : 'Capturar Peso'}
              </Button>
            </div>
            {balancaSelecionadaId && (
              <PesoRealtime balancaId={balancaSelecionadaId} nome={balancaSelecionada?.nome} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Ticket Opening Form */}
      <Card className={cn(ticketOpened && 'border-emerald-300 bg-emerald-50/30')}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="w-5 h-5 text-slate-500" />
            {ticketOpened ? 'Ticket em Andamento' : 'Abertura de Ticket'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Fluxo de Pesagem *"
              options={fluxoOptions}
              value={ticketForm.fluxo_pesagem}
              onChange={(e) => setTicketForm((f) => ({ ...f, fluxo_pesagem: e.target.value }))}
              disabled={ticketOpened}
            />
            <Select
              label="Cliente *"
              options={[{ value: '', label: 'Selecione...' }, ...clienteOptions]}
              value={ticketForm.cliente_id}
              onChange={(e) => setTicketForm((f) => ({ ...f, cliente_id: e.target.value }))}
              disabled={ticketOpened}
            />
            <Select
              label="Transportadora"
              options={[{ value: '', label: 'Selecione...' }, ...transportadoraOptions]}
              value={ticketForm.transportadora_id}
              onChange={(e) => setTicketForm((f) => ({ ...f, transportadora_id: e.target.value }))}
              disabled={ticketOpened}
            />
            <Select
              label="Motorista"
              options={[{ value: '', label: 'Selecione...' }, ...motoristaOptions]}
              value={ticketForm.motorista_id}
              onChange={(e) => setTicketForm((f) => ({ ...f, motorista_id: e.target.value }))}
              disabled={ticketOpened}
            />
            <Select
              label="Veiculo / Placa *"
              options={[{ value: '', label: 'Selecione...' }, ...veiculoOptions]}
              value={ticketForm.veiculo_id}
              onChange={(e) => {
                const v = veiculos?.data?.find((x) => x.id === e.target.value);
                setTicketForm((f) => ({
                  ...f,
                  veiculo_id: e.target.value,
                  veiculo_placa: v?.placa || '',
                }));
              }}
              disabled={ticketOpened}
            />
            <Select
              label="Produto *"
              options={[{ value: '', label: 'Selecione...' }, ...produtoOptions]}
              value={ticketForm.produto_id}
              onChange={(e) => setTicketForm((f) => ({ ...f, produto_id: e.target.value }))}
              disabled={ticketOpened}
            />
            <Input
              label="Nota Fiscal"
              value={ticketForm.nota_fiscal}
              onChange={(e) => setTicketForm((f) => ({ ...f, nota_fiscal: e.target.value }))}
              placeholder="Numero da NF"
              disabled={ticketOpened}
            />
            <Input
              label="Peso NF (kg)"
              type="number"
              value={ticketForm.peso_nf}
              onChange={(e) => setTicketForm((f) => ({ ...f, peso_nf: e.target.value }))}
              placeholder="Peso declarado na NF"
              disabled={ticketOpened}
            />
            <Input
              label="Origem"
              value={ticketForm.origem}
              onChange={(e) => setTicketForm((f) => ({ ...f, origem: e.target.value }))}
              placeholder="Local de origem"
              disabled={ticketOpened}
            />
            <Input
              label="Destino"
              value={ticketForm.destino}
              onChange={(e) => setTicketForm((f) => ({ ...f, destino: e.target.value }))}
              placeholder="Local de destino"
              disabled={ticketOpened}
            />
            <Input
              label="Armazem"
              value={ticketForm.armazem}
              onChange={(e) => setTicketForm((f) => ({ ...f, armazem: e.target.value }))}
              placeholder="Armazem / Silo"
              disabled={ticketOpened}
            />
          </div>

          {taraCadastrada !== undefined && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Tara cadastrada: <strong>{formatWeight(taraCadastrada)}</strong>
              {ticketForm.fluxo_pesagem === '1PF_TARA_REFERENCIADA' && (
                <span className="text-blue-500">- Sera usada no calculo</span>
              )}
            </div>
          )}

          {!ticketOpened && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={handleOpenTicket}
                disabled={!canOpenTicket}
              >
                <Play className="w-4 h-4 mr-2" />
                Abrir Ticket
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight Capture Area */}
      {ticketOpened && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-slate-500" />
                Captura de Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Scale Display */}
              <div className="flex flex-col items-center mb-6">
                <div className="scale-display w-full max-w-md">
                  {simulatedWeight > 0 ? formatWeight(simulatedWeight) : '---'}
                </div>
                {isSimulating && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1 animate-pulse">
                    <Timer className="w-4 h-4" />
                    Estabilizando...
                  </p>
                )}
                {simulatedWeight > 0 && !isSimulating && (
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Peso estavel - pronto para capturar
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={simulateWeightReading}
                  disabled={isSimulating}
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  {isSimulating ? 'Lendo...' : 'Ler Peso da Balanca'}
                </Button>
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleCaptureWeight}
                  disabled={simulatedWeight === 0 || isSimulating}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Capturar Peso
                </Button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-3">
                Simulacao: gera peso aleatorio entre 12.000 e 55.000 kg
              </p>

              {/* Missing Passages Info */}
              {missingPassages > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-center">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Faltam <strong>{missingPassages}</strong> passagem(ns) para fechar o ticket
                </div>
              )}
              {missingPassages === 0 && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 text-center">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Todas as passagens registradas. Ticket pronto para fechamento.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passages Table */}
          {passages.length > 0 && <PassagensList passages={passages} />}

          {/* Calculations Summary */}
          <Card className="border-2 border-slate-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-slate-500" />
                Resumo do Calculo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Peso Bruto Apurado</p>
                  <p className="text-xl font-bold text-blue-800 font-mono">
                    {formatWeight(pesoBruto)}
                  </p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Peso Tara Apurada</p>
                  <p className="text-xl font-bold text-amber-800 font-mono">
                    {formatWeight(pesoTara)}
                  </p>
                  {ticketForm.fluxo_pesagem === '1PF_TARA_REFERENCIADA' && (
                    <p className="text-xs text-amber-500">Referenciada</p>
                  )}
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Peso Liquido Bruto</p>
                  <p className="text-xl font-bold text-purple-800 font-mono">
                    {formatWeight(pesoLiquidoBruto)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">Total Descontos</p>
                  <p className="text-xl font-bold text-orange-800 font-mono">
                    {formatWeight(descontos)}
                  </p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300">
                  <p className="text-xs text-emerald-600 font-medium">PESO LIQUIDO FINAL</p>
                  <p className="text-2xl font-bold text-emerald-800 font-mono">
                    {formatWeight(pesoLiquidoFinal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 py-4">
            <Button variant="success" size="lg" onClick={handleCloseTicket} disabled={!canClose}>
              <Square className="w-4 h-4 mr-2" />
              Fechar Ticket
            </Button>
            <Button variant="secondary" size="lg">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="danger" size="lg" onClick={handleCancelTicket}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button variant="ghost" size="lg" onClick={resetAll}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Novo Ticket
            </Button>
          </div>
        </>
      )}

      {/* Cancel Dialog */}
      <CancelTicketDialog
        open={showCancelDialog}
        motivo={cancelMotivo}
        onMotivoChange={setCancelMotivo}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => {
          setShowCancelDialog(false);
          resetAll();
        }}
      />

      {pesoToast && (
        <Toast message={pesoToast.message} type={pesoToast.type} onClose={hidePesoToast} />
      )}

      {/* Close Dialog */}
      <ConfirmDialog
        open={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={() => {
          setShowCloseDialog(false);
          resetAll();
        }}
        title="Fechar Ticket"
        description={`Deseja fechar o ticket com peso liquido final de ${formatWeight(pesoLiquidoFinal)}?`}
        confirmText="Confirmar Fechamento"
        variant="default"
      />
    </div>
  );
}
