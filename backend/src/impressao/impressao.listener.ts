import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ImpressaoService } from './impressao.service';
import {
  TicketCriadoEvent,
  TicketFechadoEvent,
  StatusComercialAlteradoEvent,
} from '../ticket/events/ticket.events';

@Injectable()
export class ImpressaoListener {
  private readonly logger = new Logger(ImpressaoListener.name);

  constructor(private readonly impressaoService: ImpressaoService) {}

  @OnEvent('ticket.criado')
  handleTicketCriado(event: TicketCriadoEvent) {
    this.logger.debug(`Ticket criado: ${event.ticketId}`);
    // Futuro: pré-gerar bilhete, notificar fila de impressão, etc.
  }

  @OnEvent('ticket.fechado')
  async handleTicketFechado(event: TicketFechadoEvent) {
    this.logger.debug(`Ticket fechado: ${event.ticketId}`);
    try {
      await this.impressaoService.gerarTicketPdf(event.ticketId);
    } catch (err: unknown) {
      this.logger.error(`Falha ao gerar PDF pós-fechamento: ${event.ticketId}`, err);
    }
  }

  @OnEvent('ticket.status_comercial_alterado')
  handleStatusComercialAlterado(event: StatusComercialAlteradoEvent) {
    this.logger.debug(
      `Status comercial alterado: ${event.ticketId} ${event.statusAnterior} -> ${event.statusNovo}`,
    );
  }
}
