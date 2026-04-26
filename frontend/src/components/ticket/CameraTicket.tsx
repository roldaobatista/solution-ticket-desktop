'use client';

/**
 * Onda 5.1 — UI de captura de fotos do ticket.
 *
 * Suporta dois modos:
 *  1. Webcam local (navigator.mediaDevices.getUserMedia)
 *  2. IP camera via snapshot HTTP — usuario informa URL retornando JPEG/PNG
 *     (formato comum em camaras Hikvision/Dahua/Intelbras: /ISAPI/Streaming/.../picture).
 *
 * Backend (camera.controller.ts) ja existe e aceita base64.
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  excluirFoto,
  getFotoRawUrl,
  listarFotosTicket,
  uploadFoto,
  type FotoOrigem,
} from '@/lib/api/camera';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Trash2, Wifi, X } from 'lucide-react';

interface Props {
  ticketId: string;
  passagemId?: string;
}

type Modo = 'webcam' | 'ip';

function dataUrlFromCanvas(canvas: HTMLCanvasElement, quality = 0.85): string {
  return canvas.toDataURL('image/jpeg', quality);
}

export function CameraTicket({ ticketId, passagemId }: Props) {
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modo, setModo] = useState<Modo>('webcam');
  const [streamAtivo, setStreamAtivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ipUrl, setIpUrl] = useState('');
  const [previewIp, setPreviewIp] = useState<string | null>(null);

  const { data: fotos = [], isLoading } = useQuery({
    queryKey: ['fotos-ticket', ticketId],
    queryFn: () => listarFotosTicket(ticketId),
    enabled: !!ticketId,
  });

  const uploadMut = useMutation({
    mutationFn: ({ base64, origem }: { base64: string; origem: FotoOrigem }) =>
      uploadFoto(ticketId, base64, origem, passagemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fotos-ticket', ticketId] });
      setPreviewIp(null);
    },
    onError: (err) => setErro((err as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => excluirFoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fotos-ticket', ticketId] }),
  });

  // Inicia/encerra stream da webcam quando o modo muda
  useEffect(() => {
    if (modo !== 'webcam') {
      pararStream();
      return;
    }
    let mounted = true;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('navigator.mediaDevices.getUserMedia indisponivel neste ambiente');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setStreamAtivo(true);
        setErro(null);
      } catch (e) {
        setErro(`Falha ao acessar camera: ${(e as Error).message}`);
        setStreamAtivo(false);
      }
    })();
    return () => {
      mounted = false;
      pararStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  function pararStream() {
    const v = videoRef.current;
    const s = v?.srcObject as MediaStream | null;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
      v!.srcObject = null;
    }
    setStreamAtivo(false);
  }

  function capturarWebcam() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !streamAtivo) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const base64 = dataUrlFromCanvas(c);
    uploadMut.mutate({ base64, origem: 'WEBCAM' });
  }

  async function snapshotIp() {
    if (!ipUrl) return;
    setErro(null);
    try {
      // Fetch direto. Para camara HTTPS self-signed precisa whitelist no Electron.
      const res = await fetch(ipUrl, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewIp(result);
      };
      reader.onerror = () => setErro('Falha ao ler resposta da camera');
      reader.readAsDataURL(blob);
    } catch (e) {
      setErro(`Falha ao capturar IP camera: ${(e as Error).message}`);
    }
  }

  function enviarPreviewIp() {
    if (!previewIp) return;
    uploadMut.mutate({ base64: previewIp, origem: 'IP_CAMERA' });
  }

  return (
    <div className="space-y-4">
      {/* Seletor de modo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setModo('webcam')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm border ${
            modo === 'webcam'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-4 h-4" /> Webcam
        </button>
        <button
          type="button"
          onClick={() => setModo('ip')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm border ${
            modo === 'ip'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Wifi className="w-4 h-4" /> IP camera
        </button>
      </div>

      {erro && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Modo WEBCAM */}
      {modo === 'webcam' && (
        <div className="space-y-2">
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={capturarWebcam}
              disabled={!streamAtivo || uploadMut.isPending}
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploadMut.isPending ? 'Enviando...' : 'Capturar e anexar'}
            </Button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Modo IP CAMERA */}
      {modo === 'ip' && (
        <div className="space-y-2">
          <label className="text-sm text-slate-700">URL de snapshot (JPEG)</label>
          <input
            type="url"
            placeholder="http://192.168.1.50/ISAPI/Streaming/channels/1/picture"
            value={ipUrl}
            onChange={(e) => setIpUrl(e.target.value)}
            className="w-full text-sm border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={snapshotIp} disabled={!ipUrl}>
              <Wifi className="w-4 h-4 mr-2" /> Buscar snapshot
            </Button>
            {previewIp && (
              <Button variant="primary" onClick={enviarPreviewIp} disabled={uploadMut.isPending}>
                <Camera className="w-4 h-4 mr-2" />
                {uploadMut.isPending ? 'Enviando...' : 'Anexar ao ticket'}
              </Button>
            )}
          </div>
          {previewIp && (
            <div className="mt-2 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewIp}
                alt="Preview da camera IP"
                className="max-h-80 rounded border border-slate-200"
              />
              <button
                type="button"
                onClick={() => setPreviewIp(null)}
                aria-label="Descartar preview"
                className="absolute top-2 right-2 bg-white/90 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Galeria */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Fotos anexadas</h3>
        {isLoading && <div className="text-sm text-slate-500">Carregando...</div>}
        {!isLoading && fotos.length === 0 && (
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Nenhuma foto anexada.
          </div>
        )}
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {fotos.map((f) => (
            <li key={f.id} className="relative group border rounded overflow-hidden bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFotoRawUrl(f.id)}
                alt={`Foto ${f.id}`}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 flex justify-between">
                <span>{f.origem}</span>
                <span>{new Date(f.capturadoEm).toLocaleTimeString('pt-BR')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Remover esta foto?')) delMut.mutate(f.id);
                }}
                aria-label="Remover foto"
                className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CameraTicket;
