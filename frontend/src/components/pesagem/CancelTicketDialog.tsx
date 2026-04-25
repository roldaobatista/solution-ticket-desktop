'use client';

/**
 * F2: extraido de pesagem/page.tsx (era inline 30 linhas).
 * Dialog para cancelar ticket exigindo motivo.
 */

import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function CancelTicketDialog({
  open,
  motivo,
  onMotivoChange,
  onConfirm,
  onClose,
}: {
  open: boolean;
  motivo: string;
  onMotivoChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancelar Ticket"
      description="Informe o motivo do cancelamento. Esta acao nao pode ser desfeita."
    >
      <div className="space-y-4">
        <Input
          label="Motivo do Cancelamento *"
          value={motivo}
          onChange={(e) => onMotivoChange(e.target.value)}
          placeholder="Informe o motivo"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!motivo}>
            Confirmar Cancelamento
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
