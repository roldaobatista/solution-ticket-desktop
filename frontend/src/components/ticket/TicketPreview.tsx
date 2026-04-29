'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getTicketPdfObjectUrl, listarTemplatesTicket } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';

interface TicketPreviewProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TicketPreview({ ticketId, open, onClose }: TicketPreviewProps) {
  const [template, setTemplate] = useState('TICKET002');

  const { data: templates } = useQuery({
    queryKey: ['templates-ticket'],
    queryFn: listarTemplatesTicket,
    enabled: open,
  });

  const { data: pdfUrl } = useQuery({
    queryKey: ['ticket-pdf-preview', ticketId, template],
    queryFn: () => getTicketPdfObjectUrl(ticketId as string, template),
    enabled: open && !!ticketId,
  });

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith('blob:')) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    const iframe = document.getElementById('ticket-print-frame') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const options = (templates || []).map((t) => ({ value: t.id, label: `${t.id} - ${t.nome}` }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="max-w-4xl" title="Preview do Ticket">
      <div className="space-y-4">
        <div className="flex items-end gap-3">
          <Select
            label="Modelo de Ticket"
            options={
              options.length ? options : [{ value: 'TICKET002', label: 'TICKET002 - A4 2PF' }]
            }
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="max-w-md"
          />
          <div className="flex-1" />
          <Button variant="primary" onClick={handlePrint} disabled={!pdfUrl}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="secondary" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>

        <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[400px] overflow-hidden">
          {pdfUrl ? (
            <iframe
              id="ticket-print-frame"
              title="Ticket PDF"
              src={pdfUrl}
              className="w-full h-[600px] bg-white"
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-slate-400">
              Selecione um ticket para visualizar.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default TicketPreview;
