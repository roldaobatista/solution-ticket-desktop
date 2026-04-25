import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RelatoriosSalvosService } from './relatorios-salvos.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  relatorioSalvo: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
}

function makePrismaMock(): PrismaMock {
  return {
    relatorioSalvo: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('RelatoriosSalvosService', () => {
  let service: RelatoriosSalvosService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [RelatoriosSalvosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RelatoriosSalvosService);
  });

  describe('list', () => {
    it('filtra por tenant e modulo quando informado', async () => {
      await service.list('t', 'tickets');
      expect(prisma.relatorioSalvo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't', modulo: 'tickets' } }),
      );
    });

    it('omite modulo do where quando ausente', async () => {
      await service.list('t');
      expect(prisma.relatorioSalvo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't' } }),
      );
    });
  });

  describe('get', () => {
    it('lanca NotFound quando nao encontra', async () => {
      prisma.relatorioSalvo.findFirst.mockResolvedValue(null);
      await expect(service.get('id', 't')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('serializa filtros objeto para JSON string', async () => {
      await service.create('t', {
        nome: 'r1',
        modulo: 'tickets',
        filtros: { status: 'FECHADO', dt: '2026-04-01' },
      });
      expect(prisma.relatorioSalvo.create).toHaveBeenCalledWith({
        data: {
          tenantId: 't',
          nome: 'r1',
          modulo: 'tickets',
          filtros: '{"status":"FECHADO","dt":"2026-04-01"}',
        },
      });
    });

    it('mantem filtros string conforme veio', async () => {
      await service.create('t', { nome: 'r1', modulo: 'tickets', filtros: '{"raw":1}' });
      expect(prisma.relatorioSalvo.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ filtros: '{"raw":1}' }) }),
      );
    });
  });

  describe('update', () => {
    it('atualiza apenas campos fornecidos', async () => {
      prisma.relatorioSalvo.findFirst.mockResolvedValue({ id: 'r', tenantId: 't' });
      await service.update('r', 't', { nome: 'novo' });
      expect(prisma.relatorioSalvo.update).toHaveBeenCalledWith({
        where: { id: 'r' },
        data: { nome: 'novo' },
      });
    });

    it('serializa filtros novos quando objeto', async () => {
      prisma.relatorioSalvo.findFirst.mockResolvedValue({ id: 'r', tenantId: 't' });
      await service.update('r', 't', { filtros: { x: 1 } });
      expect(prisma.relatorioSalvo.update).toHaveBeenCalledWith({
        where: { id: 'r' },
        data: { filtros: '{"x":1}' },
      });
    });
  });

  describe('remove', () => {
    it('valida ownership via get antes de deletar', async () => {
      prisma.relatorioSalvo.findFirst.mockResolvedValue({ id: 'r', tenantId: 't' });
      const out = await service.remove('r', 't');
      expect(prisma.relatorioSalvo.delete).toHaveBeenCalledWith({ where: { id: 'r' } });
      expect(out).toEqual({ ok: true });
    });

    it('nao deleta quando ownership falha', async () => {
      prisma.relatorioSalvo.findFirst.mockResolvedValue(null);
      await expect(service.remove('r', 't')).rejects.toThrow(NotFoundException);
      expect(prisma.relatorioSalvo.delete).not.toHaveBeenCalled();
    });
  });
});
