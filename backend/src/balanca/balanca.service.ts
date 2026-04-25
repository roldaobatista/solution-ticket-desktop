import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBalancaDto } from './dto/create-balanca.dto';
import { UpdateBalancaDto } from './dto/update-balanca.dto';
import { BalancaFilterDto } from './dto/balanca-filter.dto';

@Injectable()
export class BalancaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBalancaDto) {
    return this.prisma.balanca.create({ data: { ...dto } });
  }

  async findAll(filter: BalancaFilterDto) {
    const where: Prisma.BalancaWhereInput = {};
    if (filter.empresaId) where.empresaId = filter.empresaId;
    if (filter.unidadeId) where.unidadeId = filter.unidadeId;
    if (filter.statusOnline !== undefined) where.statusOnline = filter.statusOnline;
    if (filter.ativo !== undefined) where.ativo = filter.ativo;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.balanca.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        include: { empresa: true, unidade: true },
      }),
      this.prisma.balanca.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const balanca = await this.prisma.balanca.findUnique({
      where: { id },
      include: { empresa: true, unidade: true },
    });
    if (!balanca) throw new NotFoundException('Balanca nao encontrada');
    return balanca;
  }

  async update(id: string, dto: UpdateBalancaDto) {
    await this.findOne(id);
    return this.prisma.balanca.update({ where: { id }, data: { ...dto } });
  }

  async updateStatus(id: string, statusOnline: boolean) {
    await this.findOne(id);
    return this.prisma.balanca.update({
      where: { id },
      data: { statusOnline, atualizadoEm: new Date() },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.balanca.update({ where: { id }, data: { ativo: false } });
  }
}
