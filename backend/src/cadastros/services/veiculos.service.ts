import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVeiculoDto } from '../dto/create-veiculo.dto';
import { UpdateVeiculoDto } from '../dto/update-veiculo.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class VeiculosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVeiculoDto) {
    return this.prisma.veiculo.create({
      data: { ...dto },
      include: { transportadora: true },
    });
  }

  async findAll(filter: BaseFilterDto) {
    const where: any = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search) where.placa = { contains: filter.search, mode: 'insensitive' };
    if (filter.transportadoraId) where.transportadoraId = filter.transportadoraId;
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.veiculo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placa: 'asc' },
        include: { transportadora: true },
      }),
      this.prisma.veiculo.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.veiculo.findUnique({
      where: { id },
      include: { transportadora: true },
    });
    if (!entity) throw new NotFoundException('Veículo não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateVeiculoDto) {
    await this.findOne(id);
    return this.prisma.veiculo.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.veiculo.update({ where: { id }, data: { ativo: false } });
  }
}
