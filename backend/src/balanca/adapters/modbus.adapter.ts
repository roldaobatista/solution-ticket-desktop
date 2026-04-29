import { EventEmitter } from 'events';
import { AdapterConfig, IBalancaAdapter } from './adapter.interface';
import type { ModbusClient, ModbusClientCtor } from './modbus.types';

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
  private client: ModbusClient | null = null;
  private conectado = false;
  private loopAtivo = false;
  private sleepTimer: NodeJS.Timeout | null = null;
  private sleepResolver: (() => void) | null = null;

  constructor(private config: AdapterConfig) {
    super();
  }

  async connect(): Promise<void> {
    let ModbusRTU: ModbusClientCtor;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ModbusRTU = require('modbus-serial') as ModbusClientCtor;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Falha ao carregar modbus-serial: ${msg}`);
    }

    this.client = new ModbusRTU();
    const readTimeout = this.config.readTimeoutMs ?? 1000;
    const parityMap: Record<string, 'none' | 'even' | 'odd' | 'mark' | 'space'> = {
      n: 'none',
      none: 'none',
      e: 'even',
      even: 'even',
      o: 'odd',
      odd: 'odd',
      mark: 'mark',
      space: 'space',
    };
    const parityValido = parityMap[(this.config.parity ?? 'none').toLowerCase()] ?? 'none';

    if (this.config.enderecoIp && this.config.portaTcp) {
      await this.client.connectTCP(this.config.enderecoIp, { port: this.config.portaTcp });
    } else if (this.config.porta) {
      await this.client.connectRTUBuffered(this.config.porta, {
        baudRate: this.config.baudrate ?? 9600,
        dataBits: this.config.databits ?? 8,
        stopBits: this.config.stopbits ?? 1,
        parity: parityValido,
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
    // Onda 3.1: parametros configuraveis por balanca/indicador.
    const funcao = this.config.modbusFunction ?? 'holding';
    const byteOrder = this.config.modbusByteOrder ?? 'BE';
    const wordOrder = this.config.modbusWordOrder ?? 'BE';
    const signed = this.config.modbusSigned ?? false;
    const scale = this.config.modbusScale ?? 1;
    const offset = this.config.modbusOffset ?? 0;

    while (this.loopAtivo && this.conectado) {
      try {
        if (!this.client) break;
        const r =
          funcao === 'input'
            ? await this.client.readInputRegisters(reg, 2)
            : await this.client.readHoldingRegisters(reg, 2);
        const valor = this.decodificar32bit(r.data, byteOrder, wordOrder, signed) * scale + offset;
        this.emit('data', Buffer.from(`${valor}\n`, 'ascii'));
      } catch (err) {
        // Contexto estruturado facilita diagnóstico em campo.
        const msg = err instanceof Error ? err.message : String(err);
        const e = new Error(`Modbus read falhou (reg=${reg} unit=${unit}): ${msg}`);
        (e as Error & { cause?: unknown }).cause = err;
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

  /**
   * Onda 3.1: decodifica 2 registradores de 16-bit em valor 32-bit, respeitando
   * byteOrder (dentro de cada word), wordOrder (entre words) e signed.
   *
   * Combinações comuns no campo:
   *   - 'BE' + 'BE' (default): high-low, big-endian — ex: indicadores Toledo/Filizola
   *   - 'BE' + 'LE': low-high, big-endian — ex: alguns Modbus chineses
   *   - 'LE' + 'BE': swap dentro da word, high-low das words — ex: padrão CDAB
   *   - 'LE' + 'LE': BADC swap completo — ex: alguns SCADA antigos
   */
  private decodificar32bit(
    data: number[],
    byteOrder: 'BE' | 'LE',
    wordOrder: 'BE' | 'LE',
    signed: boolean,
  ): number {
    // Cada item de data e um word de 16 bits. Aplica byte-swap dentro do word se LE.
    const w0 = byteOrder === 'LE' ? this.swapBytes16(data[0]) : data[0];
    const w1 = byteOrder === 'LE' ? this.swapBytes16(data[1]) : data[1];
    // Combina words. wordOrder=BE => high=w0, low=w1; LE => high=w1, low=w0.
    const high = wordOrder === 'BE' ? w0 : w1;
    const low = wordOrder === 'BE' ? w1 : w0;
    const u32 = (((high & 0xffff) << 16) >>> 0) | (low & 0xffff);
    if (signed && u32 >= 0x80000000) {
      return u32 - 0x1_0000_0000;
    }
    return u32;
  }

  private swapBytes16(w: number): number {
    return (((w & 0xff) << 8) | ((w >> 8) & 0xff)) & 0xffff;
  }

  private ehErroFatal(err: unknown): boolean {
    // RC3: prioriza err.code (estavel entre versoes) sobre string match
    const e = err as { code?: unknown; errno?: unknown; message?: unknown } | null | undefined;
    const code = e?.code ?? e?.errno;
    if (typeof code === 'string') {
      const fatais = new Set([
        'ECONNRESET',
        'ECONNREFUSED',
        'EPIPE',
        'ETIMEDOUT',
        'EHOSTUNREACH',
        'ENOTCONN',
        'ENETDOWN',
      ]);
      if (fatais.has(code)) return true;
    }
    // Fallback string match para erros nao-Node (modbus-serial throws com mensagem)
    const msg = String(e?.message ?? err).toLowerCase();
    return (
      msg.includes('port is not open') ||
      msg.includes('port closed') ||
      msg.includes('socket') ||
      msg.includes('timed out') ||
      msg.includes('timeout')
    );
  }

  /** RC6: sleep cancelavel — close() interrompe sem esperar o tick. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.sleepResolver = resolve;
      this.sleepTimer = setTimeout(() => {
        this.sleepTimer = null;
        this.sleepResolver = null;
        resolve();
      }, ms);
    });
  }

  async close(): Promise<void> {
    this.loopAtivo = false;
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
    if (this.sleepResolver) {
      this.sleepResolver();
      this.sleepResolver = null;
    }
    if (this.client) {
      try {
        const c = this.client;
        await new Promise<void>((r) => c.close(() => r()));
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
