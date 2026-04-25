import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DISPOSITIVOS_VALIDOS = new Set(['SEMAFORO', 'CANCELA']);
const COMANDOS_POR_DISPOSITIVO: Record<string, Set<string>> = {
  SEMAFORO: new Set(['VERDE', 'VERMELHO', 'AMARELO']),
  CANCELA: new Set(['ABRIR', 'FECHAR']),
};

/**
 * Serviço de automação — registra e executa comandos para semáforo/cancela.
 * Adapter físico (Modbus/GPIO) será plugado em produção; este service grava
 * o histórico, retorna status PENDENTE e expõe o `executar()` que o adapter
 * chama quando o hardware confirma a ação.
 */
@Injectable()
export class AutomacaoService {
  private readonly logger = new Logger(AutomacaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enviarComando(input: {
    unidadeId: string;
    dispositivo: string;
    comando: string;
    motivo?: string;
    ticketId?: string;
    usuarioId?: string;
  }) {
    const dispositivo = input.dispositivo?.toUpperCase();
    const comando = input.comando?.toUpperCase();
    if (!DISPOSITIVOS_VALIDOS.has(dispositivo)) {
      throw new BadRequestException(`Dispositivo inválido: ${input.dispositivo}`);
    }
    if (!COMANDOS_POR_DISPOSITIVO[dispositivo].has(comando)) {
      throw new BadRequestException(`Comando ${comando} não suportado por ${dispositivo}`);
    }

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
    // TODO: integrar com adapter Modbus/GPIO real e chamar marcarExecutado/marcarFalha.
    return evento;
  }

  async marcarExecutado(id: string) {
    return this.prisma.eventoAutomacao.update({
      where: { id },
      data: { status: 'EXECUTADO', executadoEm: new Date() },
    });
  }

  async marcarFalha(id: string, motivo: string) {
    return this.prisma.eventoAutomacao.update({
      where: { id },
      data: { status: 'FALHA', motivo, executadoEm: new Date() },
    });
  }

  async historico(unidadeId: string, limit = 50) {
    return this.prisma.eventoAutomacao.findMany({
      where: { unidadeId },
      orderBy: { criadoEm: 'desc' },
      take: limit,
    });
  }
}
