import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TiposDescontoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.tipoDesconto.create({
      data: {
        tenantId: data.tenantId,
        descricao: data.descricao,
        tipo: data.tipo || 'PERCENTUAL',
        teto: data.teto ?? null,
        carencia: data.carencia ?? null,
        mantem: data.mantem ?? false,
        calcula: data.calcula ?? true,
        visivelPE: data.visivelPE ?? true,
        visivelPS: data.visivelPS ?? true,
        visivelPortaria: data.visivelPortaria ?? false,
        visivelApontamento: data.visivelApontamento ?? false,
        visivelPosApontamento: data.visivelPosApontamento ?? false,
        valor: data.valor ?? null,
        original: data.original ?? false,
        ativo: data.ativo ?? true,
      },
    });
  }

  async findAll(tenantId: string, apenasAtivos = false) {
    const where: any = { tenantId };
    if (apenasAtivos) where.ativo = true;
    return this.prisma.tipoDesconto.findMany({ where, orderBy: { descricao: 'asc' } });
  }

  async findOne(id: string) {
    const r = await this.prisma.tipoDesconto.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Tipo de desconto nao encontrado');
    return r;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    const patch: any = { ...data };
    delete patch.id;
    delete patch.criadoEm;
    delete patch.atualizadoEm;
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
