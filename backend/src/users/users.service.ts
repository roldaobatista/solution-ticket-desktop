import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_COST_PROD } from '../auth/bcrypt-cost';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, tenantId: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existente = await this.prisma.usuario.findFirst({
      where: { email: normalizedEmail, tenantId },
    });
    if (existente) {
      throw new ConflictException('Email já cadastrado neste tenant');
    }

    const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_COST_PROD);

    const usuario = await this.prisma.usuario.create({
      data: {
        tenantId,
        nome: dto.nome,
        email: normalizedEmail,
        senhaHash,
        ativo: dto.ativo ?? true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        ultimoAcesso: true,
        criadoEm: true,
        atualizadoEm: true,
        perfis: { include: { perfil: { select: { id: true, nome: true } } } },
      },
    });

    // Vincular perfis
    if (dto.perfilIds?.length) {
      await this.prisma.usuarioPerfil.createMany({
        data: dto.perfilIds.map((perfilId) => ({
          usuarioId: usuario.id,
          perfilId,
        })),
      });
    }

    return usuario;
  }

  async findAll(filter: UserFilterDto, tenantId: string) {
    const where: Prisma.UsuarioWhereInput = { tenantId };
    if (filter.nome) where.nome = { contains: filter.nome };
    if (filter.email) where.email = { contains: filter.email };
    if (filter.ativo !== undefined) where.ativo = filter.ativo;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
          ultimoAcesso: true,
          tentativasLogin: true,
          bloqueadoAte: true,
          criadoEm: true,
          atualizadoEm: true,
          perfis: { include: { perfil: { select: { id: true, nome: true } } } },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        ultimoAcesso: true,
        tentativasLogin: true,
        bloqueadoAte: true,
        criadoEm: true,
        atualizadoEm: true,
        tenantId: true,
        perfis: { include: { perfil: { select: { id: true, nome: true, descricao: true } } } },
      },
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async update(id: string, dto: UpdateUserDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: Prisma.UsuarioUpdateInput = {};
    if (dto.nome) data.nome = dto.nome;
    if (dto.email) data.email = dto.email.toLowerCase().trim();
    if (dto.ativo !== undefined) data.ativo = dto.ativo;
    if (dto.senha) data.senhaHash = await bcrypt.hash(dto.senha, BCRYPT_COST_PROD);

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        ultimoAcesso: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    // Atualizar perfis
    if (dto.perfilIds) {
      await this.prisma.usuarioPerfil.deleteMany({ where: { usuarioId: id } });
      await this.prisma.usuarioPerfil.createMany({
        data: dto.perfilIds.map((perfilId) => ({ usuarioId: id, perfilId })),
      });
    }

    return usuario;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.usuarioPerfil.deleteMany({ where: { usuarioId: id } });
    await this.prisma.usuario.delete({ where: { id } });
    return { message: 'Usuário removido com sucesso' };
  }
}
