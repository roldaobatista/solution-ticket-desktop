import { createAdapter } from './adapter.factory';
import { ReconnectingAdapter } from './reconnecting.adapter';
import { TcpAdapter } from './tcp.adapter';
import { SerialAdapter } from './serial.adapter';
import { ModbusAdapter } from './modbus.adapter';

describe('createAdapter', () => {
  it('envolve com ReconnectingAdapter por padrao', () => {
    const ad = createAdapter('tcp', { enderecoIp: '127.0.0.1', portaTcp: 1 });
    expect(ad).toBeInstanceOf(ReconnectingAdapter);
  });

  it('retorna inner puro quando autoReconnect=false (para test/capture)', () => {
    const ad = createAdapter(
      'tcp',
      { enderecoIp: '127.0.0.1', portaTcp: 1 },
      { autoReconnect: false },
    );
    expect(ad).toBeInstanceOf(TcpAdapter);
  });

  it('mapeia sinonimos de protocolo serial', () => {
    const a1 = createAdapter('serial', {}, { autoReconnect: false });
    const a2 = createAdapter('rs232', {}, { autoReconnect: false });
    const a3 = createAdapter('rs485', {}, { autoReconnect: false });
    expect(a1).toBeInstanceOf(SerialAdapter);
    expect(a2).toBeInstanceOf(SerialAdapter);
    expect(a3).toBeInstanceOf(SerialAdapter);
  });

  it('mapeia sinonimos de tcp/ethernet', () => {
    const a1 = createAdapter('tcp', {}, { autoReconnect: false });
    const a2 = createAdapter('tcpip', {}, { autoReconnect: false });
    const a3 = createAdapter('ethernet', {}, { autoReconnect: false });
    expect(a1).toBeInstanceOf(TcpAdapter);
    expect(a2).toBeInstanceOf(TcpAdapter);
    expect(a3).toBeInstanceOf(TcpAdapter);
  });

  it('mapeia modbus', () => {
    const a1 = createAdapter('modbus', {}, { autoReconnect: false });
    const a2 = createAdapter('modbus-rtu', {}, { autoReconnect: false });
    const a3 = createAdapter('modbus-tcp', {}, { autoReconnect: false });
    expect(a1).toBeInstanceOf(ModbusAdapter);
    expect(a2).toBeInstanceOf(ModbusAdapter);
    expect(a3).toBeInstanceOf(ModbusAdapter);
  });
});
