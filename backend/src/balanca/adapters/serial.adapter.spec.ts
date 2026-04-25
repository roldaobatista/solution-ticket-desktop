import { EventEmitter } from 'events';
import { SerialAdapter } from './serial.adapter';

/**
 * Mock do pacote `serialport` — emula a API SerialPort com EventEmitter.
 * Permite testar lifecycle do SerialAdapter sem driver nativo.
 */
class MockSerialPort extends EventEmitter {
  public isOpen = false;
  public lastConfig: any;

  constructor(opts: any) {
    super();
    MockSerialPort.lastInstance = this;
    this.lastConfig = opts;
  }
  open(cb: (err: Error | null) => void) {
    if ((MockSerialPort as any).failOpen) {
      cb(new Error('access denied'));
      return;
    }
    this.isOpen = true;
    cb(null);
  }
  close(cb: () => void) {
    this.isOpen = false;
    cb();
  }
  static lastInstance: MockSerialPort | null = null;
}

jest.mock('serialport', () => ({
  SerialPort: jest.fn().mockImplementation((opts: any) => new MockSerialPort(opts)),
}));

describe('SerialAdapter', () => {
  beforeEach(() => {
    MockSerialPort.lastInstance = null;
    (MockSerialPort as any).failOpen = false;
  });

  it('rejeita se porta nao configurada', async () => {
    const ad = new SerialAdapter({ porta: null });
    await expect(ad.connect()).rejects.toThrow(/porta serial/i);
  });

  it('abre porta e propaga data', async () => {
    const ad = new SerialAdapter({
      porta: 'COM3',
      baudrate: 9600,
      databits: 8,
      stopbits: 1,
      parity: 'none',
    });
    await ad.connect();
    expect(ad.isOpen()).toBe(true);

    const port = MockSerialPort.lastInstance!;
    expect(port.lastConfig.path).toBe('COM3');
    expect(port.lastConfig.baudRate).toBe(9600);

    const recebido = new Promise<Buffer>((resolve) => ad.on('data', resolve));
    port.emit('data', Buffer.from('peso: 1234\n'));
    expect((await recebido).toString()).toContain('1234');
    await ad.close();
  });

  it('mapeia parity mark/space (C12)', async () => {
    for (const p of ['mark', 'space', 'even', 'odd', 'none'] as const) {
      const ad = new SerialAdapter({ porta: 'COM4', parity: p });
      await ad.connect();
      expect(MockSerialPort.lastInstance!.lastConfig.parity).toBe(p);
      await ad.close();
    }
  });

  it('propaga error e close do port subjacente', async () => {
    const ad = new SerialAdapter({ porta: 'COM5' });
    await ad.connect();
    const port = MockSerialPort.lastInstance!;

    const onErr = new Promise<Error>((resolve) => ad.on('error', resolve));
    const onClose = new Promise<void>((resolve) => ad.on('close', () => resolve()));
    port.emit('error', new Error('cabo desconectado'));
    port.emit('close');
    expect((await onErr).message).toBe('cabo desconectado');
    await onClose;
  });

  it('propaga falha de open com mensagem original', async () => {
    (MockSerialPort as any).failOpen = true;
    const ad = new SerialAdapter({ porta: 'COM6' });
    await expect(ad.connect()).rejects.toThrow(/access denied/);
  });
});
