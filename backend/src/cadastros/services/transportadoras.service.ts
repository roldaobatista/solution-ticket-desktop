import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransportadoraDto } from '../dto/create-transportadora.dto';
import { UpdateTransportadoraDto } from '../dto/update-transportadora.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class TransportadorasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransportadoraDto) {
    return this.prisma.transportadora.create({ data: { ...dto } });
  }

  async findAll(filter: BaseFilterDto) {
    const where: any = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search) where.nome = { contains: filter.search, mode: 'insensitive' };
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

  async findOne(id: string) {
    const entity = await this.prisma.transportadora.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Transportadora não encontrada');
    return entity;
  }

  async update(id: string, dto: UpdateTransportadoraDto) {
    await this.findOne(id);
    return this.prisma.transportadora.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.transportadora.update({ where: { id }, data: { ativo: false } });
  }
}
