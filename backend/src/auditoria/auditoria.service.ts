import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaFilterDto } from './dto/auditoria-filter.dto';

type EstadoAuditavel = string | Record<string, unknown> | null | undefined;
type RegistroAuditoriaInput = {
  entidade: string;
  entidadeId: string;
  evento: string;
  estadoAnterior?: EstadoAuditavel;
  estadoNovo?: EstadoAuditavel;
  usuarioId?: string;
  motivo?: string;
  tenantId: string;
};

function serializarEstado(e: EstadoAuditavel): string | null {
  if (e === null || e === undefined) return null;
  return typeof e === 'string' ? e : JSON.stringify(e);
}

function canonicalizar(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizar);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalizar((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

function sha256(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalizar(value)))
    .digest('hex');
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(data: RegistroAuditoriaInput) {
    return this.prisma.$transaction((tx) => this.registrarEmTransacao(tx, data));
  }

  async registrarEmTransacao(tx: Prisma.TransactionClient, data: RegistroAuditoriaInput) {
    const estadoAnterior = serializarEstado(data.estadoAnterior);
    const estadoNovo = serializarEstado(data.estadoNovo);
    const dataHora = new Date();

    const anterior = await tx.auditoria.findFirst({
      where: { tenantId: data.tenantId },
      orderBy: [{ dataHora: 'desc' }, { id: 'desc' }],
      select: { hash: true },
    });
    const prevHash = anterior?.hash ?? null;
    const hash = sha256({
      tenantId: data.tenantId,
      entidade: data.entidade,
      entidadeId: data.entidadeId,
      evento: data.evento,
      estadoAnterior,
      estadoNovo,
      usuarioId: data.usuarioId || null,
      motivo: data.motivo || null,
      dataHora: dataHora.toISOString(),
      prevHash,
    });

    return tx.auditoria.create({
      data: {
        entidade: data.entidade,
        entidadeId: data.entidadeId,
        evento: data.evento,
        estadoAnterior,
        estadoNovo,
        usuarioId: data.usuarioId || null,
        motivo: data.motivo || null,
        tenantId: data.tenantId,
        dataHora,
        prevHash,
        hash,
      },
    });
  }

  async verificarCadeia(tenantId: string) {
    const registros = await this.prisma.auditoria.findMany({
      where: { tenantId },
      orderBy: [{ dataHora: 'asc' }, { id: 'asc' }],
    });

    let prevHash: string | null = null;
    for (const registro of registros) {
      if (registro.hash === 'legacy') {
        prevHash = registro.hash;
        continue;
      }
      const esperado = sha256({
        tenantId: registro.tenantId,
        entidade: registro.entidade,
        entidadeId: registro.entidadeId,
        evento: registro.evento,
        estadoAnterior: registro.estadoAnterior,
        estadoNovo: registro.estadoNovo,
        usuarioId: registro.usuarioId,
        motivo: registro.motivo,
        dataHora: registro.dataHora.toISOString(),
        prevHash,
      });
      if (registro.prevHash !== prevHash || registro.hash !== esperado) {
        return {
          ok: false,
          total: registros.length,
          falhaEm: registro.id,
          esperado,
          encontrado: registro.hash,
        };
      }
      prevHash = registro.hash;
    }

    return { ok: true, total: registros.length, ultimoHash: prevHash };
  }

  async findAll(filter: AuditoriaFilterDto, tenantId: string) {
    const where: Prisma.AuditoriaWhereInput = { tenantId };
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

  async recentes(tenantId: string, limit: number = 20) {
    const take = Math.max(1, Math.min(limit, 200));
    return this.prisma.auditoria.findMany({
      where: { tenantId },
      take,
      orderBy: { dataHora: 'desc' },
    });
  }

  async findByEntidade(entidade: string, entidadeId: string, tenantId: string) {
    return this.prisma.auditoria.findMany({
      where: { entidade, entidadeId, tenantId },
      orderBy: { dataHora: 'desc' },
    });
  }
}
