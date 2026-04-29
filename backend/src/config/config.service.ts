import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConfigDto, tenantId: string) {
    await this.ensureEmpresaTenant(dto.empresaId, tenantId);
    if (dto.unidadeId) await this.ensureUnidadeTenant(dto.unidadeId, tenantId);
    return this.prisma.configuracaoOperacionalUnidade.create({
      data: { ...dto },
      include: { empresa: true, unidade: true },
    });
  }

  async findAll(tenantId: string, empresaId?: string, unidadeId?: string) {
    const where: Prisma.ConfiguracaoOperacionalUnidadeWhereInput = { empresa: { tenantId } };
    if (empresaId) where.empresaId = empresaId;
    if (unidadeId) where.unidadeId = unidadeId;

    return this.prisma.configuracaoOperacionalUnidade.findMany({
      where,
      include: { empresa: true, unidade: true },
    });
  }

  async findByUnidade(unidadeId: string, tenantId: string) {
    const config = await this.prisma.configuracaoOperacionalUnidade.findFirst({
      where: { unidadeId, unidade: { empresa: { tenantId } } },
      include: { empresa: true, unidade: true },
    });
    if (!config) throw new NotFoundException('Configuracao nao encontrada para esta unidade');
    return config;
  }

  async findOne(id: string, tenantId: string) {
    const config = await this.prisma.configuracaoOperacionalUnidade.findUnique({
      where: { id },
      include: { empresa: true, unidade: true },
    });
    if (!config || config.empresa.tenantId !== tenantId) {
      throw new NotFoundException('Configuracao nao encontrada');
    }
    return config;
  }

  async update(id: string, dto: UpdateConfigDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.configuracaoOperacionalUnidade.update({
      where: { id },
      data: { ...dto },
      include: { empresa: true, unidade: true },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.configuracaoOperacionalUnidade.delete({ where: { id } });
  }

  private async ensureEmpresaTenant(empresaId: string, tenantId: string) {
    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId, tenantId } });
    if (!empresa) throw new ForbiddenException('Empresa nao pertence ao tenant');
  }

  private async ensureUnidadeTenant(unidadeId: string, tenantId: string) {
    const unidade = await this.prisma.unidade.findFirst({
      where: { id: unidadeId, empresa: { tenantId } },
    });
    if (!unidade) throw new ForbiddenException('Unidade nao pertence ao tenant');
  }
}
