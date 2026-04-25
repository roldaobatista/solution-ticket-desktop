'use client';

import { useEffect, useRef, useState } from 'react';
import {
  listarPortasSeriais,
  abrirSessaoSerial,
  enviarSerial,
  lerBufferSerial,
  encerrarSessaoSerial,
  type SerialPortInfo,
} from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function TerminalSerialPage() {
  const [portas, setPortas] = useState<SerialPortInfo[]>([]);
  const [porta, setPorta] = useState('');
  const [baudrate, setBaudrate] = useState(9600);
  const [databits, setDatabits] = useState(8);
  const [parity, setParity] = useState('none');
  const [stopbits, setStopbits] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recebidoAscii, setRecebidoAscii] = useState('');
  const [recebidoHex, setRecebidoHex] = useState('');
  const [modoExibicao, setModoExibicao] = useState<'ASCII' | 'HEX'>('ASCII');
  const [envio, setEnvio] = useState('');
  const [formatoEnvio, setFormatoEnvio] = useState<'ASCII' | 'HEX'>('ASCII');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const carregarPortas = async () => {
    try {
      const list = await listarPortasSeriais();
      setPortas(list);
      if (list.length > 0 && !porta) setPorta(list[0].path);
    } catch (e: any) {
      setErro(e?.message || 'Erro listando portas');
    }
  };

  useEffect(() => {
    carregarPortas();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (sessionId) encerrarSessaoSerial(sessionId).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    const tick = async () => {
      try {
        const buf = await lerBufferSerial(sessionId);
        if (buf.bytes > 0) {
          setRecebidoAscii((prev) => prev + buf.ascii);
          setRecebidoHex((prev) => (prev ? prev + ' ' : '') + buf.hex);
        }
      } catch (e: any) {
        setErro(e?.response?.data?.message || e?.message || 'Erro lendo buffer');
      }
    };
    pollingRef.current = setInterval(tick, 500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId]);

  const conectar = async () => {
    if (!porta) return;
    setErro(null);
    setCarregando(true);
    try {
      const res = await abrirSessaoSerial({ porta, baudrate, databits, parity, stopbits });
      setSessionId(res.sessionId);
    } catch (e: any) {
      setErro(e?.response?.data?.message || e?.message || 'Erro ao conectar');
    } finally {
      setCarregando(false);
    }
  };

  const desconectar = async () => {
    if (!sessionId) return;
    try {
      await encerrarSessaoSerial(sessionId);
    } catch {}
    setSessionId(null);
  };

  const enviar = async () => {
    if (!sessionId || !envio) return;
    try {
      await enviarSerial(sessionId, envio, formatoEnvio);
      setEnvio('');
    } catch (e: any) {
      setErro(e?.response?.data?.message || e?.message || 'Erro ao enviar');
    }
  };

  const limpar = () => {
    setRecebidoAscii('');
    setRecebidoHex('');
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Terminal Serial</h1>
        <Button variant="secondary" onClick={carregarPortas} disabled={!!sessionId}>
          Atualizar portas
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Porta</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={porta}
            onChange={(e) => setPorta(e.target.value)}
            disabled={!!sessionId}
          >
            <option value="">(selecione)</option>
            {portas.map((p) => (
              <option key={p.path} value={p.path}>
                {p.path} {p.manufacturer ? `- ${p.manufacturer}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Baudrate</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={baudrate}
            onChange={(e) => setBaudrate(Number(e.target.value))}
            disabled={!!sessionId}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Data bits</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={databits}
            onChange={(e) => setDatabits(Number(e.target.value))}
            disabled={!!sessionId}
          >
            <option value={7}>7</option>
            <option value={8}>8</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Parity</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={parity}
            onChange={(e) => setParity(e.target.value)}
            disabled={!!sessionId}
          >
            <option value="none">none</option>
            <option value="even">even</option>
            <option value="odd">odd</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Stop bits</label>
          <select
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
            value={stopbits}
            onChange={(e) => setStopbits(Number(e.target.value))}
            disabled={!!sessionId}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
        <div className="flex items-end">
          {!sessionId ? (
            <Button onClick={conectar} disabled={!porta || carregando} className="w-full">
              Conectar
            </Button>
          ) : (
            <Button variant="secondary" onClick={desconectar} className="w-full">
              Desconectar
            </Button>
          )}
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Recebido</span>
            <select
              className="border border-slate-300 rounded px-2 py-1 text-xs"
              value={modoExibicao}
              onChange={(e) => setModoExibicao(e.target.value as any)}
            >
              <option value="ASCII">ASCII</option>
              <option value="HEX">HEX</option>
            </select>
            <span className={`text-xs ${sessionId ? 'text-emerald-600' : 'text-slate-400'}`}>
              {sessionId ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={limpar}>
            Limpar
          </Button>
        </div>
        <textarea
          readOnly
          className="w-full h-64 font-mono text-xs border border-slate-200 rounded p-2 bg-slate-50"
          value={modoExibicao === 'ASCII' ? recebidoAscii : recebidoHex}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Enviar</label>
        <div className="flex gap-2">
          <select
            className="border border-slate-300 rounded px-2 py-2 text-sm"
            value={formatoEnvio}
            onChange={(e) => setFormatoEnvio(e.target.value as any)}
          >
            <option value="ASCII">ASCII</option>
            <option value="HEX">HEX</option>
          </select>
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm font-mono"
            placeholder={formatoEnvio === 'HEX' ? '02 41 42 03' : 'comando'}
            value={envio}
            onChange={(e) => setEnvio(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            disabled={!sessionId}
          />
          <Button onClick={enviar} disabled={!sessionId || !envio}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
