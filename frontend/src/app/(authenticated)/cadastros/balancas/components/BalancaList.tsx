'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { Balanca, PaginatedResponse } from '@/types';
import { Pencil, Plus, Search, Trash2, Wifi, WifiOff } from 'lucide-react';

interface Props {
  data?: PaginatedResponse<Balanca>;
  isLoading: boolean;
  search: string;
  page: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
  onCreate: () => void;
  onEdit: (balanca: Balanca) => void;
  onDelete: (id: string) => void;
}

function renderStatus(b: Balanca) {
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
}

export function BalancaList({
  data,
  isLoading,
  search,
  page,
  onSearchChange,
  onPageChange,
  onRefetch,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Balancas</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total || 0} balancas cadastradas</p>
        </div>
        <Button variant="primary" onClick={onCreate}>
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
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onRefetch()}
            />
            <Button variant="secondary" onClick={onRefetch}>
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
                        ? `${b.indicador.fabricante ?? ''} ${b.indicador.modelo ?? ''}`.trim()
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
                          onClick={() => onEdit(b)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => onDelete(b.id)}
                          aria-label="Excluir"
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
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.min(data.totalPages, page + 1))}
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
