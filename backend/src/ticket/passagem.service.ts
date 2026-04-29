import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdicionarDescontoDto } from './dto/adicionar-desconto.dto';
import { StatusComercial, StatusOperacional, StatusPassagem } from '../constants/enums';

@Injectable()
export class PassagemService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTicket(ticketId: string, tenantId: string) {
    // Verifica se o ticket pertence ao tenant antes de listar passagens
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Ticket nao encontrado');

    return this.prisma.passagemPesagem.findMany({
      where: { ticketId },
      orderBy: { sequencia: 'asc' },
      include: { balanca: true, usuario: { select: { id: true, nome: true } } },
    });
  }

  async invalidar(
    ticketId: string,
    passagemId: string,
    motivo: string | undefined,
    tenantId: string,
  ) {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Ticket nao encontrado');

    const estadosPermitidos: string[] = [
      StatusOperacional.EM_PESAGEM,
      StatusOperacional.AGUARDANDO_PASSAGEM,
      StatusOperacional.EM_MANUTENCAO,
    ];
    if (!estadosPermitidos.includes(ticket.statusOperacional)) {
      throw new BadRequestException(
        `Nao e permitido invalidar passagem no estado ${ticket.statusOperacional}`,
      );
    }

    const passagem = await this.prisma.passagemPesagem.findFirst({
      where: { id: passagemId, ticketId },
    });
    if (!passagem) throw new NotFoundException('Passagem nao encontrada');

    if (passagem.statusPassagem === StatusPassagem.INVALIDADA) {
      throw new BadRequestException('Passagem ja esta invalidada');
    }

    return this.prisma.passagemPesagem.update({
      where: { id: passagemId },
      data: {
        statusPassagem: StatusPassagem.INVALIDADA,
        motivoInvalidacao: motivo || 'Invalidada pelo operador',
      },
    });
  }

  async adicionarDesconto(ticketId: string, dto: AdicionarDescontoDto, tenantId: string) {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Ticket nao encontrado');

    const estadosOperacionaisEditaveis: string[] = [
      StatusOperacional.ABERTO,
      StatusOperacional.EM_PESAGEM,
      StatusOperacional.AGUARDANDO_PASSAGEM,
    ];
    if (!estadosOperacionaisEditaveis.includes(ticket.statusOperacional)) {
      throw new BadRequestException(
        `Nao e permitido adicionar desconto no estado ${ticket.statusOperacional}`,
      );
    }

    if (ticket.statusComercial !== StatusComercial.NAO_ROMANEADO) {
      throw new BadRequestException(
        `Nao e permitido adicionar desconto com status comercial ${ticket.statusComercial}`,
      );
    }

    return this.prisma.descontoPesagem.create({
      data: {
        ticketId,
        tipo: dto.tipo,
        descricao: dto.descricao || null,
        valor: dto.valor,
        percentual: dto.percentual || null,
        origem: dto.origem || 'manual',
      },
    });
  }

  async listarDescontos(ticketId: string, tenantId: string) {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Ticket nao encontrado');

    return this.prisma.descontoPesagem.findMany({
      where: { ticketId },
      orderBy: { criadoEm: 'asc' },
    });
  }
}
