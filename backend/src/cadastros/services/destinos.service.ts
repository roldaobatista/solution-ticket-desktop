import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestinoDto } from '../dto/create-destino.dto';
import { UpdateDestinoDto } from '../dto/update-destino.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class DestinosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDestinoDto) {
    return this.prisma.destino.create({ data: { ...dto } });
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
      this.prisma.destino.findMany({ where, skip, take: limit, orderBy: { descricao: 'asc' } }),
      this.prisma.destino.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.destino.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Destino não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateDestinoDto) {
    await this.findOne(id);
    return this.prisma.destino.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.destino.update({ where: { id }, data: { ativo: false } });
  }
}
