import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaTx = Prisma.TransactionClient | PrismaService;

/**
 * D10: Verificação de licenciamento antes de operações de ticket.
 * Isolado para facilitar testes unitários e mocks.
 *
 * Onda 1: aceita TransactionClient opcional para que verificação e
 * decremento participem da mesma $transaction do fecharTicket.
 */
export class TicketLicenseGuard {
  constructor(private readonly prisma: PrismaService) {}

  async verificarLicenca(unidadeId: string, tx?: PrismaTx): Promise<void> {
    const client = tx ?? this.prisma;
    const licenca = await client.licencaInstalacao.findFirst({
      where: { unidadeId },
    });

    if (!licenca) return; // Sem licença = sem restrição

    const statusBloqueantes = ['EXPIRADA', 'BLOQUEADA', 'INVALIDA'];
    if (statusBloqueantes.includes(licenca.statusLicenca)) {
      throw new ForbiddenException(
        `Operação bloqueada: licença da unidade está ${licenca.statusLicenca}. Entre em contato com o suporte.`,
      );
    }

    if (
      licenca.statusLicenca === 'TRIAL' &&
      licenca.pesagensRestantesTrial !== null &&
      licenca.pesagensRestantesTrial <= 0
    ) {
      throw new ForbiddenException(
        'Periodo de trial expirado (limite de pesagens atingido). Ative sua licença para continuar.',
      );
    }
  }

  async decrementarPesagemTrial(unidadeId: string, tx?: PrismaTx): Promise<void> {
    const client = tx ?? this.prisma;
    const licenca = await client.licencaInstalacao.findFirst({
      where: { unidadeId },
    });
    if (!licenca) return;
    if (licenca.statusLicenca !== 'TRIAL') return;
    if (licenca.pesagensRestantesTrial === null || licenca.pesagensRestantesTrial === undefined)
      return;
    if (licenca.pesagensRestantesTrial <= 0) return;

    await client.licencaInstalacao.update({
      where: { id: licenca.id },
      data: { pesagensRestantesTrial: licenca.pesagensRestantesTrial - 1 },
    });
  }
}
