import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { LicencaService, StatusLicenca } from './licenca.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fingerprintUtil from './fingerprint.util';
import {
  TEST_PUBLIC_KEY,
  OUTRA_PRIVATE_KEY,
  gerarChaveRSA,
} from '../../test/fixtures/rsa-test-keys';

const FAKE_FP = 'fp-maquina-teste-abc123';

describe('LicencaService', () => {
  let service: LicencaService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      licencaInstalacao: {
        findFirst: jest.fn(),
        create: jest.fn(async ({ data }: any) => ({ id: 'lic1', ...data })),
        update: jest.fn(async ({ data, where }: any) => ({ id: where.id, ...data })),
      },
      eventoLicenciamento: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    jest.spyOn(fingerprintUtil, 'obterFingerprint').mockReturnValue(FAKE_FP);

    const module = await Test.createTestingModule({
      providers: [LicencaService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LicencaService);
    // Injeta chave pública manualmente (evitamos onModuleInit filesystem)
    (service as any).publicKey = TEST_PUBLIC_KEY;
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

    it('ativa com chave vitalícia (sem expiração)', async () => {
      const chave = gerarChaveRSA({ fingerprints: [FAKE_FP], validadeSegundos: null });
      prisma.licencaInstalacao.findFirst.mockResolvedValue(null);
      const r = await service.ativar({ unidadeId: 'u1', tenantId: 't1', chave });
      expect(r.status).toBe(StatusLicenca.ATIVA);
      expect(r.expira).toBeNull();
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
});
