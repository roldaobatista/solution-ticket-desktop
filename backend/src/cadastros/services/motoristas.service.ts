import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMotoristaDto } from '../dto/create-motorista.dto';
import { UpdateMotoristaDto } from '../dto/update-motorista.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class MotoristasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMotoristaDto, tenantId: string) {
    return this.prisma.motorista.create({
      data: { ...dto, tenantId },
      include: { transportadora: true },
    });
  }

  async findAll(filter: BaseFilterDto, tenantId: string) {
    const where: Prisma.MotoristaWhereInput = { tenantId };
    if (filter.search) where.nome = { contains: filter.search };
    if (filter.transportadoraId) where.transportadoraId = filter.transportadoraId;
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.motorista.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        include: { transportadora: true },
      }),
      this.prisma.motorista.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const entity = await this.prisma.motorista.findUnique({
      where: { id, tenantId },
      include: { transportadora: true },
    });
    if (!entity) throw new NotFoundException('Motorista não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateMotoristaDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.motorista.update({ where: { id, tenantId }, data: { ...dto } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.motorista.update({ where: { id, tenantId }, data: { ativo: false } });
  }
}
