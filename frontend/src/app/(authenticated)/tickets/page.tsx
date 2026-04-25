'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { getTickets } from '@/lib/api';
import { formatWeight, formatDate } from '@/lib/utils';
import TicketPreview from '@/components/ticket/TicketPreview';
import { FileText, Search, Printer, Eye, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_PESAGEM', label: 'Em Pesagem' },
  { value: 'AGUARDANDO_PASSAGEM', label: 'Aguardando Passagem' },
  { value: 'FECHADO', label: 'Fechado' },
  { value: 'EM_MANUTENCAO', label: 'Em Manutencao' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [placa, setPlaca] = useState('');
  const [cliente, setCliente] = useState('');
  const [page, setPage] = useState(1);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const limit = 10;

  const composedSearch = [search, placa, cliente].filter(Boolean).join(' ');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', page, composedSearch, statusFilter, dataInicio, dataFim],
    queryFn: () => getTickets(page, limit, composedSearch, statusFilter),
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDataInicio('');
    setDataFim('');
    setPlaca('');
    setCliente('');
    setPage(1);
  };

  const tickets = (data?.data || []).filter((t) => {
    if (!dataInicio && !dataFim) return true;
    const dt = new Date(t.created_at).getTime();
    if (dataInicio && dt < new Date(dataInicio).getTime()) return false;
    if (dataFim && dt > new Date(dataFim).getTime() + 86400000) return false;
    return true;
  });
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets de Pesagem</h1>
          <p className="text-sm text-slate-500 mt-1">{total} tickets encontrados</p>
        </div>
        <div className="flex gap-2">
          <Link href="/pesagem/entrada">
            <Button variant="primary">
              <FileText className="w-4 h-4 mr-2" />
              Nova Entrada
            </Button>
          </Link>
          <Link href="/pesagem/saida">
            <Button variant="secondary">
              <FileText className="w-4 h-4 mr-2" />
              Nova Saida
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Input
              label="Busca geral"
              placeholder="numero, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Input
              label="Placa"
              placeholder="ABC-1234"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
            />
            <Input
              label="Cliente"
              placeholder="Nome/documento"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
            <Select
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
            <Input
              label="Data Inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <Input
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Numero</TableHeader>
                <TableHeader>Data</TableHeader>
                <TableHeader>Placa</TableHeader>
                <TableHeader>Motorista</TableHeader>
                <TableHeader>Produto</TableHeader>
                <TableHeader>Bruto</TableHeader>
                <TableHeader>Tara</TableHeader>
                <TableHeader>Liquido</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Acoes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                    Nenhum ticket encontrado
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-slate-800 hover:text-emerald-600"
                      >
                        {ticket.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{ticket.veiculo_placa}</TableCell>
                    <TableCell>{ticket.motorista_nome || '-'}</TableCell>
                    <TableCell>{ticket.produto_nome || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {ticket.peso_bruto_apurado ? formatWeight(ticket.peso_bruto_apurado) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {ticket.peso_tara_apurada ? formatWeight(ticket.peso_tara_apurada) : '-'}
                    </TableCell>
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
                              : ticket.status_operacional === 'EM_PESAGEM' ||
                                  ticket.status_operacional === 'AGUARDANDO_PASSAGEM'
                                ? 'warning'
                                : ticket.status_operacional === 'EM_MANUTENCAO'
                                  ? 'danger'
                                  : 'primary'
                        }
                      >
                        {ticket.status_operacional}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm" className="p-1" title="Ver detalhes">
                            <Eye className="w-4 h-4 text-slate-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          title="Reimprimir"
                          onClick={() => setPreviewId(ticket.id)}
                        >
                          <Printer className="w-4 h-4 text-slate-500" />
                        </Button>
                        {ticket.status_operacional === 'FECHADO' && (
                          <Link href="/manutencao">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1"
                              title="Editar (Manutencao)"
                            >
                              <Pencil className="w-4 h-4 text-slate-500" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <TicketPreview ticketId={previewId} open={!!previewId} onClose={() => setPreviewId(null)} />
    </div>
  );
}
