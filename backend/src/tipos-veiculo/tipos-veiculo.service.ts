import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoVeiculoDto } from './dto/create-tipo-veiculo.dto';
import { UpdateTipoVeiculoDto } from './dto/update-tipo-veiculo.dto';

@Injectable()
export class TiposVeiculoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTipoVeiculoDto, tenantId: string) {
    return this.prisma.tipoVeiculo.create({ data: { ...dto, tenantId } });
  }

  async findAll(tenantId: string | undefined, search?: string) {
    if (!tenantId) throw new BadRequestException('Tenant obrigatorio');
    const where: Prisma.TipoVeiculoWhereInput = { ativo: true, tenantId };
    if (search) where.descricao = { contains: search };

    return this.prisma.tipoVeiculo.findMany({
      where,
      orderBy: { descricao: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const entity = await this.prisma.tipoVeiculo.findUnique({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Tipo de veiculo nao encontrado');
    return entity;
  }

  async update(id: string, dto: UpdateTipoVeiculoDto, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.tipoVeiculo.update({ where: { id, tenantId }, data: { ...dto } });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.tipoVeiculo.update({ where: { id, tenantId }, data: { ativo: false } });
  }
}
