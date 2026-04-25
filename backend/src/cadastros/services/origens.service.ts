import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrigemDto } from '../dto/create-origem.dto';
import { UpdateOrigemDto } from '../dto/update-origem.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class OrigensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrigemDto) {
    return this.prisma.origem.create({ data: { ...dto } });
  }

  async findAll(filter: BaseFilterDto) {
    const where: Prisma.OrigemWhereInput = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search) where.descricao = { contains: filter.search };
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.origem.findMany({ where, skip, take: limit, orderBy: { descricao: 'asc' } }),
      this.prisma.origem.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.origem.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Origem não encontrada');
    return entity;
  }

  async update(id: string, dto: UpdateOrigemDto) {
    await this.findOne(id);
    return this.prisma.origem.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.origem.update({ where: { id }, data: { ativo: false } });
  }
}
