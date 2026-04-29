import { Injectable, Logger, BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomacaoAdapter } from './automacao.adapter';
import { AUTOMACAO_ADAPTER } from './automacao.tokens';

const DISPOSITIVOS_VALIDOS = new Set(['SEMAFORO', 'CANCELA']);
const COMANDOS_POR_DISPOSITIVO: Record<string, Set<string>> = {
  SEMAFORO: new Set(['VERDE', 'VERMELHO', 'AMARELO']),
  CANCELA: new Set(['ABRIR', 'FECHAR']),
};

/**
 * Servico de automacao — grava o historico e delega a execucao fisica ao
 * AutomacaoAdapter (Modbus quando AUTOMACAO_MODBUS_HOST esta definido,
 * no-op caso contrario). Atualiza status para EXECUTADO/FALHA conforme
 * a resposta do adapter.
 */
@Injectable()
export class AutomacaoService {
  private readonly logger = new Logger(AutomacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTOMACAO_ADAPTER) private readonly adapter: AutomacaoAdapter,
  ) {}

  async enviarComando(
    input: {
      unidadeId: string;
      dispositivo: string;
      comando: string;
      motivo?: string;
      ticketId?: string;
      usuarioId?: string;
    },
    tenantId: string,
  ) {
    const dispositivo = input.dispositivo?.toUpperCase();
    const comando = input.comando?.toUpperCase();
    if (!DISPOSITIVOS_VALIDOS.has(dispositivo)) {
      throw new BadRequestException(`Dispositivo inválido: ${input.dispositivo}`);
    }
    if (!COMANDOS_POR_DISPOSITIVO[dispositivo].has(comando)) {
      throw new BadRequestException(`Comando ${comando} não suportado por ${dispositivo}`);
    }
    await this.ensureUnidadeTenant(input.unidadeId, tenantId);
    if (input.ticketId) await this.ensureTicketTenant(input.ticketId, tenantId);

    const evento = await this.prisma.eventoAutomacao.create({
      data: {
        unidadeId: input.unidadeId,
        dispositivo,
        comando,
        motivo: input.motivo,
        ticketId: input.ticketId,
        usuarioId: input.usuarioId,
        status: 'PENDENTE',
      },
    });

    this.logger.log(
      `Comando agendado: ${dispositivo}/${comando} unidade=${input.unidadeId} (id=${evento.id})`,
    );

    // Delega a execucao fisica ao adapter; a UI nao precisa esperar o ack.
    void this.dispararAdapter(evento.id, {
      unidadeId: input.unidadeId,
      dispositivo: dispositivo as 'SEMAFORO' | 'CANCELA',
      comando,
    });
    return evento;
  }

  private async dispararAdapter(
    eventoId: string,
    cmd: { unidadeId: string; dispositivo: 'SEMAFORO' | 'CANCELA'; comando: string },
  ) {
    try {
      const r = await this.adapter.executar(cmd);
      if (r.ok) {
        await this.marcarExecutado(eventoId);
      } else {
        await this.marcarFalha(eventoId, r.motivo ?? 'falha desconhecida');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Falha no adapter: ${msg}`);
      try {
        await this.marcarFalha(eventoId, msg);
      } catch {
        /* ignore */
      }
    }
  }

  async marcarExecutado(id: string, tenantId?: string) {
    if (tenantId) await this.ensureEventoTenant(id, tenantId);
    return this.prisma.eventoAutomacao.update({
      where: { id },
      data: { status: 'EXECUTADO', executadoEm: new Date() },
    });
  }

  async marcarFalha(id: string, motivo: string, tenantId?: string) {
    if (tenantId) await this.ensureEventoTenant(id, tenantId);
    return this.prisma.eventoAutomacao.update({
      where: { id },
      data: { status: 'FALHA', motivo, executadoEm: new Date() },
    });
  }

  async historico(unidadeId: string, tenantId: string, limit = 50) {
    await this.ensureUnidadeTenant(unidadeId, tenantId);
    return this.prisma.eventoAutomacao.findMany({
      where: { unidadeId },
      orderBy: { criadoEm: 'desc' },
      take: limit,
    });
  }

  private async ensureUnidadeTenant(unidadeId: string, tenantId: string) {
    const unidade = await this.prisma.unidade.findFirst({
      where: { id: unidadeId, empresa: { tenantId } },
      select: { id: true },
    });
    if (!unidade) throw new NotFoundException('Unidade nao encontrada');
  }

  private async ensureTicketTenant(ticketId: string, tenantId: string) {
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId, tenantId },
      select: { id: true },
    });
    if (!ticket) throw new NotFoundException('Ticket nao encontrado');
  }

  private async ensureEventoTenant(id: string, tenantId: string) {
    const evento = await this.prisma.eventoAutomacao.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento de automacao nao encontrado');
    await this.ensureUnidadeTenant(evento.unidadeId, tenantId);
  }
}
