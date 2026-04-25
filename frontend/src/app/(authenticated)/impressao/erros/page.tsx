'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import { listarErrosImpressao, reimprimirErro, resolverErroImpressao } from '@/lib/api';
import { Printer, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ErrosImpressaoPage() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'resolvidos'>('pendentes');

  const { data: erros = [], isLoading } = useQuery({
    queryKey: ['erros-impressao', filtro],
    queryFn: () => listarErrosImpressao(filtro === 'todos' ? undefined : filtro === 'resolvidos'),
  });

  const reimpMut = useMutation({
    mutationFn: (id: string) => reimprimirErro(id),
    onSuccess: (r) => {
      if (r.ok) alert('Reimpressão realizada com sucesso');
      else alert('Falha ao reimprimir: ' + (r.erro || ''));
      qc.invalidateQueries({ queryKey: ['erros-impressao'] });
    },
  });

  const resMut = useMutation({
    mutationFn: (id: string) => resolverErroImpressao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erros-impressao'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Erros de Impressão</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
          >
            <option value="pendentes">Pendentes</option>
            <option value="resolvidos">Resolvidos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Lista de erros ({erros.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-slate-500">Carregando...</div>}
          {!isLoading && erros.length === 0 && (
            <div className="text-slate-500 text-sm py-6 text-center">Nenhum erro encontrado.</div>
          )}
          {erros.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Data</TableHeader>
                  <TableHeader>Ticket</TableHeader>
                  <TableHeader>Template</TableHeader>
                  <TableHeader>Mensagem</TableHeader>
                  <TableHeader>Tentativas</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {erros.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(e.criadoEm).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {e.ticketId?.slice(0, 8) || '-'}
                    </TableCell>
                    <TableCell>{e.template || '-'}</TableCell>
                    <TableCell className="max-w-sm truncate text-xs" title={e.mensagem}>
                      {e.mensagem}
                    </TableCell>
                    <TableCell>{e.tentativas}</TableCell>
                    <TableCell>
                      {e.resolvido ? (
                        <Badge variant="success">Resolvido</Badge>
                      ) : (
                        <Badge variant="warning">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!e.resolvido && e.ticketId && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => reimpMut.mutate(e.id)}
                            disabled={reimpMut.isPending}
                          >
                            <Printer className="w-4 h-4 mr-1" /> Reimprimir
                          </Button>
                        )}
                        {!e.resolvido && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => resMut.mutate(e.id)}
                            disabled={resMut.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Resolver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
