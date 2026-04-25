import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';
import { UpdateFormaPagamentoDto } from '../dto/update-forma-pagamento.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';

@Injectable()
export class FormasPagamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFormaPagamentoDto) {
    return this.prisma.formaPagamento.create({ data: { ...dto } });
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
      this.prisma.formaPagamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { descricao: 'asc' },
      }),
      this.prisma.formaPagamento.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.formaPagamento.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Forma de pagamento não encontrada');
    return entity;
  }

  async update(id: string, dto: UpdateFormaPagamentoDto) {
    await this.findOne(id);
    return this.prisma.formaPagamento.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.formaPagamento.update({ where: { id }, data: { ativo: false } });
  }
}
