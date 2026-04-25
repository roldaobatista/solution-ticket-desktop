import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const StatusSolicitacaoAprovacao = {
  PENDENTE: 'PENDENTE',
  APROVADA: 'APROVADA',
  RECUSADA: 'RECUSADA',
  CANCELADA: 'CANCELADA',
} as const;

type TipoSolicitacaoAprovacao = string;
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';
import { AprovarSolicitacaoDto } from './dto/aprovar-solicitacao.dto';
import { SolicitacaoFilterDto } from './dto/solicitacao-filter.dto';

@Injectable()
export class ManutencaoService {
  constructor(private readonly prisma: PrismaService) {}

  async criarSolicitacao(dto: CreateSolicitacaoDto) {
    return this.prisma.solicitacaoAprovacao.create({
      data: {
        tipoSolicitacao: dto.tipoSolicitacao as TipoSolicitacaoAprovacao,
        entidadeAlvo: dto.entidadeAlvo,
        entidadeId: dto.entidadeId,
        solicitanteId: dto.solicitanteId,
        motivo: dto.motivo,
        status: StatusSolicitacaoAprovacao.PENDENTE,
        aprovadorPrimarioId: dto.aprovadorPrimarioId || null,
        aprovadorSecundarioId: dto.aprovadorSecundarioId || null,
      },
    });
  }

  async findAll(filter: SolicitacaoFilterDto) {
    const where: Prisma.SolicitacaoAprovacaoWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.tipoSolicitacao) where.tipoSolicitacao = filter.tipoSolicitacao;
    if (filter.solicitanteId) where.solicitanteId = filter.solicitanteId;
    if (filter.entidadeAlvo) where.entidadeAlvo = filter.entidadeAlvo;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.solicitacaoAprovacao.findMany({
        where,
        skip,
        take: limit,
        orderBy: { solicitadaEm: 'desc' },
      }),
      this.prisma.solicitacaoAprovacao.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const entity = await this.prisma.solicitacaoAprovacao.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Solicitacao nao encontrada');
    return entity;
  }

  async aprovar(id: string, dto: AprovarSolicitacaoDto) {
    const solicitacao = await this.findOne(id);
    if (solicitacao.status !== StatusSolicitacaoAprovacao.PENDENTE) {
      throw new Error('Solicitacao ja foi decidida');
    }

    return this.prisma.solicitacaoAprovacao.update({
      where: { id },
      data: {
        status: StatusSolicitacaoAprovacao.APROVADA,
        aprovadorPrimarioId: dto.aprovadorId,
        decididaEm: new Date(),
        justificativaDecisao: dto.justificativa || null,
      },
    });
  }

  async recusar(id: string, dto: AprovarSolicitacaoDto) {
    const solicitacao = await this.findOne(id);
    if (solicitacao.status !== StatusSolicitacaoAprovacao.PENDENTE) {
      throw new Error('Solicitacao ja foi decidida');
    }

    return this.prisma.solicitacaoAprovacao.update({
      where: { id },
      data: {
        status: StatusSolicitacaoAprovacao.RECUSADA,
        aprovadorPrimarioId: dto.aprovadorId,
        decididaEm: new Date(),
        justificativaDecisao: dto.justificativa || null,
      },
    });
  }
}
