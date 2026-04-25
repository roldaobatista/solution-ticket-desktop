import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoVeiculoDto } from './dto/create-tipo-veiculo.dto';
import { UpdateTipoVeiculoDto } from './dto/update-tipo-veiculo.dto';

@Injectable()
export class TiposVeiculoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTipoVeiculoDto) {
    return this.prisma.tipoVeiculo.create({ data: { ...dto } });
  }

  async findAll(tenantId?: string, search?: string) {
    const where: Prisma.TipoVeiculoWhereInput = { ativo: true };
    if (tenantId) where.tenantId = tenantId;
    if (search) where.descricao = { contains: search };

    return this.prisma.tipoVeiculo.findMany({
      where,
      orderBy: { descricao: 'asc' },
    });
  }

  async findOne(id: string) {
    const entity = await this.prisma.tipoVeiculo.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Tipo de veiculo nao encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateTipoVeiculoDto) {
    await this.findOne(id);
    return this.prisma.tipoVeiculo.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tipoVeiculo.update({ where: { id }, data: { ativo: false } });
  }
}
