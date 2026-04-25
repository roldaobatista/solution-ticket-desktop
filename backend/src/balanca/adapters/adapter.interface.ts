import { EventEmitter } from 'events';

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
