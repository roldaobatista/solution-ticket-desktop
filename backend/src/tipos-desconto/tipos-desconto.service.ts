import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoDescontoDto, UpdateTipoDescontoDto } from './dto/create-tipo-desconto.dto';

@Injectable()
export class TiposDescontoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTipoDescontoDto) {
    return this.prisma.tipoDesconto.create({
      data: {
        tenantId: dto.tenantId,
        descricao: dto.descricao,
        tipo: dto.tipo || 'PERCENTUAL',
        teto: dto.teto ?? null,
        carencia: dto.carencia ?? null,
        mantem: dto.mantem ?? false,
        calcula: dto.calcula ?? true,
        visivelPE: dto.visivelPE ?? true,
        visivelPS: dto.visivelPS ?? true,
        visivelPortaria: dto.visivelPortaria ?? false,
        visivelApontamento: dto.visivelApontamento ?? false,
        visivelPosApontamento: dto.visivelPosApontamento ?? false,
        valor: dto.valor ?? null,
        original: dto.original ?? false,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll(tenantId: string, apenasAtivos = false) {
    const where: Prisma.TipoDescontoWhereInput = { tenantId };
    if (apenasAtivos) where.ativo = true;
    return this.prisma.tipoDesconto.findMany({ where, orderBy: { descricao: 'asc' } });
  }

  async findOne(id: string) {
    const r = await this.prisma.tipoDesconto.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Tipo de desconto nao encontrado');
    return r;
  }

  async update(id: string, dto: UpdateTipoDescontoDto) {
    await this.findOne(id);
    const patch: Prisma.TipoDescontoUpdateInput = {};
    if (dto.descricao !== undefined) patch.descricao = dto.descricao;
    if (dto.tipo !== undefined) patch.tipo = dto.tipo;
    if (dto.teto !== undefined) patch.teto = dto.teto;
    if (dto.carencia !== undefined) patch.carencia = dto.carencia;
    if (dto.mantem !== undefined) patch.mantem = dto.mantem;
    if (dto.calcula !== undefined) patch.calcula = dto.calcula;
    if (dto.visivelPE !== undefined) patch.visivelPE = dto.visivelPE;
    if (dto.visivelPS !== undefined) patch.visivelPS = dto.visivelPS;
    if (dto.visivelPortaria !== undefined) patch.visivelPortaria = dto.visivelPortaria;
    if (dto.visivelApontamento !== undefined) patch.visivelApontamento = dto.visivelApontamento;
    if (dto.visivelPosApontamento !== undefined)
      patch.visivelPosApontamento = dto.visivelPosApontamento;
    if (dto.valor !== undefined) patch.valor = dto.valor;
    if (dto.original !== undefined) patch.original = dto.original;
    if (dto.ativo !== undefined) patch.ativo = dto.ativo;
    return this.prisma.tipoDesconto.update({ where: { id }, data: patch });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tipoDesconto.update({ where: { id }, data: { ativo: false } });
  }

  async seedPadrao(tenantId: string) {
    const existentes = await this.prisma.tipoDesconto.count({ where: { tenantId } });
    if (existentes > 0) return { criado: false, quantidade: existentes };

    const padroes = [
      { descricao: 'Tara Tecnica', tipo: 'PERCENTUAL', valor: 0, original: true },
      { descricao: 'Sacaria', tipo: 'VALOR_KG', valor: 0, original: true },
      { descricao: 'Agua Livre', tipo: 'PERCENTUAL', valor: 0, original: true },
      { descricao: 'Impurezas', tipo: 'PERCENTUAL', valor: 0, original: true },
      { descricao: 'Cliente', tipo: 'MANUAL', valor: 0, original: false },
    ];
    for (const p of padroes) {
      await this.prisma.tipoDesconto.create({
        data: {
          tenantId,
          descricao: p.descricao,
          tipo: p.tipo,
          valor: p.valor,
          original: p.original,
          mantem: false,
          calcula: true,
          visivelPE: true,
          visivelPS: true,
        },
      });
    }
    return { criado: true, quantidade: padroes.length };
  }
}
