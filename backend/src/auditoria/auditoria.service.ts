import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaFilterDto } from './dto/auditoria-filter.dto';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(data: {
    entidade: string;
    entidadeId: string;
    evento: string;
    estadoAnterior?: any;
    estadoNovo?: any;
    usuarioId?: string;
    motivo?: string;
  }) {
    return this.prisma.auditoria.create({
      data: {
        entidade: data.entidade,
        entidadeId: data.entidadeId,
        evento: data.evento,
        estadoAnterior: data.estadoAnterior || null,
        estadoNovo: data.estadoNovo || null,
        usuarioId: data.usuarioId || null,
        motivo: data.motivo || null,
      },
    });
  }

  async findAll(filter: AuditoriaFilterDto) {
    const where: any = {};
    if (filter.entidade) where.entidade = filter.entidade;
    if (filter.entidadeId) where.entidadeId = filter.entidadeId;
    if (filter.evento) where.evento = { contains: filter.evento, mode: 'insensitive' };
    if (filter.usuarioId) where.usuarioId = filter.usuarioId;
    if (filter.dataInicio || filter.dataFim) {
      where.dataHora = {};
      if (filter.dataInicio) where.dataHora.gte = new Date(filter.dataInicio);
      if (filter.dataFim) where.dataHora.lte = new Date(filter.dataFim);
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dataHora: 'desc' },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async recentes(limit: number = 20) {
    const take = Math.max(1, Math.min(limit, 200));
    return this.prisma.auditoria.findMany({
      take,
      orderBy: { dataHora: 'desc' },
    });
  }

  async findByEntidade(entidade: string, entidadeId: string) {
    return this.prisma.auditoria.findMany({
      where: { entidade, entidadeId },
      orderBy: { dataHora: 'desc' },
    });
  }
}
