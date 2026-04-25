import { Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SerialPort } = require('serialport');

interface Sessao {
  port: any;
  buffer: Buffer[];
  ultimaAtividade: number;
  config: { porta: string; baudrate: number; databits: number; parity: string; stopbits: number };
}

@Injectable()
export class SerialTerminalService implements OnModuleDestroy {
  private readonly logger = new Logger(SerialTerminalService.name);
  private sessoes = new Map<string, Sessao>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.limpaInativas(), 60000);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    for (const [id] of this.sessoes) {
      this.encerrar(id).catch(() => {});
    }
  }

  private limpaInativas() {
    const limite = Date.now() - 10 * 60 * 1000;
    for (const [id, s] of this.sessoes) {
      if (s.ultimaAtividade < limite) {
        this.logger.log(`Encerrando sessao inativa ${id}`);
        this.encerrar(id).catch(() => {});
      }
    }
  }

  async listarPortas() {
    try {
      const portas = await SerialPort.list();
      return portas.map((p: any) => ({
        path: p.path,
        manufacturer: p.manufacturer || null,
        serialNumber: p.serialNumber || null,
        pnpId: p.pnpId || null,
        vendorId: p.vendorId || null,
        productId: p.productId || null,
      }));
    } catch (err: any) {
      this.logger.error(`Erro listando portas: ${err.message}`);
      return [];
    }
  }

  async criarSessao(config: {
    porta: string;
    baudrate?: number;
    databits?: number;
    parity?: string;
    stopbits?: number;
  }) {
    const baudrate = Number(config.baudrate) || 9600;
    const databits = Number(config.databits) || 8;
    const stopbits = Number(config.stopbits) || 1;
    const parity = (config.parity || 'none') as 'none' | 'even' | 'odd';

    const sessionId = randomUUID();

    const port = new SerialPort({
      path: config.porta,
      baudRate: baudrate,
      dataBits: databits as any,
      stopBits: stopbits as any,
      parity,
      autoOpen: false,
    });

    await new Promise<void>((resolve, reject) => {
      port.open((err: any) => (err ? reject(err) : resolve()));
    });

    const sessao: Sessao = {
      port,
      buffer: [],
      ultimaAtividade: Date.now(),
      config: { porta: config.porta, baudrate, databits, parity, stopbits },
    };

    port.on('data', (data: Buffer) => {
      sessao.buffer.push(Buffer.from(data));
      sessao.ultimaAtividade = Date.now();
    });
    port.on('error', (err: any) => {
      this.logger.error(`[${sessionId}] serial error: ${err.message}`);
    });

    this.sessoes.set(sessionId, sessao);
    return { sessionId, config: sessao.config };
  }

  async enviar(sessionId: string, data: string, formato: 'ASCII' | 'HEX') {
    const s = this.sessoes.get(sessionId);
    if (!s) throw new NotFoundException('Sessao nao encontrada');
    let buf: Buffer;
    if (formato === 'HEX') {
      const clean = (data || '').replace(/[^0-9a-fA-F]/g, '');
      if (clean.length % 2 !== 0) throw new Error('HEX invalido (bytes impares)');
      buf = Buffer.from(clean, 'hex');
    } else {
      buf = Buffer.from(data || '', 'ascii');
    }
    await new Promise<void>((resolve, reject) => {
      s.port.write(buf, (err: any) => (err ? reject(err) : resolve()));
    });
    s.ultimaAtividade = Date.now();
    return { enviado: buf.length };
  }

  lerBuffer(sessionId: string) {
    const s = this.sessoes.get(sessionId);
    if (!s) throw new NotFoundException('Sessao nao encontrada');
    const all = Buffer.concat(s.buffer);
    s.buffer = [];
    s.ultimaAtividade = Date.now();
    return {
      ascii: all.toString('ascii'),
      hex: all
        .toString('hex')
        .toUpperCase()
        .replace(/(.{2})/g, '$1 ')
        .trim(),
      bytes: all.length,
    };
  }

  async encerrar(sessionId: string) {
    const s = this.sessoes.get(sessionId);
    if (!s) return { ok: true, inexistente: true };
    try {
      await new Promise<void>((resolve) => {
        try {
          s.port.close(() => resolve());
        } catch (err) {
          this.logger.debug(`Erro ao fechar porta serial: ${(err as Error).message}`);
          resolve();
        }
      });
    } catch (err) {
      this.logger.debug(`Falha encerrando sessão serial ${sessionId}: ${(err as Error).message}`);
    }
    this.sessoes.delete(sessionId);
    return { ok: true };
  }
}
