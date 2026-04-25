import * as net from 'net';
import { TcpAdapter } from './tcp.adapter';

/**
 * Testes do TcpAdapter usando servidor real em porta 0.
 * Valida o hardening da Wave 1 (C1, C2): keepAlive, timeout, propagação de close.
 */
describe('TcpAdapter', () => {
  let server: net.Server;
  let porta: number;
  const sockets: net.Socket[] = [];

  beforeEach(async () => {
    server = net.createServer((sock) => {
      sockets.push(sock);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const addr = server.address();
    if (typeof addr === 'string' || !addr) throw new Error('addr');
    porta = addr.port;
  });

  afterEach(async () => {
    for (const s of sockets) s.destroy();
    sockets.length = 0;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('abre conexao e emite data recebido do servidor', async () => {
    const ad = new TcpAdapter({ enderecoIp: '127.0.0.1', portaTcp: porta });
    await ad.connect();
    expect(ad.isOpen()).toBe(true);

    const recebido = new Promise<Buffer>((resolve) => ad.on('data', (b: Buffer) => resolve(b)));
    sockets[0].write(Buffer.from('OLA\n'));
    expect((await recebido).toString()).toBe('OLA\n');
    await ad.close();
  });

  it('emite close quando o servidor derruba a conexao', async () => {
    const ad = new TcpAdapter({ enderecoIp: '127.0.0.1', portaTcp: porta });
    await ad.connect();
    const onClose = new Promise<void>((resolve) => ad.on('close', () => resolve()));
    sockets[0].destroy();
    await onClose;
    expect(ad.isOpen()).toBe(false);
  });

  it('rejeita com timeout quando o IP nao responde (C1)', async () => {
    // IP de teste reservado (TEST-NET-1 192.0.2.0/24) — nao deve responder
    const ad = new TcpAdapter({
      enderecoIp: '192.0.2.1',
      portaTcp: 12345,
      connectTimeoutMs: 300,
    });
    await expect(ad.connect()).rejects.toThrow(/timeout|ETIMEDOUT|EHOSTUNREACH/i);
  }, 10_000);

  it('rejeita se IP/porta nao configurados', async () => {
    const ad = new TcpAdapter({});
    await expect(ad.connect()).rejects.toThrow(/IP\/porta/);
  });
});
