import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { protectSecret, revealSecret } from '../../common/secret-protection.util';

@Injectable()
export class ProfileSecretService {
  constructor(private readonly prisma: PrismaService) {}

  private protect(value: string): string {
    return protectSecret(value);
  }

  private reveal(value: string): string {
    return revealSecret(value);
  }

  async list(profileId: string, tenantId: string) {
    await this.ensureProfile(profileId, tenantId);
    const secrets = await this.prisma.integracaoProfileSecret.findMany({
      where: { profileId },
      select: {
        id: true,
        profileId: true,
        secretKey: true,
        encryptionVersion: true,
        rotatedAt: true,
        criadoEm: true,
        atualizadoEm: true,
      },
      orderBy: { secretKey: 'asc' },
    });

    return secrets;
  }

  async upsert(profileId: string, tenantId: string, secretKey: string, value: string) {
    await this.ensureProfile(profileId, tenantId);
    const saved = await this.prisma.integracaoProfileSecret.upsert({
      where: {
        integracao_secret_profile_key_unique: {
          profileId,
          secretKey,
        },
      },
      update: {
        encryptedValue: this.protect(value),
        encryptionVersion: 1,
        rotatedAt: new Date(),
      },
      create: {
        profileId,
        secretKey,
        encryptedValue: this.protect(value),
        encryptionVersion: 1,
        rotatedAt: new Date(),
      },
      select: {
        id: true,
        profileId: true,
        secretKey: true,
        encryptionVersion: true,
        rotatedAt: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    return saved;
  }

  async resolve(profileId: string, secretRef?: string): Promise<string | undefined> {
    if (!secretRef) return undefined;

    const secret = await this.prisma.integracaoProfileSecret.findUnique({
      where: {
        integracao_secret_profile_key_unique: {
          profileId,
          secretKey: secretRef,
        },
      },
    });

    return secret ? this.reveal(secret.encryptedValue) : undefined;
  }

  private async ensureProfile(profileId: string, tenantId: string) {
    const profile = await this.prisma.integracaoProfile.findFirst({
      where: { id: profileId, tenantId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Perfil de integracao nao encontrado');
  }
}
