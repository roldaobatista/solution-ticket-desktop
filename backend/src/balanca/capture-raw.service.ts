import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Socket } from 'net';
import type { SerialConfig } from './presets';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SerialPort } = require('serialport');

const PARITY_MAP = { N: 'none', E: 'even', O: 'odd' } as const;

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

      const finalizar = () => {
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

      port.open((err: Error | null) => {
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
