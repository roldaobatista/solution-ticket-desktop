import { ForbiddenException } from '@nestjs/common';
import { TicketLicenseGuard } from './ticket-license-guard';

jest.mock('../licenca/fingerprint.util', () => ({ obterFingerprint: () => 'fp-test' }));

describe('TicketLicenseGuard', () => {
  let guard: TicketLicenseGuard;
  let prismaMock: {
    licencaInstalacao: { findFirst: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      licencaInstalacao: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    guard = new TicketLicenseGuard(prismaMock as never);
  });

  describe('verificarLicenca', () => {
    it('bloqueia quando não existe licença (F-001 fail-closed)', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue(null);
      await expect(guard.verificarLicenca('unidade-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('consulta licenca pelo fingerprint da maquina e tenant do ticket', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'ATIVA',
        pesagensRestantesTrial: null,
        trialExpiraEm: null,
      });

      await guard.verificarLicenca('unidade-1', 'tenant-1');

      expect(prismaMock.licencaInstalacao.findFirst).toHaveBeenCalledWith({
        where: {
          unidadeId: 'unidade-1',
          tenantId: 'tenant-1',
          fingerprintDispositivo: 'fp-test',
        },
      });
    });

    it('bloqueia quando licença está EXPIRADA', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'EXPIRADA',
        pesagensRestantesTrial: null,
        trialExpiraEm: null,
      });
      await expect(guard.verificarLicenca('unidade-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('bloqueia quando licença está BLOQUEADA', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'BLOQUEADA',
        pesagensRestantesTrial: null,
        trialExpiraEm: null,
      });
      await expect(guard.verificarLicenca('unidade-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('bloqueia quando licença está INVALIDA', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'INVALIDA',
        pesagensRestantesTrial: null,
        trialExpiraEm: null,
      });
      await expect(guard.verificarLicenca('unidade-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite quando trial está ativo (dias e pesagens restantes)', async () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 10);
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 50,
        trialExpiraEm: futuro,
      });
      await expect(guard.verificarLicenca('unidade-1')).resolves.toBeUndefined();
    });

    it('bloqueia quando trial expirou por data', async () => {
      const passado = new Date();
      passado.setDate(passado.getDate() - 1);
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 50,
        trialExpiraEm: passado,
      });
      await expect(guard.verificarLicenca('unidade-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('bloqueia quando trial expirou por pesagens (0 restantes)', async () => {
      const futuro = new Date();
      futuro.setDate(futuro.getDate() + 10);
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 0,
        trialExpiraEm: futuro,
      });
      await expect(guard.verificarLicenca('unidade-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('permite quando licença está ATIVA', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'ATIVA',
        pesagensRestantesTrial: null,
        trialExpiraEm: null,
      });
      await expect(guard.verificarLicenca('unidade-1')).resolves.toBeUndefined();
    });
  });

  describe('decrementarPesagemTrial', () => {
    it('decrementa atomicamente quando trial ativo (F-013)', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 5,
      });
      await guard.decrementarPesagemTrial('unidade-1');
      expect(prismaMock.licencaInstalacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'l1' },
          data: { pesagensRestantesTrial: { decrement: 1 } },
        }),
      );
    });

    it('decrementa apenas a licenca do tenant e fingerprint atuais', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 5,
      });

      await guard.decrementarPesagemTrial('unidade-1', 'tenant-1');

      expect(prismaMock.licencaInstalacao.findFirst).toHaveBeenCalledWith({
        where: {
          unidadeId: 'unidade-1',
          tenantId: 'tenant-1',
          fingerprintDispositivo: 'fp-test',
        },
      });
    });

    it('não decrementa quando não é trial', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'ATIVA',
        pesagensRestantesTrial: null,
      });
      await guard.decrementarPesagemTrial('unidade-1');
      expect(prismaMock.licencaInstalacao.update).not.toHaveBeenCalled();
    });

    it('não decrementa quando pesagens já esgotadas', async () => {
      prismaMock.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 0,
      });
      await guard.decrementarPesagemTrial('unidade-1');
      expect(prismaMock.licencaInstalacao.update).not.toHaveBeenCalled();
    });
  });
});
