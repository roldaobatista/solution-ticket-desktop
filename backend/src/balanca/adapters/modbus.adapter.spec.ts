import { ModbusAdapter } from './modbus.adapter';

/** Mock do client modbus-serial. */
class MockModbusClient {
  public id = 0;
  public timeoutMs = 0;
  public closed = false;
  public connectTcpCalls: Array<{ host: string; port: number }> = [];
  public connectRtuCalls: Array<{ porta: string; cfg: any }> = [];
  public reads: Array<{ reg: number; len: number }> = [];
  public dataSequence: Array<{ data: number[] }> = [];
  public readError: Error | null = null;

  setID(id: number) {
    this.id = id;
  }
  setTimeout(ms: number) {
    this.timeoutMs = ms;
  }
  async connectTCP(host: string, opts: { port: number }) {
    this.connectTcpCalls.push({ host, port: opts.port });
  }
  async connectRTUBuffered(porta: string, cfg: any) {
    this.connectRtuCalls.push({ porta, cfg });
  }
  async readHoldingRegisters(reg: number, len: number) {
    this.reads.push({ reg, len });
    if (this.readError) throw this.readError;
    return this.dataSequence.shift() ?? { data: [0, 0] };
  }
  close(cb: () => void) {
    this.closed = true;
    cb();
  }
}

let lastClient: MockModbusClient | null = null;

jest.mock('modbus-serial', () => {
  return jest.fn().mockImplementation(() => {
    lastClient = new MockModbusClient();
    return lastClient;
  });
});

describe('ModbusAdapter', () => {
  beforeEach(() => {
    lastClient = null;
  });

  it('rejeita se nem IP nem porta serial configurados', async () => {
    const ad = new ModbusAdapter({});
    await expect(ad.connect()).rejects.toThrow(/IP\+porta ou porta serial/);
  });

  it('conecta via TCP, configura ID e timeout, faz polling', async () => {
    const ad = new ModbusAdapter({
      enderecoIp: '192.168.1.50',
      portaTcp: 502,
      modbusUnitId: 7,
      modbusRegister: 100,
      readTimeoutMs: 750,
      intervalMs: 20,
    });
    await ad.connect();

    expect(lastClient!.connectTcpCalls).toEqual([{ host: '192.168.1.50', port: 502 }]);
    expect(lastClient!.id).toBe(7);
    expect(lastClient!.timeoutMs).toBe(750);

    lastClient!.dataSequence.push({ data: [0x0001, 0x86a0] }); // 0x000186A0 = 100000

    const recebido = new Promise<Buffer>((resolve) => ad.on('data', resolve));
    const buf = await recebido;
    expect(buf.toString().trim()).toBe('100000');
    await ad.close();
    expect(lastClient!.closed).toBe(true);
  });

  it('conecta via RTU serial', async () => {
    const ad = new ModbusAdapter({
      porta: 'COM4',
      baudrate: 19200,
      databits: 8,
      stopbits: 1,
      parity: 'none',
      modbusUnitId: 1,
    });
    await ad.connect();
    expect(lastClient!.connectRtuCalls.length).toBe(1);
    expect(lastClient!.connectRtuCalls[0].porta).toBe('COM4');
    expect(lastClient!.connectRtuCalls[0].cfg.baudRate).toBe(19200);
    await ad.close();
  });

  it('emite error com contexto em falha de leitura nao-fatal', async () => {
    const ad = new ModbusAdapter({
      enderecoIp: '127.0.0.1',
      portaTcp: 502,
      modbusUnitId: 3,
      modbusRegister: 40,
      intervalMs: 5,
    });
    await ad.connect();
    lastClient!.readError = new Error('Modbus exception 02');

    const onErr = new Promise<Error>((resolve) => ad.on('error', resolve));
    const err = await onErr;
    expect(err.message).toMatch(/reg=40.*unit=3/);
    expect(err.message).toContain('Modbus exception 02');
    await ad.close();
  });

  it('para o loop e emite close em erro fatal de conexao', async () => {
    const ad = new ModbusAdapter({
      enderecoIp: '127.0.0.1',
      portaTcp: 502,
      intervalMs: 5,
    });
    await ad.connect();
    lastClient!.readError = new Error('Port is not open');
    // Sem error listener, EventEmitter lanca — registrar.
    ad.on('error', () => undefined);

    const onClose = new Promise<void>((resolve) => ad.on('close', () => resolve()));
    await onClose;
    expect(ad.isOpen()).toBe(false);
  });
});
