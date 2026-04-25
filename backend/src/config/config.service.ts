import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConfigDto) {
    return this.prisma.configuracaoOperacionalUnidade.create({
      data: { ...dto },
      include: { empresa: true, unidade: true },
    });
  }

  async findAll(empresaId?: string, unidadeId?: string) {
    const where: Prisma.ConfiguracaoOperacionalUnidadeWhereInput = {};
    if (empresaId) where.empresaId = empresaId;
    if (unidadeId) where.unidadeId = unidadeId;

    return this.prisma.configuracaoOperacionalUnidade.findMany({
      where,
      include: { empresa: true, unidade: true },
    });
  }

  async findByUnidade(unidadeId: string) {
    const config = await this.prisma.configuracaoOperacionalUnidade.findFirst({
      where: { unidadeId },
      include: { empresa: true, unidade: true },
    });
    if (!config) throw new NotFoundException('Configuracao nao encontrada para esta unidade');
    return config;
  }

  async findOne(id: string) {
    const config = await this.prisma.configuracaoOperacionalUnidade.findUnique({
      where: { id },
      include: { empresa: true, unidade: true },
    });
    if (!config) throw new NotFoundException('Configuracao nao encontrada');
    return config;
  }

  async update(id: string, dto: UpdateConfigDto) {
    await this.findOne(id);
    return this.prisma.configuracaoOperacionalUnidade.update({
      where: { id },
      data: { ...dto },
      include: { empresa: true, unidade: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.configuracaoOperacionalUnidade.delete({ where: { id } });
  }
}
