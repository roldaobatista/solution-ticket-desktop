'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  listarDocumentosTicket,
  uploadDocumentoTicket,
  excluirDocumentoTicket,
  getDocumentoDownloadUrl,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Upload, Paperclip } from 'lucide-react';

interface Props {
  ticketId: string;
}

export function DocumentosTicket({ ticketId }: Props) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);
  const [tipo, setTipo] = useState('ANEXO');

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documentos-ticket', ticketId],
    queryFn: () => listarDocumentosTicket(ticketId),
    enabled: !!ticketId,
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadDocumentoTicket(ticketId, file, tipo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos-ticket', ticketId] }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => excluirDocumentoTicket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos-ticket', ticketId] }),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => uploadMut.mutate(f));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-700">Tipo:</label>
        <select
          className="text-sm border rounded px-2 py-1"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="ANEXO">Anexo geral</option>
          <option value="NF">Nota Fiscal</option>
          <option value="CTE">CT-e</option>
          <option value="ROMANEIO">Romaneio</option>
          <option value="FOTO">Foto</option>
          <option value="OUTRO">Outro</option>
        </select>
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" /> Enviar
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-lg p-4 text-center text-sm ${drag ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}
      >
        Arraste arquivos aqui ou clique em &quot;Enviar&quot;.
      </div>

      {isLoading && <div className="text-sm text-slate-500">Carregando...</div>}
      {!isLoading && docs.length === 0 && (
        <div className="text-sm text-slate-500">Nenhum documento anexado.</div>
      )}

      <ul className="divide-y border rounded-lg bg-white">
        {docs.map((d) => (
          <li key={d.id} className="flex items-center gap-3 p-3">
            <Paperclip className="w-4 h-4 text-slate-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">{d.observacao || d.tipo}</div>
              <div className="text-xs text-slate-500">
                {d.tipo}
                {d.numero ? ` · ${d.numero}` : ''} · {new Date(d.criadoEm).toLocaleString('pt-BR')}
              </div>
            </div>
            <a
              href={getDocumentoDownloadUrl(d.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-800"
              title="Baixar"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                if (confirm('Excluir documento?')) delMut.mutate(d.id);
              }}
              className="text-red-600 hover:text-red-800"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DocumentosTicket;
