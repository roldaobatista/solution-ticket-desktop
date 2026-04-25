import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  create(tenantId: string, data: { nome: string; modulo: string; filtros: any }) {
    const filtrosStr =
      typeof data.filtros === 'string' ? data.filtros : JSON.stringify(data.filtros ?? {});
    return this.prisma.relatorioSalvo.create({
      data: { tenantId, nome: data.nome, modulo: data.modulo, filtros: filtrosStr },
    });
  }

  async update(id: string, tenantId: string, data: { nome?: string; filtros?: any }) {
    await this.get(id, tenantId);
    const payload: any = {};
    if (data.nome !== undefined) payload.nome = data.nome;
    if (data.filtros !== undefined) {
      payload.filtros =
        typeof data.filtros === 'string' ? data.filtros : JSON.stringify(data.filtros);
    }
    return this.prisma.relatorioSalvo.update({ where: { id }, data: payload });
  }

  async remove(id: string, tenantId: string) {
    await this.get(id, tenantId);
    await this.prisma.relatorioSalvo.delete({ where: { id } });
    return { ok: true };
  }
}
