import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Atualiza timestamps de "última conexão" e "última leitura" da balança.
 * Chamado pelo BalancaConnectionService após eventos relevantes.
 */
@Injectable()
export class BalancaTelemetriaService {
  private readonly logger = new Logger(BalancaTelemetriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async marcarConexao(balancaId: string) {
    try {
      await this.prisma.balanca.update({
        where: { id: balancaId },
        data: { ultimaConexao: new Date() },
      });
    } catch (err) {
      this.logger.debug(`Falha ao marcar conexão ${balancaId}: ${(err as Error).message}`);
    }
  }

  async marcarLeitura(balancaId: string) {
    try {
      await this.prisma.balanca.update({
        where: { id: balancaId },
        data: { ultimaLeitura: new Date() },
      });
    } catch (err) {
      this.logger.debug(`Falha ao marcar leitura ${balancaId}: ${(err as Error).message}`);
    }
  }

  /** Retorna balanças com timestamps + status para dashboard. */
  async statusFrota(unidadeId?: string) {
    return this.prisma.balanca.findMany({
      where: { ativo: true, ...(unidadeId ? { unidadeId } : {}) },
      select: {
        id: true,
        nome: true,
        protocolo: true,
        statusOnline: true,
        ultimaConexao: true,
        ultimaLeitura: true,
        unidadeId: true,
      },
      orderBy: { nome: 'asc' },
    });
  }
}
