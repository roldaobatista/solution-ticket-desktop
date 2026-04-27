import { Injectable, Logger } from '@nestjs/common';
import { AutomacaoAdapter, ComandoAutomacao, ResultadoAutomacao } from './automacao.adapter';

/**
 * Adapter no-op: usado quando nao ha hardware configurado (dev/teste).
 * Sempre retorna ok=true para que a UI consiga seguir o fluxo de pesagem.
 */
@Injectable()
export class NullAutomacaoAdapter implements AutomacaoAdapter {
  private readonly logger = new Logger(NullAutomacaoAdapter.name);

  async executar(cmd: ComandoAutomacao): Promise<ResultadoAutomacao> {
    this.logger.debug(`[noop] ${cmd.dispositivo}/${cmd.comando} unidade=${cmd.unidadeId}`);
    return { ok: true, motivo: 'simulado (sem hardware configurado)' };
  }
}
