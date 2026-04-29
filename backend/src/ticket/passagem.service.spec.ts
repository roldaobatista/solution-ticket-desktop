import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PassagemService } from './passagem.service';
import { StatusComercial, StatusOperacional } from '../constants/enums';

interface PrismaMock {
  ticketPesagem: { findUnique: jest.Mock };
  passagemPesagem: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  descontoPesagem: { create: jest.Mock; findMany: jest.Mock };
}

function makePrismaMock(): PrismaMock {
  return {
    ticketPesagem: { findUnique: jest.fn() },
    passagemPesagem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    descontoPesagem: {
      create: jest.fn().mockResolvedValue({ id: 'd1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

describe('PassagemService', () => {
  let service: PassagemService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new PassagemService(prisma as never);
  });

  describe('adicionarDesconto', () => {
    it('lanca NotFound quando ticket nao existe', async () => {
      prisma.ticketPesagem.findUnique.mockResolvedValue(null);

      await expect(
        service.adicionarDesconto('tk1', { tipo: 'FIXO', valor: 10 }, 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('permite desconto apenas antes do fechamento e sem vinculo comercial', async () => {
      prisma.ticketPesagem.findUnique.mockResolvedValue({
        id: 'tk1',
        statusOperacional: StatusOperacional.AGUARDANDO_PASSAGEM,
        statusComercial: StatusComercial.NAO_ROMANEADO,
      });

      await service.adicionarDesconto('tk1', { tipo: 'FIXO', valor: 10 }, 'tenant-1');

      expect(prisma.descontoPesagem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ticketId: 'tk1', tipo: 'FIXO', valor: 10 }),
      });
    });

    it.each([
      StatusOperacional.FECHADO,
      StatusOperacional.CANCELADO,
      StatusOperacional.EM_MANUTENCAO,
    ])('rejeita desconto quando status operacional e %s', async (statusOperacional) => {
      prisma.ticketPesagem.findUnique.mockResolvedValue({
        id: 'tk1',
        statusOperacional,
        statusComercial: StatusComercial.NAO_ROMANEADO,
      });

      await expect(
        service.adicionarDesconto('tk1', { tipo: 'FIXO', valor: 10 }, 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.descontoPesagem.create).not.toHaveBeenCalled();
    });

    it.each([
      StatusComercial.ROMANEADO,
      StatusComercial.FATURADO,
      StatusComercial.PARCIALMENTE_BAIXADO,
      StatusComercial.BAIXADO,
    ])('rejeita desconto quando status comercial e %s', async (statusComercial) => {
      prisma.ticketPesagem.findUnique.mockResolvedValue({
        id: 'tk1',
        statusOperacional: StatusOperacional.AGUARDANDO_PASSAGEM,
        statusComercial,
      });

      await expect(
        service.adicionarDesconto('tk1', { tipo: 'FIXO', valor: 10 }, 'tenant-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.descontoPesagem.create).not.toHaveBeenCalled();
    });
  });
});
