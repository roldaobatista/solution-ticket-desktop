import { EventEmitter } from 'events';
import type { SerialPort as SerialPortType } from 'serialport';
import { AdapterConfig, IBalancaAdapter } from './adapter.interface';

/**
 * Adaptador Serial (RS-232/485) usando o pacote `serialport`.
 * O require é feito dentro do connect() para não falhar no build em ambientes
 * sem binding nativo. Hardening (C6, C12 da auditoria):
 *  - try/catch no require com mensagem acionável
 *  - parityMap completo (none/even/odd/mark/space)
 */
export class SerialAdapter extends EventEmitter implements IBalancaAdapter {
  private port: SerialPortType | null = null;

  constructor(private config: AdapterConfig) {
    super();
  }

  async connect(): Promise<void> {
    if (!this.config.porta) {
      throw new Error('Porta serial nao configurada');
    }

    let SerialPort: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      SerialPort = require('serialport').SerialPort;
    } catch (e: any) {
      throw new Error(
        'Falha ao carregar driver serial (serialport). ' +
          'Rode "pnpm --filter ./electron rebuild-native" ou instale o driver CH340. ' +
          `Detalhe: ${e?.message ?? e}`,
      );
    }

    const parityMap: Record<string, 'none' | 'even' | 'odd' | 'mark' | 'space'> = {
      none: 'none',
      even: 'even',
      odd: 'odd',
      mark: 'mark',
      space: 'space',
    };

    this.port = new SerialPort({
      path: this.config.porta,
      baudRate: this.config.baudrate ?? 9600,
      dataBits: (this.config.databits ?? 8) as 5 | 6 | 7 | 8,
      stopBits: (this.config.stopbits ?? 1) as 1 | 1.5 | 2,
      parity: parityMap[(this.config.parity ?? 'none').toLowerCase()] ?? 'none',
      rtscts: (this.config.flowControl ?? 'none').toLowerCase() === 'hardware',
      xon: (this.config.flowControl ?? 'none').toLowerCase() === 'software',
      xoff: (this.config.flowControl ?? 'none').toLowerCase() === 'software',
      autoOpen: false,
    });

    await new Promise<void>((resolve, reject) => {
      this.port!.open((err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });

    this.port.on('data', (chunk: Buffer) => this.emit('data', chunk));
    this.port.on('error', (err: Error) => this.emit('error', err));
    this.port.on('close', () => this.emit('close'));
  }

  async close(): Promise<void> {
    if (!this.port) return;
    await new Promise<void>((resolve) => {
      this.port!.close(() => resolve());
    });
    this.port = null;
  }

  isOpen(): boolean {
    return !!this.port && (this.port as any).isOpen === true;
  }
}
