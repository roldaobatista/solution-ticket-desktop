import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConnectorRegistryService } from '../connectors/connector-registry.service';
import { CreateIntegracaoProfileDto } from './dto/create-integracao-profile.dto';
import { UpdateIntegracaoProfileDto } from './dto/update-integracao-profile.dto';

@Injectable()
export class IntegracaoProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ConnectorRegistryService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.integracaoProfile.findMany({
      where: { tenantId },
      include: { connector: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async create(dto: CreateIntegracaoProfileDto, tenantId: string, userId?: string) {
    await this.validateReferences(dto, tenantId);

    const data: Prisma.IntegracaoProfileUncheckedCreateInput = {
      tenantId,
      empresaId: dto.empresaId,
      unidadeId: dto.unidadeId,
      connectorId: dto.connectorId,
      environment: dto.environment,
      baseUrl: dto.baseUrl,
      authMethod: dto.authMethod,
      secretRef: dto.secretRef,
      configJson: dto.config ? JSON.stringify(dto.config) : undefined,
      syncDirection: dto.syncDirection,
      enabled: dto.enabled ?? true,
      createdBy: userId,
      updatedBy: userId,
    };

    return this.prisma.integracaoProfile.create({ data, include: { connector: true } });
  }

  async update(id: string, dto: UpdateIntegracaoProfileDto, tenantId: string, userId?: string) {
    await this.ensureExists(id, tenantId);
    await this.validateReferences(dto, tenantId);

    const { config, ...updateDto } = dto;
    const data: Prisma.IntegracaoProfileUncheckedUpdateInput = {
      ...updateDto,
      ...(config !== undefined ? { configJson: JSON.stringify(config) } : {}),
      updatedBy: userId,
    };

    return this.prisma.integracaoProfile.update({
      where: { id },
      data,
      include: { connector: true },
    });
  }

  async disable(id: string, tenantId: string) {
    await this.ensureExists(id, tenantId);
    return this.prisma.integracaoProfile.update({
      where: { id },
      data: { enabled: false },
      include: { connector: true },
    });
  }

  async testConnection(id: string, tenantId: string) {
    const profile = await this.prisma.integracaoProfile.findFirst({
      where: { id, tenantId },
      include: { connector: true },
    });
    if (!profile) throw new NotFoundException('Perfil de integracao nao encontrado');
    if (!profile.enabled) throw new BadRequestException('Perfil de integracao desativado');

    const connector = this.registry.get(profile.connector.code);
    return connector.testConnection(
      {
        baseUrl: profile.baseUrl ?? undefined,
        authMethod: profile.authMethod,
        secretRef: profile.secretRef ?? undefined,
        options: this.parseConfig(profile.configJson),
      },
      {
        tenantId: profile.tenantId,
        empresaId: profile.empresaId,
        unidadeId: profile.unidadeId ?? undefined,
        profileId: profile.id,
        correlationId: randomUUID(),
      },
    );
  }

  private async ensureExists(id: string, tenantId: string) {
    const profile = await this.prisma.integracaoProfile.findFirst({ where: { id, tenantId } });
    if (!profile) throw new NotFoundException('Perfil de integracao nao encontrado');
    return profile;
  }

  private async validateReferences(
    dto: Partial<Pick<CreateIntegracaoProfileDto, 'empresaId' | 'unidadeId' | 'connectorId'>>,
    tenantId: string,
  ) {
    if (dto.empresaId) {
      const empresa = await this.prisma.empresa.findFirst({
        where: { id: dto.empresaId, tenantId },
      });
      if (!empresa) throw new BadRequestException('Empresa nao pertence ao tenant');
    }

    if (dto.unidadeId) {
      const unidade = await this.prisma.unidade.findFirst({
        where: {
          id: dto.unidadeId,
          empresa: { tenantId },
          ...(dto.empresaId ? { empresaId: dto.empresaId } : {}),
        },
      });
      if (!unidade) throw new BadRequestException('Unidade nao pertence a empresa/tenant');
    }

    if (dto.connectorId) {
      const connector = await this.prisma.integracaoConnector.findFirst({
        where: { id: dto.connectorId, enabled: true },
      });
      if (!connector) throw new BadRequestException('Conector de integracao indisponivel');
      this.registry.get(connector.code);
    }
  }

  private parseConfig(configJson: string | null): Record<string, unknown> | undefined {
    if (!configJson) return undefined;
    try {
      const parsed = JSON.parse(configJson);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
      throw new BadRequestException('Configuracao do perfil de integracao invalida');
    }
  }
}
