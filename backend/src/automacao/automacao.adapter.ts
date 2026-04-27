/**
 * Contrato do adapter fisico de automacao (semaforo / cancela).
 * O AutomacaoService grava o evento no banco e delega a acao ao adapter.
 * Implementacoes:
 *  - ModbusAutomacaoAdapter: TCP/RTU via modbus-serial.
 *  - NullAutomacaoAdapter: simulacao para dev/teste/sem hardware configurado.
 */

export interface ComandoAutomacao {
  unidadeId: string;
  dispositivo: 'SEMAFORO' | 'CANCELA';
  comando: string;
}

export interface ResultadoAutomacao {
  ok: boolean;
  motivo?: string;
}

export interface AutomacaoAdapter {
  /** Executa o comando no hardware. Resolve com ok=true em sucesso. */
  executar(cmd: ComandoAutomacao): Promise<ResultadoAutomacao>;
}
