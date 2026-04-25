import { EventEmitter } from 'events';
import { AdapterConfig, IBalancaAdapter } from './adapter.interface';

/**
 * Adaptador Modbus (RTU via serial ou TCP). Faz polling do registrador
 * configurado e emite o valor como string + \n (consumido pelo ModbusParser).
 */
export class ModbusAdapter extends EventEmitter implements IBalancaAdapter {
  private client: any = null;
  private timer: NodeJS.Timeout | null = null;
  private conectado = false;

  constructor(private config: AdapterConfig & { intervalMs?: number }) {
    super();
  }

  async connect(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ModbusRTU = require('modbus-serial');
    this.client = new ModbusRTU();
    if (this.config.enderecoIp && this.config.portaTcp) {
      await this.client.connectTCP(this.config.enderecoIp, { port: this.config.portaTcp });
    } else if (this.config.porta) {
      await this.client.connectRTUBuffered(this.config.porta, {
        baudRate: this.config.baudrate ?? 9600,
        dataBits: this.config.databits ?? 8,
        stopBits: this.config.stopbits ?? 1,
        parity: (this.config.parity ?? 'none') as any,
      });
    } else {
      throw new Error('Modbus: informe IP+porta ou porta serial');
    }
    this.client.setID(this.config.modbusUnitId ?? 1);
    this.conectado = true;

    const reg = this.config.modbusRegister ?? 0;
    const intervalMs = this.config.intervalMs ?? 500;
    this.timer = setInterval(async () => {
      try {
        const r = await this.client.readHoldingRegisters(reg, 2);
        // 32-bit big-endian por padrao
        const valor = (r.data[0] << 16) | r.data[1];
        this.emit('data', Buffer.from(`${valor}\n`, 'ascii'));
      } catch (err) {
        this.emit('error', err as Error);
      }
    }, intervalMs);
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.client) {
      try {
        await new Promise<void>((r) => this.client.close(() => r()));
      } catch {
        /* ignore */
      }
      this.client = null;
    }
    this.conectado = false;
  }

  isOpen(): boolean {
    return this.conectado;
  }
}
