import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TicketCriadoEvent,
  TicketFechadoEvent,
  StatusComercialAlteradoEvent,
} from './events/ticket.events';

/**
 * D11: Publicador de eventos de domínio do ticket.
 * Centraliza emissão para garantir consistência e facilitar testes.
 */
@Injectable()
export class TicketEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitTicketCriado(ticketId: string, tenantId: string): void {
    this.eventEmitter.emit('ticket.criado', new TicketCriadoEvent(ticketId, tenantId));
  }

  emitTicketAtualizado(ticketId: string, tenantId: string): void {
    this.eventEmitter.emit('ticket.atualizado', new TicketCriadoEvent(ticketId, tenantId));
  }

  emitTicketFechado(ticketId: string, tenantId: string): void {
    this.eventEmitter.emit('ticket.fechado', new TicketFechadoEvent(ticketId, tenantId));
  }

  emitStatusComercialAlterado(
    ticketId: string,
    tenantId: string,
    statusAnterior: string,
    statusNovo: string,
  ): void {
    this.eventEmitter.emit(
      'ticket.status_comercial_alterado',
      new StatusComercialAlteradoEvent(ticketId, tenantId, statusAnterior, statusNovo),
    );
  }
}
