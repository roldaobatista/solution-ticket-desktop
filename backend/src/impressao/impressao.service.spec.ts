import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ImpressaoService } from './impressao.service';
import { PrismaService } from '../prisma/prisma.service';

interface PrismaMock {
  ticketPesagem: { findUnique: jest.Mock };
  configuracaoOperacionalUnidade: { findFirst: jest.Mock };
  erroImpressao: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
}

function makePrismaMock(): PrismaMock {
  return {
    ticketPesagem: { findUnique: jest.fn() },
    configuracaoOperacionalUnidade: { findFirst: jest.fn() },
    erroImpressao: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

describe('ImpressaoService', () => {
  let service: ImpressaoService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [ImpressaoService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ImpressaoService);
  });

  describe('listarTemplates', () => {
    it('retorna registry com pelo menos TICKET002 default', () => {
      const tpls = service.listarTemplates();
      expect(tpls.some((t) => t.id === 'TICKET002')).toBe(true);
    });
  });

  describe('gerarTicketPdf', () => {
    it('lanca NotFound quando ticket nao existe', async () => {
      prisma.ticketPesagem.findUnique.mockResolvedValue(null);
      await expect(service.gerarTicketPdf('xx')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registrarErroImpressao', () => {
    it('grava mensagem truncada e stack quando err e Error', async () => {
      const longMsg = 'x'.repeat(3000);
      const err = new Error(longMsg);
      await service.registrarErroImpressao('t1', 'TICKET002', err);
      const arg = prisma.erroImpressao.create.mock.calls[0][0];
      expect(arg.data.ticketId).toBe('t1');
      expect(arg.data.template).toBe('TICKET002');
      expect(arg.data.tipo).toBe('PDF');
      expect(arg.data.mensagem.length).toBeLessThanOrEqual(2000);
      expect(arg.data.stack).toBeTruthy();
      expect(arg.data.stack.length).toBeLessThanOrEqual(4000);
    });

    it('grava stack=null quando err nao e Error', async () => {
      await service.registrarErroImpressao('t1', null, 'string solta');
      const arg = prisma.erroImpressao.create.mock.calls[0][0];
      expect(arg.data.stack).toBeNull();
    });

    it('nao propaga falha do prisma.create', async () => {
      prisma.erroImpressao.create.mockRejectedValue(new Error('db down'));
      await expect(
        service.registrarErroImpressao('t1', 'TICKET002', new Error('boom')),
      ).resolves.toBeUndefined();
    });
  });

  describe('listarErros', () => {
    it('sem filtro retorna where vazio', async () => {
      await service.listarErros();
      expect(prisma.erroImpressao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 200 }),
      );
    });

    it('com filtro resolvido aplica where', async () => {
      await service.listarErros(false);
      expect(prisma.erroImpressao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { resolvido: false } }),
      );
    });
  });

  describe('reimprimirErro', () => {
    it('lanca NotFound quando erro nao existe', async () => {
      prisma.erroImpressao.findUnique.mockResolvedValue(null);
      await expect(service.reimprimirErro('id')).rejects.toThrow(NotFoundException);
    });

    it('lanca NotFound quando erro nao tem ticketId', async () => {
      prisma.erroImpressao.findUnique.mockResolvedValue({ id: 'e1', ticketId: null });
      await expect(service.reimprimirErro('e1')).rejects.toThrow(NotFoundException);
    });

    it('marca como resolvido em sucesso e incrementa tentativas', async () => {
      prisma.erroImpressao.findUnique.mockResolvedValue({
        id: 'e1',
        ticketId: 't1',
        template: 'TICKET002',
      });
      jest.spyOn(service, 'gerarTicketPdf').mockResolvedValue(Buffer.from('pdf'));
      const out = await service.reimprimirErro('e1');
      expect(out).toEqual({ ok: true });
      expect(prisma.erroImpressao.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: expect.objectContaining({
          resolvido: true,
          resolvidoEm: expect.any(Date),
          tentativas: { increment: 1 },
        }),
      });
    });

    it('em falha incrementa tentativas e mantem resolvido=false', async () => {
      prisma.erroImpressao.findUnique.mockResolvedValue({
        id: 'e1',
        ticketId: 't1',
        template: 'TICKET002',
      });
      jest.spyOn(service, 'gerarTicketPdf').mockRejectedValue(new Error('falhou'));
      const out = await service.reimprimirErro('e1');
      expect(out.ok).toBe(false);
      expect(out.erro).toContain('falhou');
      expect(prisma.erroImpressao.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: expect.objectContaining({ tentativas: { increment: 1 } }),
      });
    });
  });

  describe('marcarResolvido', () => {
    it('atualiza resolvido=true com data atual', async () => {
      await service.marcarResolvido('e1');
      expect(prisma.erroImpressao.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: expect.objectContaining({ resolvido: true, resolvidoEm: expect.any(Date) }),
      });
    });
  });
});
