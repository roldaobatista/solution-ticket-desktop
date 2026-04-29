import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LicencaService, StatusLicenca } from './licenca.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrlService } from './crl.service';
import * as fingerprintUtil from './fingerprint.util';
import {
  TEST_PUBLIC_KEY,
  OUTRA_PRIVATE_KEY,
  gerarChaveRSA,
} from '../../test/fixtures/rsa-test-keys';

const FAKE_FP = 'fp-maquina-teste-abc123';

type LicencaCreateArgs = { data: Record<string, unknown> };
type LicencaUpdateArgs = { data: Record<string, unknown>; where: { id: string } };
type LicencaPrismaMock = {
  unidade: {
    findFirst: jest.Mock;
  };
  licencaInstalacao: {
    findFirst: jest.Mock;
    create: jest.Mock<Promise<Record<string, unknown>>, [LicencaCreateArgs]>;
    update: jest.Mock<Promise<Record<string, unknown>>, [LicencaUpdateArgs]>;
  };
  eventoLicenciamento: {
    create: jest.Mock;
  };
};

describe('LicencaService', () => {
  let service: LicencaService;
  let prisma: LicencaPrismaMock;

  beforeEach(async () => {
    prisma = {
      unidade: {
        findFirst: jest.fn().mockResolvedValue({ id: 'u1' }),
      },
      licencaInstalacao: {
        findFirst: jest.fn(),
        create: jest.fn(async ({ data }: LicencaCreateArgs) => ({ id: 'lic1', ...data })),
        update: jest.fn(async ({ data, where }: LicencaUpdateArgs) => ({ id: where.id, ...data })),
      },
      eventoLicenciamento: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    jest.spyOn(fingerprintUtil, 'obterFingerprint').mockReturnValue(FAKE_FP);

    const crlMock: Partial<CrlService> = {
      isRevogado: () => false,
      setPublicKey: () => {},
    };

    const module = await Test.createTestingModule({
      providers: [
        LicencaService,
        { provide: PrismaService, useValue: prisma },
        { provide: CrlService, useValue: crlMock },
      ],
    }).compile();

    service = module.get(LicencaService);
    // Injeta chave pública manualmente (evitamos onModuleInit filesystem)
    (service as unknown as { publicKey: string }).publicKey = TEST_PUBLIC_KEY;
  });

  describe('iniciarTrial', () => {
    it('é idempotente: retorna existente quando já há licença', async () => {
      const existente = { id: 'lic-antiga', unidadeId: 'u1', statusLicenca: 'TRIAL' };
      prisma.licencaInstalacao.findFirst.mockResolvedValue(existente);
      const r = await service.iniciarTrial('u1', 't1');
      expect(r).toEqual(existente);
      expect(prisma.licencaInstalacao.create).not.toHaveBeenCalled();
    });

    it('cria licença trial quando não existe e emite evento', async () => {
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      const r = await service.iniciarTrial('u1', 't1');
      expect(r.statusLicenca).toBe('TRIAL');
      expect(r.limitePesagensTrial).toBe(100);
      expect(prisma.eventoLicenciamento.create).toHaveBeenCalled();
    });

    it('rejeita trial quando unidade nao pertence ao tenant autenticado', async () => {
      prisma.unidade.findFirst.mockResolvedValue(null);

      await expect(service.iniciarTrial('u2', 't1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.licencaInstalacao.create).not.toHaveBeenCalled();
    });
  });

  describe('ativar', () => {
    it('rejeita chave com assinatura inválida (assinada com outra chave)', async () => {
      const chave = gerarChaveRSA({
        fingerprints: [FAKE_FP],
        privateKey: OUTRA_PRIVATE_KEY,
      });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      await expect(
        service.ativar({ unidadeId: 'u1', tenantId: 't1', chave }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita chave com fingerprint divergente', async () => {
      const chave = gerarChaveRSA({ fingerprints: ['outro-fp'] });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      await expect(service.ativar({ unidadeId: 'u1', tenantId: 't1', chave })).rejects.toThrow(
        /fingerprint/i,
      );
    });

    it('rejeita chave sem expiracao (F-029)', async () => {
      const chave = gerarChaveRSA({ fingerprints: [FAKE_FP], validadeSegundos: null });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      await expect(service.ativar({ unidadeId: 'u1', tenantId: 't1', chave })).rejects.toThrow(
        /exp/i,
      );
    });

    it('rejeita chave sem jti (F-029)', async () => {
      const chave = gerarChaveRSA({ fingerprints: [FAKE_FP], jti: null });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      await expect(service.ativar({ unidadeId: 'u1', tenantId: 't1', chave })).rejects.toThrow(
        /jti/i,
      );
    });

    it('ativa com expiração definida', async () => {
      const chave = gerarChaveRSA({
        fingerprints: [FAKE_FP],
        validadeSegundos: 86400 * 30,
      });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      const r = await service.ativar({ unidadeId: 'u1', tenantId: 't1', chave });
      expect(r.status).toBe(StatusLicenca.ATIVA);
      expect(r.expira).toBeInstanceOf(Date);
    });

    it('rejeita ativacao quando unidade nao pertence ao tenant autenticado', async () => {
      prisma.unidade.findFirst.mockResolvedValue(null);
      const chave = gerarChaveRSA({
        fingerprints: [FAKE_FP],
        validadeSegundos: 86400 * 30,
      });

      await expect(
        service.ativar({ unidadeId: 'u2', tenantId: 't1', chave }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.licencaInstalacao.create).not.toHaveBeenCalled();
    });

    it('rejeita chave expirada', async () => {
      const chave = gerarChaveRSA({ fingerprints: [FAKE_FP], validadeSegundos: -10 });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      await expect(service.ativar({ unidadeId: 'u1', tenantId: 't1', chave })).rejects.toThrow(
        /expirada/i,
      );
    });
  });

  describe('decrementarPesagemTrial', () => {
    it('decrementa quando trial com restante > 0', async () => {
      prisma.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'TRIAL',
        pesagensRestantesTrial: 5,
      });
      const r = await service.decrementarPesagemTrial('u1');
      expect(r.ok).toBe(true);
      expect(prisma.licencaInstalacao.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { pesagensRestantesTrial: { decrement: 1 } },
        }),
      );
    });

    it('não decrementa quando não é TRIAL', async () => {
      prisma.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: 'ATIVA',
        pesagensRestantesTrial: 5,
      });
      const r = await service.decrementarPesagemTrial('u1');
      expect(r.ok).toBe(false);
    });

    it('retorna sem_licenca quando não existe', async () => {
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      const r = await service.decrementarPesagemTrial('u1');
      expect(r.ok).toBe(false);
      expect(r.motivo).toBe('sem_licenca');
    });
  });

  describe('verificarStatus', () => {
    it('nao expoe fingerprint nem hashes em endpoint publico quando nao ha licenca', async () => {
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);

      const status = await service.verificarStatus('u1');

      expect(status).toEqual(
        expect.not.objectContaining({
          fingerprint: expect.anything(),
          chaveValidacaoHash: expect.anything(),
          chaveLicenciamentoHash: expect.anything(),
        }),
      );
    });

    it('nao expoe fingerprint nem hashes em endpoint publico quando existe licenca', async () => {
      prisma.licencaInstalacao.findFirst.mockResolvedValue({
        id: 'l1',
        statusLicenca: StatusLicenca.ATIVA,
        tipoLicenca: 'PRO',
        expiraEm: null,
        trialExpiraEm: null,
        pesagensRestantesTrial: null,
        ativadoEm: new Date('2026-04-01T00:00:00Z'),
        trialIniciadoEm: null,
        limitePesagensTrial: null,
        chaveValidacaoHash: 'hash-validacao',
        chaveLicenciamentoHash: 'hash-licenca',
        bloqueadoEm: null,
        motivoBloqueio: null,
        chaveJti: 'jti-1',
      });

      const status = await service.verificarStatus('u1');

      expect(status.status).toBe(StatusLicenca.ATIVA);
      expect(status).toEqual(
        expect.not.objectContaining({
          fingerprint: expect.anything(),
          chaveValidacaoHash: expect.anything(),
          chaveLicenciamentoHash: expect.anything(),
        }),
      );
    });
  });
});
