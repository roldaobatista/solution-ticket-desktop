import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ImpressaoService } from './impressao.service';
import { NotificacaoService } from '../mailer/notificacao.service';
import {
  TicketCriadoEvent,
  TicketFechadoEvent,
  StatusComercialAlteradoEvent,
} from '../ticket/events/ticket.events';

@Injectable()
export class ImpressaoListener {
  private readonly logger = new Logger(ImpressaoListener.name);

  constructor(
    private readonly impressaoService: ImpressaoService,
    private readonly notificacao: NotificacaoService,
  ) {}

  @OnEvent('ticket.criado')
  handleTicketCriado(event: TicketCriadoEvent) {
    this.logger.debug(`Ticket criado: ${event.ticketId}`);
    // Futuro: pré-gerar bilhete, notificar fila de impressão, etc.
  }

  @OnEvent('ticket.fechado')
  async handleTicketFechado(event: TicketFechadoEvent) {
    this.logger.debug(`Ticket fechado: ${event.ticketId}`);
    try {
      await this.impressaoService.gerarTicketPdf(event.ticketId, event.tenantId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Falha ao gerar PDF pós-fechamento: ${event.ticketId}`, err);
      try {
        await this.notificacao.notificar(event.tenantId, {
          evento: 'erro_impressao',
          assunto: `[Solution Ticket] Falha de impressao no ticket ${event.ticketId}`,
          texto: `Nao foi possivel gerar o PDF do ticket ${event.ticketId}.\n\nDetalhes: ${msg}`,
          html: `<p>Nao foi possivel gerar o PDF do ticket <strong>${event.ticketId}</strong>.</p><p><strong>Detalhes:</strong> ${msg}</p>`,
          dados: { ticketId: event.ticketId, mensagem: msg },
        });
      } catch (notifErr) {
        this.logger.warn(
          `Falha ao despachar notificacao de erro de impressao: ${(notifErr as Error).message}`,
        );
      }
    }
  }

  @OnEvent('ticket.status_comercial_alterado')
  handleStatusComercialAlterado(event: StatusComercialAlteradoEvent) {
    this.logger.debug(
      `Status comercial alterado: ${event.ticketId} ${event.statusAnterior} -> ${event.statusNovo}`,
    );
  }
}
