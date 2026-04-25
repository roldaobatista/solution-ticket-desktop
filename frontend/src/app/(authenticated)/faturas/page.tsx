'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getFaturas, getFaturaById } from '@/lib/api';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { Receipt, Eye, ChevronLeft } from 'lucide-react';

export default function FaturasPage() {
  const [page, setPage] = useState(1);
  const [selectedFaturaId, setSelectedFaturaId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faturas', page],
    queryFn: () => getFaturas(page, 10),
  });

  const { data: selectedFatura } = useQuery({
    queryKey: ['fatura', selectedFaturaId],
    queryFn: () => (selectedFaturaId ? getFaturaById(selectedFaturaId) : null),
    enabled: !!selectedFaturaId,
  });

  if (selectedFaturaId && selectedFatura) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFaturaId(null)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selectedFatura.numero}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  selectedFatura.status === 'PAGA'
                    ? 'success'
                    : selectedFatura.status === 'PARCIALMENTE_PAGA'
                      ? 'warning'
                      : selectedFatura.status === 'CANCELADA'
                        ? 'danger'
                        : 'primary'
                }
              >
                {selectedFatura.status === 'PAGA'
                  ? 'Paga'
                  : selectedFatura.status === 'PARCIALMENTE_PAGA'
                    ? 'Parcial'
                    : selectedFatura.status === 'CANCELADA'
                      ? 'Cancelada'
                      : 'Aberta'}
              </Badge>
              <Badge variant="outline">{selectedFatura.tipo_fatura}</Badge>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedFatura.cliente_nome || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Data Emissao</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDateShort(selectedFatura.data_emissao)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nota Fiscal</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedFatura.nota_fiscal_associada || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Emitido por</p>
                <p className="text-sm font-medium text-slate-800">
                  {selectedFatura.usuario_emissao_nome || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Total Romaneio</span>
                <span className="text-sm font-medium">
                  {formatCurrency(selectedFatura.total_romaneio)}
                </span>
              </div>
              {selectedFatura.total_adiantamento ? (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Adiantamentos</span>
                  <span className="text-sm font-medium text-emerald-600">
                    - {formatCurrency(selectedFatura.total_adiantamento)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between py-3 bg-emerald-50 rounded-lg px-4">
                <span className="text-sm font-semibold text-slate-800">Total Geral</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(selectedFatura.total_geral)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFatura.pagamentos && selectedFatura.pagamentos.length > 0 ? (
                <div className="space-y-3">
                  {selectedFatura.pagamentos.map((pg) => (
                    <div key={pg.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">
                          {pg.forma_pagamento_descricao}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatCurrency(pg.valor)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Venc: {formatDateShort(pg.data_vencimento)}
                      </p>
                      {pg.numero_documento && (
                        <p className="text-xs text-slate-400">Doc: {pg.numero_documento}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-slate-400 text-sm">
                  Nenhum pagamento registrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedFatura.observacao && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observacao</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{selectedFatura.observacao}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Faturas</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} faturas emitidas</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Numero</TableHeader>
                <TableHeader>Cliente</TableHeader>
                <TableHeader>Tipo</TableHeader>
                <TableHeader>Total</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Data Emissao</TableHeader>
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
                    Nenhuma fatura encontrada
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero}</TableCell>
                    <TableCell>{f.cliente_nome || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{f.tipo_fatura}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(f.total_geral)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          f.status === 'PAGA'
                            ? 'success'
                            : f.status === 'PARCIALMENTE_PAGA'
                              ? 'warning'
                              : f.status === 'CANCELADA'
                                ? 'danger'
                                : 'primary'
                        }
                      >
                        {f.status === 'PAGA'
                          ? 'Paga'
                          : f.status === 'PARCIALMENTE_PAGA'
                            ? 'Parcial'
                            : f.status === 'CANCELADA'
                              ? 'Cancelada'
                              : 'Aberta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDate(f.data_emissao)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() => setSelectedFaturaId(f.id)}
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
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
    </div>
  );
}
