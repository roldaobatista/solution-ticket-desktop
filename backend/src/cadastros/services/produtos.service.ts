import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdutoDto } from '../dto/create-produto.dto';
import { UpdateProdutoDto } from '../dto/update-produto.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProdutoDto) {
    return this.prisma.produto.create({ data: { ...dto } });
  }

  async findAll(filter: BaseFilterDto) {
    const where: Prisma.ProdutoWhereInput = {};
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.search) {
      where.OR = [
        { descricao: { contains: filter.search } },
        { codigoInterno: { contains: filter.search } },
      ];
    }
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.produto.findMany({ where, skip, take: limit, orderBy: { descricao: 'asc' } }),
      this.prisma.produto.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.produto.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Produto não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateProdutoDto) {
    await this.findOne(id);
    return this.prisma.produto.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.produto.update({ where: { id }, data: { ativo: false } });
  }
}
