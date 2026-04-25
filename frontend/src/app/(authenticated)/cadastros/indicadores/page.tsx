'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { getIndicadoresList } from '@/lib/api';

export default function IndicadoresPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['indicadores-cad'],
    queryFn: getIndicadoresList,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Indicadores de Pesagem</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lista de indicadores pre-cadastrados no sistema (somente leitura).
          {data && ` ${data.length} indicadores disponiveis.`}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Modelo</TableHeader>
                <TableHeader>Fabricante</TableHeader>
                <TableHeader>Parser</TableHeader>
                <TableHeader>Baudrate</TableHeader>
                <TableHeader>Data Bits</TableHeader>
                <TableHeader>Stop Bits</TableHeader>
                <TableHeader>Paridade</TableHeader>
                <TableHeader>Fator</TableHeader>
                <TableHeader>Inverte Peso</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="animate-spin h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    Nenhum indicador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((ind) => (
                  <TableRow key={ind.id}>
                    <TableCell className="font-medium">{ind.modelo}</TableCell>
                    <TableCell>{ind.fabricante}</TableCell>
                    <TableCell className="font-mono text-xs">{ind.parserTipo || '-'}</TableCell>
                    <TableCell>{ind.baudrate ?? '-'}</TableCell>
                    <TableCell>{ind.databits ?? '-'}</TableCell>
                    <TableCell>{ind.stopbits ?? '-'}</TableCell>
                    <TableCell>{ind.parity || '-'}</TableCell>
                    <TableCell>{ind.fator ?? '-'}</TableCell>
                    <TableCell>{ind.invertePeso ? 'Sim' : 'Nao'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
