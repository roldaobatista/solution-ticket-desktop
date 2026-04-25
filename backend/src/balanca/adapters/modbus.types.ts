/**
 * Tipagem mínima de `modbus-serial` (RC5) — cobre só os métodos que o
 * adapter usa. A lib não publica @types e tipá-la inteira é extenso;
 * esta interface elimina a maior parte dos `any` no adapter.
 */
export interface ModbusRtuOptions {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
}

export interface ModbusReadResult {
  data: number[];
  buffer?: Buffer;
}

export interface ModbusClient {
  setID(id: number): void;
  setTimeout?(ms: number): void;
  connectTCP(host: string, opts: { port: number }): Promise<void>;
  connectRTUBuffered(porta: string, cfg: ModbusRtuOptions): Promise<void>;
  readHoldingRegisters(reg: number, length: number): Promise<ModbusReadResult>;
  close(cb: (err?: Error | null) => void): void;
}

export type ModbusClientCtor = new () => ModbusClient;
