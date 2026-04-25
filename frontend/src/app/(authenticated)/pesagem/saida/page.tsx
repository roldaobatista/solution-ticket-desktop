'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getBalancas, getTickets, getTicketById, registrarPassagem, fecharTicket } from '@/lib/api';
import { formatWeight } from '@/lib/utils';
import PesoRealtime from '@/components/peso/PesoRealtime';
import TicketPreview from '@/components/ticket/TicketPreview';
import { Save, X, ArrowUpFromLine, Search } from 'lucide-react';

export default function PesagemSaidaPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [balancaId, setBalancaId] = useState('');
  const [pesagemManual, setPesagemManual] = useState(false);
  const [pesoAtual, setPesoAtual] = useState(0);
  const [, setEstavel] = useState(false);
  const [descontos, setDescontos] = useState(0);
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);

  const { data: balancas } = useQuery({
    queryKey: ['balancas'],
    queryFn: () => getBalancas(1, 100),
  });
  const { data: ticketsAbertos } = useQuery({
    queryKey: ['tickets-abertos', busca],
    queryFn: () => getTickets(1, 20, busca, 'AGUARDANDO_PASSAGEM'),
  });

  const { data: ticket } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicketById(ticketId),
    enabled: !!ticketId,
  });

  const balancaOptions = useMemo(
    () => [
      { value: '', label: 'Selecione...' },
      ...(balancas?.data || []).map((b) => ({ value: b.id, label: b.nome })),
    ],
    [balancas],
  );

  const ticketOptions = useMemo(
    () => [
      { value: '', label: 'Selecione ticket de entrada...' },
      ...(ticketsAbertos?.data || []).map((t) => ({
        value: t.id,
        label: `${t.numero} - ${t.veiculo_placa} - ${t.cliente_nome || ''}`,
      })),
    ],
    [ticketsAbertos],
  );

  const pesoEntrada = ticket?.peso_bruto_apurado || 0;
  const pesoSaida = pesoAtual;
  const pesoLiquido = Math.max(0, Math.abs(pesoEntrada - pesoSaida) - descontos);

  const finalizarMutation = useMutation({
    mutationFn: async () => {
      await registrarPassagem(ticketId, {
        tipo_passagem: 'SAIDA',
        papel_calculo: 'TARA_OFICIAL',
        peso_capturado: pesoSaida,
        balanca_id: balancaId,
        origem_leitura: pesagemManual ? 'MANUAL' : 'BALANCA',
      });
      return fecharTicket(ticketId);
    },
    onSuccess: () => {
      setPreviewTicketId(ticketId);
    },
  });

  const canSave = !!ticketId && !!balancaId && pesoSaida > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesagem de Saida</h1>
          <p className="text-sm text-slate-500 mt-1">Finalizar ticket com peso de saida / tara</p>
        </div>
        <Badge variant="warning" className="px-3 py-1">
          <ArrowUpFromLine className="w-3.5 h-3.5 mr-1" />
          Saida
        </Badge>
      </div>

      {/* Busca ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket de Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por numero ou placa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button variant="secondary">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>

          <Select
            label="Ticket"
            options={ticketOptions}
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          />
        </CardContent>
      </Card>

      {ticket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados do ticket */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Ticket #{ticket.numero}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Balanca *"
                  options={balancaOptions}
                  value={balancaId}
                  onChange={(e) => setBalancaId(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Placa" value={ticket.veiculo_placa} readOnly />
                  <Input label="Cliente" value={ticket.cliente_nome || ''} readOnly />
                  <Input label="Motorista" value={ticket.motorista_nome || ''} readOnly />
                  <Input label="Transportadora" value={ticket.transportadora_nome || ''} readOnly />
                  <Input label="Produto" value={ticket.produto_nome || ''} readOnly />
                  <Input label="Nota Fiscal" value={ticket.nota_fiscal || ''} readOnly />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  <strong>Peso de Entrada (bloqueado):</strong> {formatWeight(pesoEntrada)}
                </div>

                <Input
                  label="Descontos (kg)"
                  type="number"
                  value={descontos || ''}
                  onChange={(e) => setDescontos(Number(e.target.value) || 0)}
                />

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pesagemManual}
                    onChange={(e) => setPesagemManual(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Pesagem Manual
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Peso e calculo */}
          <div className="space-y-4">
            <PesoRealtime
              balancaId={balancaId || undefined}
              onPesoChange={(p, e) => {
                if (!pesagemManual) {
                  setPesoAtual(p);
                  setEstavel(e);
                }
              }}
            />

            {pesagemManual && (
              <Card>
                <CardContent className="pt-6">
                  <Input
                    label="Peso Saida Manual (kg)"
                    type="number"
                    value={pesoAtual || ''}
                    onChange={(e) => setPesoAtual(Number(e.target.value) || 0)}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-emerald-300">
              <CardContent className="pt-6 space-y-3">
                <div>
                  <div className="text-xs text-slate-500">Peso Entrada</div>
                  <div className="text-lg font-mono">{formatWeight(pesoEntrada)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Peso Saida (Tara)</div>
                  <div className="text-lg font-mono">{formatWeight(pesoSaida)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Descontos</div>
                  <div className="text-lg font-mono">{formatWeight(descontos)}</div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs text-emerald-600 font-medium">PESO LIQUIDO</div>
                  <div className="text-3xl font-mono font-bold text-emerald-700">
                    {formatWeight(pesoLiquido)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="secondary" onClick={() => router.push('/tickets')}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={() => finalizarMutation.mutate()}
          disabled={!canSave}
          isLoading={finalizarMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Finalizar Pesagem
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
    </div>
  );
}
