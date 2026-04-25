import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicadorDto } from '../dto/create-indicador.dto';
import { UpdateIndicadorDto } from '../dto/update-indicador.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class IndicadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIndicadorDto) {
    return this.prisma.indicadorPesagem.create({ data: { ...dto } });
  }

  async findAll(filter: BaseFilterDto) {
    const where: Prisma.IndicadorPesagemWhereInput = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search) where.descricao = { contains: filter.search };
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.indicadorPesagem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { descricao: 'asc' },
      }),
      this.prisma.indicadorPesagem.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.indicadorPesagem.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Indicador não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateIndicadorDto) {
    await this.findOne(id);
    return this.prisma.indicadorPesagem.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.indicadorPesagem.update({ where: { id }, data: { ativo: false } });
  }
}
