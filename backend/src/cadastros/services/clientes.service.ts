import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { validarPessoaFiscal, normalizarDocumento, TipoPessoa } from '../../common/pessoa-fiscal';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClienteDto, tenantId: string) {
    const tipoPessoa: TipoPessoa = (dto.tipoPessoa ?? 'PJ') as TipoPessoa;
    validarPessoaFiscal({
      tipoPessoa,
      documento: dto.documento,
      inscricaoEstadual: dto.inscricaoEstadual,
    });
    return this.prisma.cliente.create({
      data: {
        ...dto,
        tenantId,
        tipoPessoa,
        documento: normalizarDocumento(dto.documento),
      },
    });
  }

  async findAll(filter: BaseFilterDto, tenantId: string) {
    const where: Prisma.ClienteWhereInput = { tenantId };
    if (filter.search) {
      where.OR = [
        { razaoSocial: { contains: filter.search } },
        { documento: { contains: filter.search } },
      ];
    }
    where.ativo = filter.ativo !== undefined ? filter.ativo : true;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({ where, skip, take: limit, orderBy: { razaoSocial: 'asc' } }),
      this.prisma.cliente.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const entity = await this.prisma.cliente.findFirst({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Cliente não encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateClienteDto, tenantId: string) {
    const atual = await this.findOne(id, tenantId);
    if (
      dto.tipoPessoa !== undefined ||
      dto.documento !== undefined ||
      dto.inscricaoEstadual !== undefined
    ) {
      validarPessoaFiscal({
        tipoPessoa: (dto.tipoPessoa ?? atual.tipoPessoa) as TipoPessoa,
        documento: dto.documento ?? atual.documento,
        inscricaoEstadual: dto.inscricaoEstadual ?? atual.inscricaoEstadual,
      });
    }
    return this.prisma.cliente.update({
      where: { id },
      data: {
        ...dto,
        documento: dto.documento === undefined ? undefined : normalizarDocumento(dto.documento),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.cliente.update({ where: { id }, data: { ativo: false } });
  }
}
