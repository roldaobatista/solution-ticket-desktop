import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * D10: Verificação de licenciamento antes de operações de ticket.
 * Isolado para facilitar testes unitários e mocks.
 */
export class TicketLicenseGuard {
  constructor(private readonly prisma: PrismaService) {}

  async verificarLicenca(unidadeId: string): Promise<void> {
    const licenca = await this.prisma.licencaInstalacao.findFirst({
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

  async decrementarPesagemTrial(unidadeId: string): Promise<void> {
    const licenca = await this.prisma.licencaInstalacao.findFirst({
      where: { unidadeId },
    });
    if (!licenca) return;
    if (licenca.statusLicenca !== 'TRIAL') return;
    if (licenca.pesagensRestantesTrial === null || licenca.pesagensRestantesTrial === undefined)
      return;
    if (licenca.pesagensRestantesTrial <= 0) return;

    await this.prisma.licencaInstalacao.update({
      where: { id: licenca.id },
      data: { pesagensRestantesTrial: licenca.pesagensRestantesTrial - 1 },
    });
  }
}
