import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { isIP, Socket } from 'net';
import type { SerialConfig } from './presets';

// Onda 3.2: lazy require de serialport — antes era top-level e quebrava
// o boot do Nest se o binding nativo nao estivesse presente (cenario comum
// em CI sem prebuilts ou em maquina sem permissao para carregar a DLL).
type SerialPortCtor = new (opts: Record<string, unknown>) => SerialPortLike;

interface SerialPortLike {
  isOpen: boolean;
  open(cb: (err: Error | null) => void): void;
  close(cb?: () => void): void;
  write(data: Buffer, cb?: (err?: Error | null) => void): void;
  on(event: 'data', listener: (chunk: Buffer) => void): SerialPortLike;
  on(event: 'error', listener: (err: Error) => void): SerialPortLike;
  removeAllListeners(): SerialPortLike;
}

function getSerialPortCtor(): SerialPortCtor {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('serialport') as { SerialPort: SerialPortCtor };
    return mod.SerialPort;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new BadRequestException(`Modulo serialport indisponivel: ${msg}`);
  }
}

// Onda 3.2: timeout no port.open para nao pendurar Promise se a porta
// nao responder. 5s e suficiente — porta valida abre em ~50ms.
const PORT_OPEN_TIMEOUT_MS = 5000;

const PARITY_MAP = { N: 'none', E: 'even', O: 'odd' } as const;
const PORTAS_TCP_PERMITIDAS = new Set([23, 502, 4001, 8000, 9999, 10001]);

function isPrivateIpv4(host: string): boolean {
  if (isIP(host) !== 4) return false;
  const [a, b] = host.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export interface CaptureRequest {
  protocolo: 'serial' | 'tcp';
  /** Serial: nome da porta (COM3, /dev/ttyUSB0). TCP: 'host:porta' (192.168.1.50:4001). */
  endereco: string;
  serial?: SerialConfig;
  /** Tempo de captura em ms. Default 2000. Limite 5000. */
  durationMs?: number;
  /** Trigger ENQ (0x05) opcional para protocolos request/response (Toledo C, Filizola @). */
  enviarEnq?: boolean;
}

export interface CaptureResponse {
  bytes: string; // hex
  count: number;
  durationMs: number;
}

/**
 * Abre serial ou TCP temporariamente, captura N ms de bytes brutos e fecha.
 * Saída em hex para alimentar AutoDetectService ou exibir na UI.
 */
@Injectable()
export class CaptureRawService {
  private readonly logger = new Logger(CaptureRawService.name);

  async capturar(req: CaptureRequest): Promise<CaptureResponse> {
    const dur = Math.min(Math.max(req.durationMs ?? 2000, 200), 5000);
    if (req.protocolo === 'serial') return this.capturarSerial(req, dur);
    if (req.protocolo === 'tcp') return this.capturarTcp(req, dur);
    throw new BadRequestException(`Protocolo não suportado para capture-raw: ${req.protocolo}`);
  }

  private async capturarSerial(req: CaptureRequest, durationMs: number): Promise<CaptureResponse> {
    if (!req.serial) throw new BadRequestException('serial config obrigatória.');
    const cfg = req.serial;
    const SerialPort = getSerialPortCtor();
    const port = new SerialPort({
      path: req.endereco,
      baudRate: cfg.baudRate,
      dataBits: cfg.dataBits,
      parity: PARITY_MAP[cfg.parity] ?? 'none',
      stopBits: cfg.stopBits,
      autoOpen: false,
    });

    return new Promise<CaptureResponse>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const start = Date.now();
      let finalizou = false;

      const finalizar = () => {
        if (finalizou) return;
        finalizou = true;
        try {
          port.removeAllListeners();
          if (port.isOpen) port.close(() => {});
        } catch (e) {
          this.logger.debug(`fechar serial: ${(e as Error).message}`);
        }
        const buffer = Buffer.concat(chunks);
        resolve({
          bytes: buffer.toString('hex'),
          count: buffer.length,
          durationMs: Date.now() - start,
        });
      };

      // Onda 3.2: timeout no open evita Promise pendurada quando porta
      // nao responde (driver travado, porta inexistente sem erro imediato).
      const openTimeout = setTimeout(() => {
        if (!port.isOpen) {
          try {
            port.removeAllListeners();
          } catch {}
          reject(
            new BadRequestException(`Timeout abrindo ${req.endereco} (${PORT_OPEN_TIMEOUT_MS}ms)`),
          );
        }
      }, PORT_OPEN_TIMEOUT_MS);

      port.open((err: Error | null) => {
        clearTimeout(openTimeout);
        if (err)
          return reject(new BadRequestException(`Falha abrindo ${req.endereco}: ${err.message}`));

        port.on('data', (chunk: Buffer) => chunks.push(chunk));
        port.on('error', (e: Error) => this.logger.warn(`serial err: ${e.message}`));

        if (req.enviarEnq) {
          port.write(Buffer.from([0x05]), (werr?: Error | null) => {
            if (werr) this.logger.warn(`falha enviar ENQ: ${werr.message}`);
          });
        }

        setTimeout(finalizar, durationMs);
      });
    });
  }

  private async capturarTcp(req: CaptureRequest, durationMs: number): Promise<CaptureResponse> {
    const m = req.endereco.match(/^([^:]+):(\d+)$/);
    if (!m) throw new BadRequestException('TCP: use host:porta (ex: 192.168.1.50:4001)');
    const [, host, portaStr] = m;
    const porta = Number(portaStr);
    if (!isPrivateIpv4(host)) {
      throw new BadRequestException('TCP: host deve ser IPv4 privado da rede da unidade');
    }
    if (!PORTAS_TCP_PERMITIDAS.has(porta)) {
      throw new BadRequestException(`TCP: porta ${porta} nao permitida para captura de balanca`);
    }

    return new Promise<CaptureResponse>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const start = Date.now();
      const sock = new Socket();
      sock.setTimeout(durationMs + 1000);

      const finalizar = () => {
        try {
          sock.removeAllListeners();
          sock.destroy();
        } catch {
          /* ignore */
        }
        const buffer = Buffer.concat(chunks);
        resolve({
          bytes: buffer.toString('hex'),
          count: buffer.length,
          durationMs: Date.now() - start,
        });
      };

      sock.on('data', (chunk) => chunks.push(chunk));
      sock.on('error', (e) =>
        reject(new BadRequestException(`TCP ${host}:${porta}: ${e.message}`)),
      );
      sock.on('timeout', finalizar);

      sock.connect(porta, host, () => {
        if (req.enviarEnq) sock.write(Buffer.from([0x05]));
        setTimeout(finalizar, durationMs);
      });
    });
  }
}
