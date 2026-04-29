import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileSecretService } from './profile-secret.service';

describe('ProfileSecretService', () => {
  const prisma = {
    integracaoProfile: {
      findFirst: jest.fn(),
    },
    integracaoProfileSecret: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  function makeService() {
    return new ProfileSecretService(prisma as unknown as PrismaService);
  }

  it('rotaciona segredo sem retornar encryptedValue', async () => {
    prisma.integracaoProfile.findFirst.mockResolvedValue({ id: 'profile-1' });
    prisma.integracaoProfileSecret.upsert.mockResolvedValue({
      id: 'secret-1',
      profileId: 'profile-1',
      secretKey: 'erp-token',
      encryptionVersion: 1,
      rotatedAt: new Date('2026-04-29T12:00:00Z'),
      criadoEm: new Date('2026-04-29T12:00:00Z'),
      atualizadoEm: new Date('2026-04-29T12:00:00Z'),
    });

    const result = await makeService().upsert('profile-1', 'tenant-1', 'erp-token', 'secret');

    expect(prisma.integracaoProfileSecret.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          encryptedValue: expect.stringMatching(/^(dpapi|enc):v1:/),
        }),
        create: expect.objectContaining({
          encryptedValue: expect.stringMatching(/^(dpapi|enc):v1:/),
        }),
        select: expect.not.objectContaining({ encryptedValue: true }),
      }),
    );
    expect(result).not.toHaveProperty('encryptedValue');
  });

  it('bloqueia acesso a segredo de perfil fora do tenant', async () => {
    prisma.integracaoProfile.findFirst.mockResolvedValue(null);

    await expect(makeService().list('profile-1', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('resolve segredo por profileId e secretKey para uso interno do conector', async () => {
    prisma.integracaoProfileSecret.findUnique.mockResolvedValue({ encryptedValue: 'secret' });

    await expect(makeService().resolve('profile-1', 'erp-token')).resolves.toBe('secret');
  });
});
