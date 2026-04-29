import { EventEmitter } from 'events';
import { BalancaConnectionService } from './balanca-connection.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeituraPeso } from './parsers/parser.interface';

interface TestConnection {
  emitter: EventEmitter;
  status: {
    online: boolean;
    erro: string | null;
    ultimaLeitura: LeituraPeso | null;
    ultimaLeituraEm: Date | null;
  };
}

function setConnection(service: BalancaConnectionService, id: string, connection: TestConnection) {
  const internals = service as unknown as {
    conexoes: Map<string, TestConnection>;
  };
  internals.conexoes.set(id, connection);
}

describe('BalancaConnectionService.capturar', () => {
  let service: BalancaConnectionService;

  beforeEach(() => {
    service = new BalancaConnectionService({} as PrismaService);
  });

  it('nao retorna imediatamente uma leitura estavel antiga', async () => {
    const emitter = new EventEmitter();
    setConnection(service, 'b1', {
      emitter,
      status: {
        online: true,
        erro: null,
        ultimaLeitura: { peso: 1000, estavel: true, bruto: 'old' },
        ultimaLeituraEm: new Date(Date.now() - 60_000),
      },
    });

    const captura = service.capturar('b1', 'tenant-1', 100);
    setTimeout(() => {
      const internals = service as unknown as {
        conexoes: Map<string, TestConnection>;
      };
      const connection = internals.conexoes.get('b1');
      if (connection) {
        connection.status.ultimaLeitura = { peso: 2000, estavel: true, bruto: 'new' };
        connection.status.ultimaLeituraEm = new Date();
      }
      emitter.emit('leitura', { peso: 2000, estavel: true, bruto: 'new' });
    }, 10);

    await expect(captura).resolves.toEqual({ peso: 2000, estavel: true, bruto: 'new' });
  });

  it('retorna null no timeout quando nao recebe leitura estavel nova', async () => {
    const emitter = new EventEmitter();
    setConnection(service, 'b1', {
      emitter,
      status: {
        online: true,
        erro: null,
        ultimaLeitura: { peso: 1000, estavel: false, bruto: 'unstable' },
        ultimaLeituraEm: new Date(),
      },
    });

    await expect(service.capturar('b1', 'tenant-1', 10)).resolves.toBeNull();
  });
});

describe('BalancaConnectionService.conectar', () => {
  it('compartilha a mesma conexao pendente para chamadas simultaneas', async () => {
    const service = new BalancaConnectionService({} as PrismaService);
    const internals = service as unknown as {
      conectarNova: jest.Mock;
    };
    internals.conectarNova = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ online: true, erro: null, ultimaLeitura: null, ultimaLeituraEm: null }),
            10,
          ),
        ),
    );

    const [a, b] = await Promise.all([
      service.conectar('balanca-1', 'tenant-1'),
      service.conectar('balanca-1', 'tenant-1'),
    ]);

    expect(a.online).toBe(true);
    expect(b.online).toBe(true);
    expect(internals.conectarNova).toHaveBeenCalledTimes(1);
  });
});
