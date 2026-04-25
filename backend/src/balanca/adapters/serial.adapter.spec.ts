import { EventEmitter } from 'events';
import { SerialAdapter } from './serial.adapter';
import { SerialPortLike } from './adapter.interface';

/**
 * Mock do pacote `serialport` — emula a API SerialPort com EventEmitter.
 * Permite testar lifecycle do SerialAdapter sem driver nativo.
 */
class MockSerialPort extends EventEmitter implements SerialPortLike {
  public isOpen = false;
  public lastConfig: Record<string, unknown>;
  static failOpen = false;
  static lastInstance: MockSerialPort | null = null;

  constructor(opts: Record<string, unknown>) {
    super();
    MockSerialPort.lastInstance = this;
    this.lastConfig = opts;
  }
  open(cb: (err: Error | null) => void) {
    if (MockSerialPort.failOpen) {
      cb(new Error('access denied'));
      return;
    }
    this.isOpen = true;
    cb(null);
  }
  close(cb?: () => void) {
    this.isOpen = false;
    cb?.();
  }
}

jest.mock('serialport', () => ({
  SerialPort: jest
    .fn()
    .mockImplementation((opts: Record<string, unknown>) => new MockSerialPort(opts)),
}));

describe('SerialAdapter', () => {
  beforeEach(() => {
    MockSerialPort.lastInstance = null;
    MockSerialPort.failOpen = false;
  });

  it('conecta com config serial padrao', async () => {
    const adapter = new SerialAdapter({
      porta: 'COM1',
      baudrate: 9600,
      parity: 'N',
      databits: 8,
      stopbits: 1,
    });
    await adapter.connect();
    expect(adapter.isOpen()).toBe(true);
    expect(MockSerialPort.lastInstance?.lastConfig).toMatchObject({
      path: 'COM1',
      baudRate: 9600,
      parity: 'none',
      dataBits: 8,
      stopBits: 1,
      autoOpen: false,
    });
  });

  it('fecha conexao e limpa estado', async () => {
    const adapter = new SerialAdapter({ porta: 'COM1' });
    await adapter.connect();
    await adapter.close();
    expect(adapter.isOpen()).toBe(false);
  });

  it('emite data quando mock emite data', async () => {
    const adapter = new SerialAdapter({ porta: 'COM1' });
    const spy = jest.fn();
    adapter.on('data', spy);
    await adapter.connect();
    MockSerialPort.lastInstance?.emit('data', Buffer.from('12345'));
    expect(spy).toHaveBeenCalledWith(Buffer.from('12345'));
  });

  it('propaga erro de abertura', async () => {
    MockSerialPort.failOpen = true;
    const adapter = new SerialAdapter({ porta: 'COM1' });
    await expect(adapter.connect()).rejects.toThrow('access denied');
  });
});
