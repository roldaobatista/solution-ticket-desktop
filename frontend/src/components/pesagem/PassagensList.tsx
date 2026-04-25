'use client';

/**
 * F2: extraido de pesagem/page.tsx (era inline 64 linhas).
 * Lista as passagens registradas em um ticket aberto.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatWeight, formatDate } from '@/lib/utils';

export interface Passagem {
  id: string;
  sequencia: number;
  tipo: string;
  papel: string;
  peso: number;
  data_hora: string;
  balanca: string;
  status: string;
}

export function PassagensList({ passages }: { passages: ReadonlyArray<Passagem> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Passagens Registradas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Seq.</TableHeader>
              <TableHeader>Tipo</TableHeader>
              <TableHeader>Papel</TableHeader>
              <TableHeader>Peso</TableHeader>
              <TableHeader>Balanca</TableHeader>
              <TableHeader>Hora</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {passages.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.sequencia}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1">
                    {p.tipo === 'ENTRADA' ? (
                      <ArrowDownToLine className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4 text-blue-500" aria-hidden="true" />
                    )}
                    {p.tipo}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      p.papel === 'BRUTO_OFICIAL'
                        ? 'success'
                        : p.papel === 'TARA_OFICIAL'
                          ? 'primary'
                          : 'default'
                    }
                  >
                    {p.papel === 'BRUTO_OFICIAL'
                      ? 'Bruto'
                      : p.papel === 'TARA_OFICIAL'
                        ? 'Tara'
                        : p.papel}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono font-bold">{formatWeight(p.peso)}</TableCell>
                <TableCell>{p.balanca}</TableCell>
                <TableCell className="text-slate-500">{formatDate(p.data_hora)}</TableCell>
                <TableCell>
                  <Badge variant="success">Valida</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
