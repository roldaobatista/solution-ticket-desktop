import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StatusComercial } from '../constants/enums';
import { buildPaginated, resolvePaging } from '../common/dto/pagination.dto';
import { CreateRomaneioDto } from './dto/create-romaneio.dto';
import { UpdateRomaneioDto } from './dto/update-romaneio.dto';

@Injectable()
export class RomaneioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRomaneioDto) {
    const numero = await this.gerarNumero(dto.tenantId);

    const romaneio = await this.prisma.romaneio.create({
      data: {
        numero,
        tenantId: dto.tenantId,
        clienteId: dto.clienteId,
        periodoInicio: new Date(dto.periodoInicio),
        periodoFim: new Date(dto.periodoFim),
        observacao: dto.observacao ?? null,
      },
    });

    // Vincular tickets
    if (dto.ticketIds?.length) {
      await this.vincularTickets(romaneio.id, dto.ticketIds);
    }

    return this.findOne(romaneio.id);
  }

  async findAll(tenantId: string, clienteId?: string, paging?: { page?: number; limit?: number }) {
    const where: Prisma.RomaneioWhereInput = { tenantId };
    if (clienteId) where.clienteId = clienteId;
    const { page, limit, skip } = resolvePaging(paging ?? {});

    const [data, total] = await Promise.all([
      this.prisma.romaneio.findMany({
        where,
        skip,
        take: limit,
        include: {
          cliente: { select: { id: true, razaoSocial: true } },
          itens: { include: { ticket: { select: { numero: true, pesoLiquidoFinal: true } } } },
          _count: { select: { itens: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.romaneio.count({ where }),
    ]);

    return buildPaginated(data, total, page, limit);
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

  async update(id: string, dto: UpdateRomaneioDto) {
    await this.findOne(id);
    const data: Prisma.RomaneioUpdateInput = {};
    if (dto.observacao !== undefined) data.observacao = dto.observacao;
    if (dto.periodoInicio !== undefined) data.periodoInicio = new Date(dto.periodoInicio);
    if (dto.periodoFim !== undefined) data.periodoFim = new Date(dto.periodoFim);
    return this.prisma.romaneio.update({ where: { id }, data });
  }

  async vincularTickets(romaneioId: string, ticketIds: string[]) {
    // B4: vinculacao N tickets envolve N inserts (itemRomaneio) + N updates
    // (ticket.statusComercial) + 1 update (romaneio.pesoTotal). Sem transacao
    // uma falha no meio (ticket invalido, FK, deadlock) deixa romaneio
    // inconsistente. Tudo numa interactive transaction.
    return this.prisma
      .$transaction(async (tx) => {
        const romaneio = await tx.romaneio.findUnique({ where: { id: romaneioId } });
        if (!romaneio) throw new NotFoundException('Romaneio nao encontrado');

        let pesoTotal = 0;

        for (let i = 0; i < ticketIds.length; i++) {
          const ticketId = ticketIds[i];
          const ticket = await tx.ticketPesagem.findUnique({ where: { id: ticketId } });

          if (!ticket) throw new NotFoundException(`Ticket ${ticketId} nao encontrado`);
          if (!ticket.pesoLiquidoFinal) {
            throw new BadRequestException(`Ticket ${ticket.numero} nao possui peso liquido final`);
          }
          if (ticket.statusComercial === StatusComercial.ROMANEADO) {
            throw new BadRequestException(`Ticket ${ticket.numero} ja esta romaneado`);
          }

          pesoTotal += Number(ticket.pesoLiquidoFinal);

          await tx.itemRomaneio.create({
            data: {
              romaneioId,
              ticketId,
              sequencia: i + 1,
              peso: ticket.pesoLiquidoFinal,
            },
          });

          await tx.ticketPesagem.update({
            where: { id: ticketId },
            data: { statusComercial: StatusComercial.ROMANEADO },
          });
        }

        await tx.romaneio.update({ where: { id: romaneioId }, data: { pesoTotal } });

        // findOne fora da tx ja capta estado pos-commit; mantemos chamada externa
        // para preservar shape de retorno com includes.
        return romaneioId;
      })
      .then((id) => this.findOne(id));
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.romaneio.count({ where: { tenantId } });
    return `ROM-${String(count + 1).padStart(6, '0')}`;
  }
}
