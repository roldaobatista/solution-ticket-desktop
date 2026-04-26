import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

@Injectable()
export class PerfisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePerfilDto, tenantId: string) {
    const { permissoes, ...data } = dto;
    const perfil = await this.prisma.perfil.create({ data: { ...data, tenantId } });

    if (permissoes && permissoes.length > 0) {
      await this.prisma.permissao.createMany({
        data: permissoes.map((p) => ({
          perfilId: perfil.id,
          modulo: p.modulo,
          acao: p.acao,
          concedido: p.concedido ?? true,
        })),
      });
    }

    return this.findOne(perfil.id, tenantId);
  }

  async findAll(tenantId?: string) {
    const where: Prisma.PerfilWhereInput = { ativo: true };
    if (tenantId) where.tenantId = tenantId;

    return this.prisma.perfil.findMany({
      where,
      include: {
        _count: { select: { usuarios: true, permissoes: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const perfil = await this.prisma.perfil.findUnique({
      where: { id, tenantId },
      include: {
        permissoes: true,
        _count: { select: { usuarios: true } },
      },
    });
    if (!perfil) throw new NotFoundException('Perfil nao encontrado');
    return perfil;
  }

  async update(id: string, dto: UpdatePerfilDto, tenantId: string) {
    await this.findOne(id, tenantId);
    const { permissoes, ...data } = dto;

    await this.prisma.perfil.update({ where: { id, tenantId }, data });

    if (permissoes) {
      // Substitui permissoes
      await this.prisma.permissao.deleteMany({ where: { perfilId: id } });
      if (permissoes.length > 0) {
        await this.prisma.permissao.createMany({
          data: permissoes.map((p) => ({
            perfilId: id,
            modulo: p.modulo,
            acao: p.acao,
            concedido: p.concedido ?? true,
          })),
        });
      }
    }

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.perfil.update({ where: { id, tenantId }, data: { ativo: false } });
  }
}
