import { AdapterConfig, IBalancaAdapter } from './adapter.interface';
import { SerialAdapter } from './serial.adapter';
import { TcpAdapter } from './tcp.adapter';
import { ModbusAdapter } from './modbus.adapter';
import { ReconnectingAdapter, ReconnectOptions } from './reconnecting.adapter';

export interface CreateAdapterOptions {
  /** Envelopar com reconexão automática. Default: true. */
  autoReconnect?: boolean;
  reconnect?: ReconnectOptions;
}

function criarInner(protocolo: string, config: AdapterConfig): IBalancaAdapter {
  const p = (protocolo ?? 'serial').toLowerCase();
  switch (p) {
    case 'tcp':
    case 'tcpip':
    case 'tcp/ip':
    case 'ethernet':
      return new TcpAdapter(config);
    case 'modbus':
    case 'modbus-rtu':
    case 'modbus-tcp':
      return new ModbusAdapter(config);
    case 'serial':
    case 'rs232':
    case 'rs485':
    default:
      return new SerialAdapter(config);
  }
}

export function createAdapter(
  protocolo: string,
  config: AdapterConfig,
  opts: CreateAdapterOptions = {},
): IBalancaAdapter {
  const inner = criarInner(protocolo, config);
  if (opts.autoReconnect === false) return inner;
  return new ReconnectingAdapter(inner, opts.reconnect ?? {});
}
