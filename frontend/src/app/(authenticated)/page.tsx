'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import {
  getDashboardKpis,
  getPesagensPorPeriodo,
  getTickets,
  getTopClientesVolume,
  getDistribuicaoProduto,
  getBalancas,
} from '@/lib/api';
import { formatWeight, formatDate, formatNumber } from '@/lib/utils';
import {
  Scale,
  Clock,
  Wifi,
  WifiOff,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Package,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from '@/components/dashboard/recharts-lazy';
import Link from 'next/link';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function DashboardPage() {
  const { data: kpis } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => getDashboardKpis(),
  });
  const { data: pesagens30 } = useQuery({
    queryKey: ['dashboard-pesagens-30'],
    queryFn: () => getPesagensPorPeriodo('30d'),
  });
  const { data: topClientes } = useQuery({
    queryKey: ['dashboard-top-clientes'],
    queryFn: () => getTopClientesVolume('mes'),
  });
  const { data: distribuicao } = useQuery({
    queryKey: ['dashboard-distribuicao-produto'],
    queryFn: () => getDistribuicaoProduto('mes'),
  });
  const { data: ticketsData } = useQuery({
    queryKey: ['dashboard-tickets'],
    queryFn: () => getTickets(1, 10),
  });
  const { data: balancasData } = useQuery({
    queryKey: ['dashboard-balancas'],
    queryFn: () => getBalancas(1, 50),
  });

  const tickets = ticketsData?.data?.slice(0, 10) || [];
  const balancas = balancasData?.data || [];
  const onlineCount = balancas.filter((b) => b.status_conexao === 'ONLINE').length;
  const offlineCount = balancas.length - onlineCount;

  const top5 = (topClientes || []).slice(0, 5).map((c) => ({
    nome: c.cliente_nome.length > 18 ? c.cliente_nome.slice(0, 18) + '...' : c.cliente_nome,
    peso: Math.round(c.peso_total / 1000),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Visao geral da operacao</p>
        </div>
        <Link href="/pesagem">
          <Button variant="success">
            <Scale className="w-4 h-4 mr-2" />
            Nova Pesagem
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Pesagens Hoje"
          value={formatNumber(kpis?.pesagens_hoje || 0)}
          icon={<Scale className="w-5 h-5 text-emerald-600" />}
          tint="bg-emerald-50"
        />
        <KpiCard
          label="Pesagens Semana"
          value={kpis?.pesagens_semana != null ? formatNumber(kpis.pesagens_semana) : 'sem dados'}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          tint="bg-blue-50"
        />
        <KpiCard
          label="Pesagens Mes"
          value={formatNumber(kpis?.pesagens_mes || 0)}
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          tint="bg-purple-50"
        />
        <KpiCard
          label="Peso Movimentado"
          value={`${((kpis?.peso_total_mes || 0) / 1000).toFixed(1)} t`}
          hint="Mes atual"
          icon={<Package className="w-5 h-5 text-amber-600" />}
          tint="bg-amber-50"
        />
        <KpiCard
          label="Tickets em Aberto"
          value={formatNumber(kpis?.tickets_em_aberto || kpis?.pesagens_em_aberto || 0)}
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          tint="bg-orange-50"
        />
        <Card>
          <CardContent className="flex items-start justify-between py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Balancas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600">{onlineCount}</span>
                <span className="text-sm text-slate-400">online</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {offlineCount > 0 ? (
                  <span className="text-red-500 inline-flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> {offlineCount} offline
                  </span>
                ) : (
                  <span className="text-emerald-500 inline-flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> todas online
                  </span>
                )}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${offlineCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {offlineCount > 0 ? (
                <WifiOff className="w-5 h-5 text-red-600" />
              ) : (
                <Wifi className="w-5 h-5 text-emerald-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linha: pesagens por dia (30d) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineIcon className="w-5 h-5 text-slate-500" />
              Pesagens - Ultimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={pesagens30 || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pizza: distribuicao por produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="w-5 h-5 text-slate-500" />
              Distribuicao por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={distribuicao || []}
                  dataKey="peso_total"
                  nameKey="produto_nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(e: { percentual: number }) => `${e.percentual}%`}
                  labelLine={false}
                >
                  {(distribuicao || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatWeight(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Barras: top 5 clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-slate-500" />
            Top 5 Clientes por Volume (mes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top5} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: 't', position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip formatter={(v: number) => `${v} t`} />
              <Bar dataKey="peso" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grid: ultimas pesagens + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-slate-500" />
                Ultimas 10 Pesagens
              </CardTitle>
              <Link href="/tickets">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Ticket</TableHeader>
                    <TableHeader>Cliente</TableHeader>
                    <TableHeader>Placa</TableHeader>
                    <TableHeader>Produto</TableHeader>
                    <TableHeader>Peso Liquido</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Data</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="font-medium text-slate-800 hover:text-emerald-600"
                        >
                          {ticket.numero}
                        </Link>
                      </TableCell>
                      <TableCell>{ticket.cliente_nome || '-'}</TableCell>
                      <TableCell className="font-mono">{ticket.veiculo_placa}</TableCell>
                      <TableCell>{ticket.produto_nome || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {ticket.peso_liquido_final ? formatWeight(ticket.peso_liquido_final) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.status_operacional === 'FECHADO'
                              ? 'success'
                              : ticket.status_operacional === 'CANCELADO'
                                ? 'danger'
                                : ticket.status_operacional === 'EM_PESAGEM'
                                  ? 'warning'
                                  : ticket.status_operacional === 'EM_MANUTENCAO'
                                    ? 'danger'
                                    : 'primary'
                          }
                        >
                          {ticket.status_operacional}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(ticket.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        Nenhuma pesagem encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tint,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tint: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between py-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>
        <div className={`p-3 rounded-lg ${tint}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}
