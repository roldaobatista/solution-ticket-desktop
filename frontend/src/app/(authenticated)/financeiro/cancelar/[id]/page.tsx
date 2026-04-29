'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/dialog';
import { getFaturaById, cancelarFatura } from '@/lib/api';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { ChevronLeft, Ban, AlertTriangle } from 'lucide-react';

export default function CancelarFaturaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [motivo, setMotivo] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [firstConfirmed, setFirstConfirmed] = useState(false);

  const { data: fatura } = useQuery({
    queryKey: ['fatura', id],
    queryFn: () => getFaturaById(id),
    enabled: !!id,
  });

  const mut = useMutation({
    mutationFn: () => cancelarFatura(id, motivo),
    onSuccess: () => {
      router.push('/financeiro');
    },
  });

  if (!fatura) {
    return <div className="py-12 text-center text-slate-400">Carregando...</div>;
  }

  const podeCancelar = fatura.status !== 'CANCELADA' && motivo.trim().length >= 5;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} aria-label="Anterior">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cancelar Fatura</h1>
          <p className="text-sm text-slate-500 mt-1">A operacao estornara os saldos vinculados</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-600" />
            {fatura.numero}
            <Badge
              variant={
                fatura.status === 'BAIXADA'
                  ? 'success'
                  : fatura.status === 'PARCIAL'
                    ? 'warning'
                    : fatura.status === 'CANCELADA'
                      ? 'danger'
                      : 'primary'
              }
              className="ml-2"
            >
              {fatura.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Info label="Cliente" value={fatura.cliente_nome || '-'} />
            <Info label="Tipo" value={fatura.tipo_fatura} />
            <Info label="Data Emissao" value={formatDateShort(fatura.data_emissao)} />
            <Info label="Total Geral" value={formatCurrency(fatura.total_geral)} />
            <Info label="Total Romaneio" value={formatCurrency(fatura.total_romaneio)} />
            <Info label="Adiantamento" value={formatCurrency(fatura.total_adiantamento || 0)} />
            <Info label="NF" value={fatura.nota_fiscal_associada || '-'} />
            <Info label="Emitido por" value={fatura.usuario_emissao_nome || '-'} />
          </div>
          {fatura.observacao && (
            <p className="mt-4 text-sm text-slate-600">
              <span className="text-xs text-slate-500 uppercase">Obs:</span> {fatura.observacao}
            </p>
          )}
        </CardContent>
      </Card>

      {fatura.status === 'CANCELADA' ? (
        <Card>
          <CardContent className="py-6 text-center text-slate-500">
            Esta fatura ja esta cancelada.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Motivo do cancelamento (obrigatorio)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo (min. 5 caracteres)..."
            />
            <p className="text-xs text-slate-500 mt-2">
              Ao confirmar, os pagamentos desta fatura serao estornados e o saldo do cliente sera
              recalculado.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => router.back()}>
                Voltar
              </Button>
              <Button
                variant="danger"
                disabled={!podeCancelar}
                onClick={() => {
                  setFirstConfirmed(true);
                  setConfirmOpen(true);
                }}
              >
                <Ban className="w-4 h-4 mr-2" /> Cancelar Fatura
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen && firstConfirmed}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          // Primeira confirmacao: pede segunda
          if (firstConfirmed && !mut.isPending) {
            mut.mutate();
          }
        }}
        title="Confirmar cancelamento"
        description={`Confirma o cancelamento da fatura ${fatura.numero}? Esta acao estornara saldos e nao pode ser desfeita.`}
        confirmText="Sim, cancelar fatura"
        cancelText="Nao"
        variant="danger"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
