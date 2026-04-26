'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { getTicketById } from '@/lib/api';
import { DocumentosTicket } from '@/components/ticket/DocumentosTicket';
import { CameraTicket } from '@/components/ticket/CameraTicket';
import { formatWeight, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { use } from 'react';
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  Scale,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Truck,
  Car,
  Package,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicketById(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-700 rounded-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-700">Ticket nao encontrado</h2>
        <Link
          href="/tickets"
          className="text-emerald-600 hover:underline text-sm mt-2 inline-block"
        >
          Voltar para lista
        </Link>
      </div>
    );
  }

  const statusTimeline = [
    { label: 'Abertura', done: true, date: ticket.created_at },
    {
      label: 'Primeira Passagem',
      done: !!ticket.primeira_passagem_em,
      date: ticket.primeira_passagem_em,
    },
    {
      label: ticket.fluxo_pesagem === '1PF_TARA_REFERENCIADA' ? 'Fechamento' : 'Segunda Passagem',
      done: ticket.total_passagens_realizadas >= 2 || ticket.status_operacional === 'FECHADO',
      date: ticket.ultima_passagem_em,
    },
    ...(ticket.fluxo_pesagem === '1PF_TARA_REFERENCIADA'
      ? []
      : [
          {
            label: 'Fechamento',
            done: ticket.status_operacional === 'FECHADO',
            date: ticket.status_operacional === 'FECHADO' ? ticket.updated_at : undefined,
          },
        ]),
  ];

  const infoItems = [
    { icon: <User className="w-4 h-4" />, label: 'Cliente', value: ticket.cliente_nome || '-' },
    {
      icon: <Truck className="w-4 h-4" />,
      label: 'Transportadora',
      value: ticket.transportadora_nome || '-',
    },
    { icon: <User className="w-4 h-4" />, label: 'Motorista', value: ticket.motorista_nome || '-' },
    { icon: <Car className="w-4 h-4" />, label: 'Placa', value: ticket.veiculo_placa },
    {
      icon: <Package className="w-4 h-4" />,
      label: 'Produto',
      value: `${ticket.produto_nome || '-'} (${ticket.produto_unidade || 'kg'})`,
    },
    { icon: <Scale className="w-4 h-4" />, label: 'Nota Fiscal', value: ticket.nota_fiscal || '-' },
    {
      icon: <User className="w-4 h-4" />,
      label: 'Operador',
      value: ticket.usuario_abertura_nome || '-',
    },
    {
      icon: <Scale className="w-4 h-4" />,
      label: 'Fluxo',
      value:
        ticket.fluxo_pesagem === '1PF_TARA_REFERENCIADA'
          ? '1PF (Tara Ref.)'
          : ticket.fluxo_pesagem === '2PF_BRUTO_TARA'
            ? '2PF (Bruto+Tara)'
            : '3PF (Com Controle)',
    },
  ];

  const tabs = [
    {
      label: 'Passagens',
      value: 'passagens',
      content: (
        <div className="space-y-4">
          {ticket.passagens && ticket.passagens.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Seq.</TableHeader>
                  <TableHeader>Tipo</TableHeader>
                  <TableHeader>Papel</TableHeader>
                  <TableHeader>Peso</TableHeader>
                  <TableHeader>Balanca</TableHeader>
                  <TableHeader>Origem</TableHeader>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {ticket.passagens.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.sequencia}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        {p.tipo_passagem === 'ENTRADA' ? (
                          <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
                        ) : p.tipo_passagem === 'SAIDA' ? (
                          <ArrowUpFromLine className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Scale className="w-4 h-4 text-slate-400" />
                        )}
                        {p.tipo_passagem}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.papel_calculo === 'BRUTO_OFICIAL'
                            ? 'success'
                            : p.papel_calculo === 'TARA_OFICIAL'
                              ? 'primary'
                              : 'default'
                        }
                      >
                        {p.papel_calculo === 'BRUTO_OFICIAL'
                          ? 'Bruto Oficial'
                          : p.papel_calculo === 'TARA_OFICIAL'
                            ? 'Tara Oficial'
                            : p.papel_calculo === 'CONTROLE'
                              ? 'Controle'
                              : p.papel_calculo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">
                      {formatWeight(p.peso_capturado)}
                    </TableCell>
                    <TableCell>{p.balanca_nome || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={p.origem_leitura === 'AUTOMATICA' ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {p.origem_leitura === 'AUTOMATICA'
                          ? 'Auto'
                          : p.origem_leitura === 'MANUAL'
                            ? 'Manual'
                            : 'Ref.'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(p.data_hora)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{p.status_passagem}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-slate-400">Nenhuma passagem registrada</p>
          )}
        </div>
      ),
    },
    {
      label: 'Calculo',
      value: 'calculo',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Peso Bruto Apurado</p>
              <p className="text-lg font-bold text-blue-800 font-mono">
                {formatWeight(ticket.peso_bruto_apurado || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium">Peso Tara Apurada</p>
              <p className="text-lg font-bold text-amber-800 font-mono">
                {formatWeight(ticket.peso_tara_apurada || 0)}
              </p>
              {ticket.tara_referencia_tipo && (
                <p className="text-xs text-amber-500">
                  {ticket.tara_referencia_tipo === 'CADASTRADA'
                    ? 'Tara Cadastrada'
                    : ticket.tara_referencia_tipo}
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Peso Liquido Bruto</p>
              <p className="text-lg font-bold text-purple-800 font-mono">
                {formatWeight(ticket.peso_liquido_sem_desconto || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-600 font-medium">Total Descontos</p>
              <p className="text-lg font-bold text-orange-800 font-mono">
                {formatWeight(ticket.total_descontos || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-300">
              <p className="text-xs text-emerald-600 font-medium">PESO LIQUIDO FINAL</p>
              <p className="text-xl font-bold text-emerald-800 font-mono">
                {formatWeight(ticket.peso_liquido_final || 0)}
              </p>
            </div>
          </div>

          {ticket.tara_cadastrada_snapshot && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-slate-600">
                <strong>Tara cadastrada (snapshot):</strong>{' '}
                {formatWeight(ticket.tara_cadastrada_snapshot)}
              </p>
            </div>
          )}

          {ticket.valor_total && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Valores Comerciais</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Valor Unitario</p>
                  <p className="text-lg font-medium text-slate-800">
                    R$ {ticket.valor_unitario?.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Valor Total</p>
                  <p className="text-lg font-medium text-emerald-600">
                    R$ {ticket.valor_total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      label: 'Documentos',
      value: 'documentos',
      content: <DocumentosTicket ticketId={id} />,
    },
    {
      label: 'Fotos',
      value: 'fotos',
      content: <CameraTicket ticketId={id} />,
    },
    {
      label: 'Timeline',
      value: 'timeline',
      content: (
        <div className="py-4">
          <div className="relative">
            {statusTimeline.map((step) => (
              <div key={step.label} className="flex items-start gap-4 mb-6">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400',
                  )}
                >
                  {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.done ? 'text-slate-800' : 'text-slate-400',
                    )}
                  >
                    {step.label}
                  </p>
                  {step.date && <p className="text-xs text-slate-500">{formatDate(step.date)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{ticket.numero}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  ticket.status_operacional === 'FECHADO'
                    ? 'success'
                    : ticket.status_operacional === 'CANCELADO'
                      ? 'danger'
                      : ticket.status_operacional === 'EM_PESAGEM' ||
                          ticket.status_operacional === 'AGUARDANDO_PASSAGEM'
                        ? 'warning'
                        : 'primary'
                }
              >
                {ticket.status_operacional === 'RASCUNHO'
                  ? 'Rascunho'
                  : ticket.status_operacional === 'ABERTO'
                    ? 'Aberto'
                    : ticket.status_operacional === 'EM_PESAGEM'
                      ? 'Em Pesagem'
                      : ticket.status_operacional === 'AGUARDANDO_PASSAGEM'
                        ? 'Aguardando'
                        : ticket.status_operacional === 'FECHADO'
                          ? 'Fechado'
                          : ticket.status_operacional === 'EM_MANUTENCAO'
                            ? 'Manutencao'
                            : 'Cancelado'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.status_comercial === 'NAO_ROMANEADO'
                  ? 'Nao Romaneado'
                  : ticket.status_comercial === 'ROMANEADO'
                    ? 'Romaneado'
                    : ticket.status_comercial === 'FATURADO'
                      ? 'Faturado'
                      : ticket.status_comercial}
              </Badge>
              {ticket.cancelado_motivo && (
                <span className="text-xs text-red-500">Motivo: {ticket.cancelado_motivo}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Reimprimir
          </Button>
          {ticket.status_operacional === 'FECHADO' && (
            <Button variant="primary" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Manutencao
            </Button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <div className="text-slate-400 mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-medium text-slate-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          {ticket.observacao && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-slate-500">Observacao</p>
                <p className="text-sm text-slate-700">{ticket.observacao}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs tabs={tabs} defaultValue="passagens" />
        </CardContent>
      </Card>
    </div>
  );
}
