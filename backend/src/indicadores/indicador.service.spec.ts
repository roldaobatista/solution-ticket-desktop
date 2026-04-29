import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IndicadorService } from './indicador.service';

describe('IndicadorService', () => {
  const prisma = {
    indicadorPesagem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: IndicadorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IndicadorService(prisma as unknown as PrismaService);
  });

  it('cria indicador customizado com read configuravel', async () => {
    prisma.indicadorPesagem.create.mockResolvedValue({ id: 'i1' });

    await service.create(
      {
        descricao: 'Toledo C custom',
        protocolo: 'serial',
        readMode: 'polling',
        readCommandHex: '05',
        readIntervalMs: 500,
        readTimeoutMs: 2000,
      },
      'tenant-1',
    );

    expect(prisma.indicadorPesagem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        readMode: 'polling',
        readCommandHex: '05',
        readIntervalMs: 500,
        readTimeoutMs: 2000,
        builtin: false,
      }),
    });
  });

  it('rejeita polling sem comando', async () => {
    await expect(
      service.create({ descricao: 'Indicador', readMode: 'polling' }, 'tenant-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('update preserva null para limpar campos opcionais', async () => {
    prisma.indicadorPesagem.findFirst.mockResolvedValue({
      id: 'i1',
      tenantId: 'tenant-1',
      descricao: 'Indicador',
      readMode: 'polling',
      readCommandHex: '05',
    });
    prisma.indicadorPesagem.update.mockResolvedValue({ id: 'i1' });

    await service.update('i1', { readMode: null, readCommandHex: null }, 'tenant-1');

    expect(prisma.indicadorPesagem.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { readCommandHex: null, readMode: 'continuous' },
    });
  });

  it('seedBuiltins persiste polling ENQ dos presets request-response', async () => {
    prisma.indicadorPesagem.findFirst.mockResolvedValue(null);
    prisma.indicadorPesagem.create.mockResolvedValue({});

    await service.seedBuiltins('tenant-1');

    expect(prisma.indicadorPesagem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parserTipo: 'toledo-c',
        readMode: 'polling',
        readCommandHex: '05',
        readIntervalMs: 500,
        readTimeoutMs: 2000,
      }),
    });
  });
});
