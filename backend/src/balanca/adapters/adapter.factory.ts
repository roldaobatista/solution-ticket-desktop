import { AdapterConfig, IBalancaAdapter } from './adapter.interface';
import { SerialAdapter } from './serial.adapter';
import { TcpAdapter } from './tcp.adapter';
import { ModbusAdapter } from './modbus.adapter';

export function createAdapter(protocolo: string, config: AdapterConfig): IBalancaAdapter {
  const p = (protocolo ?? 'serial').toLowerCase();
  switch (p) {
    case 'tcp':
    case 'tcpip':
    case 'tcp/ip':
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
