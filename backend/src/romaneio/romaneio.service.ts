import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusComercial } from '../constants/enums';

@Injectable()
export class RomaneioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const numero = await this.gerarNumero(data.tenantId);

    const romaneio = await this.prisma.romaneio.create({
      data: {
        numero,
        tenantId: data.tenantId,
        clienteId: data.clienteId,
        periodoInicio: new Date(data.periodoInicio),
        periodoFim: new Date(data.periodoFim),
        observacao: data.observacao || null,
      },
    });

    // Vincular tickets
    if (data.ticketIds?.length) {
      await this.vincularTickets(romaneio.id, data.ticketIds);
    }

    return this.findOne(romaneio.id);
  }

  async findAll(tenantId: string, clienteId?: string) {
    const where: any = { tenantId };
    if (clienteId) where.clienteId = clienteId;

    return this.prisma.romaneio.findMany({
      where,
      include: {
        cliente: { select: { id: true, razaoSocial: true } },
        itens: { include: { ticket: { select: { numero: true, pesoLiquidoFinal: true } } } },
        _count: { select: { itens: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string) {
    const romaneio = await this.prisma.romaneio.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: {
            ticket: {
              select: {
                id: true,
                numero: true,
                pesoBrutoApurado: true,
                pesoLiquidoFinal: true,
                fechadoEm: true,
                cliente: { select: { razaoSocial: true } },
                produto: { select: { descricao: true } },
              },
            },
          },
        },
        faturas: true,
      },
    });
    if (!romaneio) throw new NotFoundException('Romaneio nao encontrado');
    return romaneio;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.romaneio.update({
      where: { id },
      data: { ...data },
    });
  }

  async vincularTickets(romaneioId: string, ticketIds: string[]) {
    const romaneio = await this.findOne(romaneioId);

    let pesoTotal = 0;

    for (let i = 0; i < ticketIds.length; i++) {
      const ticketId = ticketIds[i];
      const ticket = await this.prisma.ticketPesagem.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) throw new NotFoundException(`Ticket ${ticketId} nao encontrado`);
      if (!ticket.pesoLiquidoFinal) {
        throw new BadRequestException(`Ticket ${ticket.numero} nao possui peso liquido final`);
      }
      if (ticket.statusComercial === StatusComercial.ROMANEADO) {
        throw new BadRequestException(`Ticket ${ticket.numero} ja esta romaneado`);
      }

      pesoTotal += Number(ticket.pesoLiquidoFinal);

      await this.prisma.itemRomaneio.create({
        data: {
          romaneioId,
          ticketId,
          sequencia: i + 1,
          peso: ticket.pesoLiquidoFinal,
        },
      });

      await this.prisma.ticketPesagem.update({
        where: { id: ticketId },
        data: { statusComercial: StatusComercial.ROMANEADO },
      });
    }

    await this.prisma.romaneio.update({
      where: { id: romaneioId },
      data: { pesoTotal },
    });

    return this.findOne(romaneioId);
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.romaneio.count({ where: { tenantId } });
    return `ROM-${String(count + 1).padStart(6, '0')}`;
  }
}
