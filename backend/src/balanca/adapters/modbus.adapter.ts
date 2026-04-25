import { EventEmitter } from 'events';
import { AdapterConfig, IBalancaAdapter } from './adapter.interface';

/**
 * Adaptador Modbus (RTU via serial ou TCP). Faz polling do registrador
 * configurado e emite o valor como string + \n (consumido pelo ModbusParser).
 *
 * Hardening (C4, C5, C13 da auditoria):
 *  - Loop async com await + sleep (sem setInterval) — elimina sobreposição em RS-485
 *  - client.setTimeout(readTimeoutMs) — evita travar barramento
 *  - try/catch em cada leitura; emite 'error' estruturado com contexto (reg, unit)
 */
export class ModbusAdapter extends EventEmitter implements IBalancaAdapter {
  private client: any = null;
  private conectado = false;
  private loopAtivo = false;

  constructor(private config: AdapterConfig) {
    super();
  }

  async connect(): Promise<void> {
    let ModbusRTU: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ModbusRTU = require('modbus-serial');
    } catch (e: any) {
      throw new Error(`Falha ao carregar modbus-serial: ${e?.message ?? e}`);
    }

    this.client = new ModbusRTU();
    const readTimeout = this.config.readTimeoutMs ?? 1000;

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
    if (typeof this.client.setTimeout === 'function') {
      this.client.setTimeout(readTimeout);
    }
    this.conectado = true;
    this.loopAtivo = true;

    // Loop async com back-pressure — nunca sobrepõe leituras.
    void this.pollLoop();
  }

  private async pollLoop(): Promise<void> {
    const reg = this.config.modbusRegister ?? 0;
    const unit = this.config.modbusUnitId ?? 1;
    const intervalMs = this.config.intervalMs ?? 500;

    while (this.loopAtivo && this.conectado) {
      try {
        const r = await this.client.readHoldingRegisters(reg, 2);
        // 32-bit big-endian por padrao
        const valor = (r.data[0] << 16) | r.data[1];
        this.emit('data', Buffer.from(`${valor}\n`, 'ascii'));
      } catch (err: any) {
        // Contexto estruturado facilita diagnóstico em campo.
        const e = new Error(`Modbus read falhou (reg=${reg} unit=${unit}): ${err?.message ?? err}`);
        (e as any).cause = err;
        this.emit('error', e);
        // Se for erro de conexão, interromper loop e sinalizar close para o decorator reconectar.
        if (this.ehErroFatal(err)) {
          this.loopAtivo = false;
          this.conectado = false;
          this.emit('close');
          return;
        }
      }
      await this.sleep(intervalMs);
    }
  }

  private ehErroFatal(err: any): boolean {
    const msg = String(err?.message ?? err).toLowerCase();
    return (
      msg.includes('port is not open') ||
      msg.includes('socket') ||
      msg.includes('econn') ||
      msg.includes('timed out') ||
      msg.includes('timeout')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  async close(): Promise<void> {
    this.loopAtivo = false;
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
