export class TicketCriadoEvent {
  constructor(
    public readonly ticketId: string,
    public readonly tenantId: string,
  ) {}
}

export class TicketFechadoEvent {
  constructor(
    public readonly ticketId: string,
    public readonly tenantId: string,
  ) {}
}

export class StatusComercialAlteradoEvent {
  constructor(
    public readonly ticketId: string,
    public readonly tenantId: string,
    public readonly statusAnterior: string,
    public readonly statusNovo: string,
  ) {}
}

export class TicketReimpressoEvent {
  constructor(
    public readonly ticketId: string,
    public readonly tenantId: string,
    public readonly usuarioId?: string,
  ) {}
}
