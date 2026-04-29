import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProdutoDto } from '../dto/create-produto.dto';
import { UpdateProdutoDto } from '../dto/update-produto.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProdutoDto, tenantId: string) {
    return this.prisma.produto.create({ data: { ...dto, tenantId } });
  }

  async findAll(filter: BaseFilterDto, tenantId: string) {
    const where: Prisma.ProdutoWhereInput = { tenantId };
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

  async findOne(id: string, tenantId: string) {
    const entity = await this.prisma.produto.findUnique({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Produto não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateProdutoDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.produto.update({ where: { id, tenantId }, data: { ...dto } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.produto.update({ where: { id, tenantId }, data: { ativo: false } });
  }
}
