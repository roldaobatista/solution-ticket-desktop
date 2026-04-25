import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RomaneioService } from './romaneio.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatusComercial } from '../constants/enums';

interface PrismaMock {
  romaneio: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  ticketPesagem: { findUnique: jest.Mock; update: jest.Mock };
  itemRomaneio: { create: jest.Mock };
  $transaction: jest.Mock;
}

function makePrismaMock(): PrismaMock {
  const m: PrismaMock = {
    romaneio: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
    },
    ticketPesagem: { findUnique: jest.fn(), update: jest.fn() },
    itemRomaneio: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  m.$transaction.mockImplementation(async (cb: (tx: PrismaMock) => Promise<unknown>) => cb(m));
  return m;
}

describe('RomaneioService', () => {
  let service: RomaneioService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [RomaneioService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RomaneioService);
  });

  describe('create', () => {
    it('gera numero ROM-NNNNNN sequencial', async () => {
      prisma.romaneio.count.mockResolvedValueOnce(2);
      prisma.romaneio.create.mockResolvedValue({ id: 'r1' });
      prisma.romaneio.findUnique.mockResolvedValue({ id: 'r1', numero: 'ROM-000003' });
      const out = await service.create({
        tenantId: 't',
        clienteId: 'c',
        periodoInicio: '2026-04-01',
        periodoFim: '2026-04-30',
      });
      expect(prisma.romaneio.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ numero: 'ROM-000003' }) }),
      );
      expect(out.numero).toBe('ROM-000003');
    });

    it('chama vincularTickets quando ticketIds informado', async () => {
      prisma.romaneio.count.mockResolvedValueOnce(0);
      prisma.romaneio.create.mockResolvedValue({ id: 'r1' });
      prisma.romaneio.findUnique
        .mockResolvedValueOnce({ id: 'r1' }) // dentro de vincularTickets (tx)
        .mockResolvedValue({ id: 'r1', numero: 'ROM-000001' }); // findOne final
      prisma.ticketPesagem.findUnique.mockResolvedValue({
        id: 't1',
        numero: 'TKT-1',
        pesoLiquidoFinal: 5000,
        statusComercial: 'NAO_ROMANEADO',
      });
      prisma.itemRomaneio.create.mockResolvedValue({});
      prisma.ticketPesagem.update.mockResolvedValue({});
      prisma.romaneio.update.mockResolvedValue({});
      await service.create({
        tenantId: 't',
        clienteId: 'c',
        periodoInicio: '2026-04-01',
        periodoFim: '2026-04-30',
        ticketIds: ['t1'],
      });
      expect(prisma.itemRomaneio.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('aplica filtro clienteId quando informado', async () => {
      await service.findAll('t', 'c1');
      expect(prisma.romaneio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't', clienteId: 'c1' } }),
      );
    });
  });

  describe('findOne', () => {
    it('lanca NotFound quando nao existe', async () => {
      prisma.romaneio.findUnique.mockResolvedValue(null);
      await expect(service.findOne('xx')).rejects.toThrow(NotFoundException);
    });
  });

  describe('vincularTickets', () => {
    beforeEach(() => {
      prisma.romaneio.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.itemRomaneio.create.mockResolvedValue({});
      prisma.ticketPesagem.update.mockResolvedValue({});
      prisma.romaneio.update.mockResolvedValue({});
    });

    it('lanca BadRequest quando ticket sem peso liquido', async () => {
      prisma.ticketPesagem.findUnique.mockResolvedValue({
        id: 't1',
        numero: 'TKT-1',
        pesoLiquidoFinal: null,
        statusComercial: 'NAO_ROMANEADO',
      });
      await expect(service.vincularTickets('r1', ['t1'])).rejects.toThrow(BadRequestException);
    });

    it('lanca BadRequest quando ticket ja romaneado', async () => {
      prisma.ticketPesagem.findUnique.mockResolvedValue({
        id: 't1',
        numero: 'TKT-1',
        pesoLiquidoFinal: 1000,
        statusComercial: StatusComercial.ROMANEADO,
      });
      await expect(service.vincularTickets('r1', ['t1'])).rejects.toThrow(BadRequestException);
    });

    it('soma pesoTotal e atualiza romaneio dentro de transacao', async () => {
      prisma.ticketPesagem.findUnique
        .mockResolvedValueOnce({
          id: 't1',
          numero: 'TKT-1',
          pesoLiquidoFinal: 1000,
          statusComercial: 'NAO_ROMANEADO',
        })
        .mockResolvedValueOnce({
          id: 't2',
          numero: 'TKT-2',
          pesoLiquidoFinal: 2500,
          statusComercial: 'NAO_ROMANEADO',
        });
      prisma.romaneio.findUnique
        .mockResolvedValueOnce({ id: 'r1' })
        .mockResolvedValue({ id: 'r1', pesoTotal: 3500 });
      await service.vincularTickets('r1', ['t1', 't2']);
      expect(prisma.romaneio.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { pesoTotal: 3500 },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
