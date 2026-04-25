import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArmazemDto } from '../dto/create-armazem.dto';
import { UpdateArmazemDto } from '../dto/update-armazem.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class ArmazensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateArmazemDto) {
    return this.prisma.armazem.create({ data: { ...dto } });
  }

  async findAll(filter: BaseFilterDto) {
    const where: any = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search) where.descricao = { contains: filter.search, mode: 'insensitive' };
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.armazem.findMany({ where, skip, take: limit, orderBy: { descricao: 'asc' } }),
      this.prisma.armazem.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.armazem.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Armazém não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateArmazemDto) {
    await this.findOne(id);
    return this.prisma.armazem.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.armazem.update({ where: { id }, data: { ativo: false } });
  }
}
