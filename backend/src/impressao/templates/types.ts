import { Prisma } from '@prisma/client';

export const ticketComRelacoesArgs = Prisma.validator<Prisma.TicketPesagemDefaultArgs>()({
  include: {
    cliente: true,
    produto: true,
    veiculo: true,
    motorista: true,
    transportadora: true,
    origem: true,
    destino: true,
    passagens: true,
    descontos: true,
    unidade: { include: { empresa: true } },
  },
});

export type TicketComRelacoes = Prisma.TicketPesagemGetPayload<typeof ticketComRelacoesArgs>;

export type PassagemRender = TicketComRelacoes['passagens'][number];
export type DescontoRender = TicketComRelacoes['descontos'][number];
export type EmpresaRender = NonNullable<TicketComRelacoes['unidade']['empresa']>;
export type UnidadeRender = TicketComRelacoes['unidade'];
