import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRelatorioSalvoDto,
  FiltrosPayload,
  UpdateRelatorioSalvoDto,
} from './dto/create-relatorio-salvo.dto';

function serializarFiltros(filtros: FiltrosPayload): string {
  return typeof filtros === 'string' ? filtros : JSON.stringify(filtros ?? {});
}

@Injectable()
export class RelatoriosSalvosService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, modulo?: string) {
    return this.prisma.relatorioSalvo.findMany({
      where: { tenantId, ...(modulo ? { modulo } : {}) },
      orderBy: { atualizadoEm: 'desc' },
    });
  }

  async get(id: string, tenantId: string) {
    const r = await this.prisma.relatorioSalvo.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException();
    return r;
  }

  create(tenantId: string, data: CreateRelatorioSalvoDto) {
    return this.prisma.relatorioSalvo.create({
      data: {
        tenantId,
        nome: data.nome,
        modulo: data.modulo,
        filtros: serializarFiltros(data.filtros),
      },
    });
  }

  async update(id: string, tenantId: string, data: UpdateRelatorioSalvoDto) {
    await this.get(id, tenantId);
    const payload: Prisma.RelatorioSalvoUpdateInput = {};
    if (data.nome !== undefined) payload.nome = data.nome;
    if (data.filtros !== undefined) payload.filtros = serializarFiltros(data.filtros);
    return this.prisma.relatorioSalvo.update({ where: { id }, data: payload });
  }

  async remove(id: string, tenantId: string) {
    await this.get(id, tenantId);
    await this.prisma.relatorioSalvo.delete({ where: { id } });
    return { ok: true };
  }
}
