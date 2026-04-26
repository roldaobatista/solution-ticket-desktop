import { EventEmitter } from 'events';

/**
 * Subset tipado da API do pacote `serialport`.
 * Permite mocking em testes sem dependência do binding nativo.
 */
export interface SerialPortLike {
  isOpen: boolean;
  open(cb: (err: Error | null) => void): void;
  close(cb?: () => void): void;
  on(event: 'data', listener: (chunk: Buffer) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'close', listener: () => void): this;
}

export interface AdapterConfig {
  // Serial
  porta?: string | null;
  baudrate?: number | null;
  databits?: number | null;
  stopbits?: number | null;
  parity?: string | null;
  flowControl?: string | null;
  // TCP
  enderecoIp?: string | null;
  portaTcp?: number | null;
  // Modbus
  modbusUnitId?: number | null;
  modbusRegister?: number | null;
  // Onda 3.1: extensoes Modbus para suportar diferentes firmwares.
  modbusFunction?: 'holding' | 'input' | null; // default 'holding'
  modbusByteOrder?: 'BE' | 'LE' | null; // ordem dos bytes dentro de cada word (default BE)
  modbusWordOrder?: 'BE' | 'LE' | null; // ordem das words (high-low/low-high) — default BE
  modbusSigned?: boolean | null; // interpretar como int32 signed (default false)
  modbusScale?: number | null; // multiplicador apos converter (default 1)
  modbusOffset?: number | null; // somado apos scale (default 0)
  // Timeouts / reconexão (opcionais — defaults aplicados pelos adapters)
  connectTimeoutMs?: number | null;
  readTimeoutMs?: number | null;
  keepAliveMs?: number | null;
  intervalMs?: number | null;
}

/**
 * Adaptador de transporte. Emite eventos:
 *   'data'          (Buffer) — bytes recebidos
 *   'error'         (Error)
 *   'close'                  — conexão encerrada (sem tentar reconectar)
 *   'reconectando'  (tentativa: number, delayMs: number) — wrapper vai tentar reabrir
 *   'reconectado'            — reabertura bem-sucedida
 */
export interface IBalancaAdapter extends EventEmitter {
  connect(): Promise<void>;
  close(): Promise<void>;
  isOpen(): boolean;
}
