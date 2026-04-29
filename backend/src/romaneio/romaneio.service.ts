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

  async create(dto: CreateRomaneioDto & { tenantId?: string }, tenantId?: string) {
    const effectiveTenantId = tenantId ?? dto.tenantId!;
    const numero = await this.gerarNumero(effectiveTenantId);

    const romaneio = await this.prisma.romaneio.create({
      data: {
        numero,
        tenantId: effectiveTenantId,
        clienteId: dto.clienteId,
        periodoInicio: new Date(dto.periodoInicio),
        periodoFim: new Date(dto.periodoFim),
        observacao: dto.observacao ?? null,
      },
    });

    // Vincular tickets
    if (dto.ticketIds?.length) {
      await this.vincularTickets(romaneio.id, dto.ticketIds, effectiveTenantId);
    }

    return this.findOne(romaneio.id, effectiveTenantId);
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

  async findOne(id: string, tenantId?: string) {
    const romaneio = await this.prisma.romaneio.findUnique({
      where: tenantId ? { id, tenantId } : { id },
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

  async update(id: string, tenantId: string, dto: UpdateRomaneioDto) {
    await this.findOne(id, tenantId);
    const data: Prisma.RomaneioUpdateInput = {};
    if (dto.observacao !== undefined) data.observacao = dto.observacao;
    if (dto.periodoInicio !== undefined) data.periodoInicio = new Date(dto.periodoInicio);
    if (dto.periodoFim !== undefined) data.periodoFim = new Date(dto.periodoFim);
    return this.prisma.romaneio.update({ where: { id, tenantId }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.romaneio.delete({ where: { id, tenantId } });
  }

  async vincularTickets(romaneioId: string, ticketIds: string[], tenantId: string) {
    // B4: vinculacao N tickets — eliminado N+1 via findMany + createMany + updateMany
    return this.prisma
      .$transaction(async (tx) => {
        const romaneio = await tx.romaneio.findUnique({ where: { id: romaneioId, tenantId } });
        if (!romaneio) throw new NotFoundException('Romaneio nao encontrado');

        const tickets = await tx.ticketPesagem.findMany({
          where: { id: { in: ticketIds }, tenantId, clienteId: romaneio.clienteId },
        });

        if (tickets.length !== ticketIds.length) {
          const found = new Set(tickets.map((t) => t.id));
          const missing = ticketIds.filter((id) => !found.has(id));
          throw new NotFoundException(`Tickets nao encontrados: ${missing.join(', ')}`);
        }

        let pesoTotal = 0;
        const itens: Prisma.ItemRomaneioCreateManyInput[] = [];

        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (!ticket.pesoLiquidoFinal) {
            throw new BadRequestException(`Ticket ${ticket.numero} nao possui peso liquido final`);
          }
          if (ticket.statusComercial === StatusComercial.ROMANEADO) {
            throw new BadRequestException(`Ticket ${ticket.numero} ja esta romaneado`);
          }
          pesoTotal += Number(ticket.pesoLiquidoFinal);
          itens.push({
            romaneioId,
            ticketId: ticket.id,
            sequencia: i + 1,
            peso: ticket.pesoLiquidoFinal,
          });
        }

        await tx.itemRomaneio.createMany({ data: itens });
        await tx.ticketPesagem.updateMany({
          where: { id: { in: ticketIds }, tenantId },
          data: { statusComercial: StatusComercial.ROMANEADO },
        });
        await tx.romaneio.update({ where: { id: romaneioId, tenantId }, data: { pesoTotal } });

        return romaneioId;
      })
      .then((id) => this.findOne(id, tenantId));
  }

  private async gerarNumero(tenantId: string): Promise<string> {
    const count = await this.prisma.romaneio.count({ where: { tenantId } });
    return `ROM-${String(count + 1).padStart(6, '0')}`;
  }
}
