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
}

/**
 * Adaptador de transporte. Emite eventos:
 *   'data'  (Buffer) — bytes recebidos
 *   'error' (Error)
 *   'close'
 */
export interface IBalancaAdapter extends EventEmitter {
  connect(): Promise<void>;
  close(): Promise<void>;
  isOpen(): boolean;
}
