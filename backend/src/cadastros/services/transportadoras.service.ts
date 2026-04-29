import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransportadoraDto } from '../dto/create-transportadora.dto';
import { UpdateTransportadoraDto } from '../dto/update-transportadora.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class TransportadorasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransportadoraDto, tenantId: string) {
    return this.prisma.transportadora.create({ data: { ...dto, tenantId } });
  }

  async findAll(filter: BaseFilterDto, tenantId: string) {
    const where: Prisma.TransportadoraWhereInput = { tenantId };
    if (filter.search) where.nome = { contains: filter.search };
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transportadora.findMany({ where, skip, take: limit, orderBy: { nome: 'asc' } }),
      this.prisma.transportadora.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const entity = await this.prisma.transportadora.findUnique({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Transportadora não encontrada');
    return entity;
  }

  async update(id: string, dto: UpdateTransportadoraDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.transportadora.update({ where: { id, tenantId }, data: { ...dto } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.transportadora.update({ where: { id, tenantId }, data: { ativo: false } });
  }
}
