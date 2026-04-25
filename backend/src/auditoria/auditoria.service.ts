import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaFilterDto } from './dto/auditoria-filter.dto';

type EstadoAuditavel = string | Record<string, unknown> | null | undefined;

function serializarEstado(e: EstadoAuditavel): string | null {
  if (e === null || e === undefined) return null;
  return typeof e === 'string' ? e : JSON.stringify(e);
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(data: {
    entidade: string;
    entidadeId: string;
    evento: string;
    estadoAnterior?: EstadoAuditavel;
    estadoNovo?: EstadoAuditavel;
    usuarioId?: string;
    motivo?: string;
    tenantId: string;
  }) {
    return this.prisma.auditoria.create({
      data: {
        entidade: data.entidade,
        entidadeId: data.entidadeId,
        evento: data.evento,
        estadoAnterior: serializarEstado(data.estadoAnterior),
        estadoNovo: serializarEstado(data.estadoNovo),
        usuarioId: data.usuarioId || null,
        motivo: data.motivo || null,
        tenantId: data.tenantId,
      },
    });
  }

  async findAll(filter: AuditoriaFilterDto) {
    const where: Prisma.AuditoriaWhereInput = {};
    if (filter.entidade) where.entidade = filter.entidade;
    if (filter.entidadeId) where.entidadeId = filter.entidadeId;
    if (filter.evento) where.evento = { contains: filter.evento };
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
