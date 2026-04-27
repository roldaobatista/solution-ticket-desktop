import { Injectable, Logger } from '@nestjs/common';
import ModbusRTU from 'modbus-serial';
import { AutomacaoAdapter, ComandoAutomacao, ResultadoAutomacao } from './automacao.adapter';

/**
 * Configuracao Modbus por unidade. Lida do ambiente:
 *   AUTOMACAO_MODBUS_HOST=192.168.1.50
 *   AUTOMACAO_MODBUS_PORT=502
 *   AUTOMACAO_MODBUS_UNIT_ID=1
 *   AUTOMACAO_MODBUS_TIMEOUT_MS=2000
 *
 * Mapping de coils (FC=05 write single coil):
 *   CANCELA  / ABRIR    -> coil 0 (true)
 *   CANCELA  / FECHAR   -> coil 0 (false)
 *   SEMAFORO / VERDE    -> coil 1
 *   SEMAFORO / VERMELHO -> coil 2
 *   SEMAFORO / AMARELO  -> coil 3
 *
 * Para hardware com mapping diferente, sobrescrever via:
 *   AUTOMACAO_MODBUS_COILS='{"CANCELA_ABRIR":10,"SEMAFORO_VERDE":11,...}'
 */
const COILS_PADRAO: Record<string, { coil: number; valor: boolean }> = {
  CANCELA_ABRIR: { coil: 0, valor: true },
  CANCELA_FECHAR: { coil: 0, valor: false },
  SEMAFORO_VERDE: { coil: 1, valor: true },
  SEMAFORO_VERMELHO: { coil: 2, valor: true },
  SEMAFORO_AMARELO: { coil: 3, valor: true },
};

@Injectable()
export class ModbusAutomacaoAdapter implements AutomacaoAdapter {
  private readonly logger = new Logger(ModbusAutomacaoAdapter.name);
  private readonly host: string;
  private readonly port: number;
  private readonly unitId: number;
  private readonly timeoutMs: number;
  private readonly coilMap: Record<string, { coil: number; valor: boolean }>;

  constructor() {
    this.host = process.env.AUTOMACAO_MODBUS_HOST!;
    this.port = Number(process.env.AUTOMACAO_MODBUS_PORT ?? 502);
    this.unitId = Number(process.env.AUTOMACAO_MODBUS_UNIT_ID ?? 1);
    this.timeoutMs = Number(process.env.AUTOMACAO_MODBUS_TIMEOUT_MS ?? 2000);
    this.coilMap = this.lerCoilMap();
  }

  private lerCoilMap(): Record<string, { coil: number; valor: boolean }> {
    const raw = process.env.AUTOMACAO_MODBUS_COILS;
    if (!raw) return COILS_PADRAO;
    try {
      const parsed = JSON.parse(raw) as Record<string, number | { coil: number; valor: boolean }>;
      const out: Record<string, { coil: number; valor: boolean }> = {};
      for (const [k, v] of Object.entries(parsed)) {
        out[k] = typeof v === 'number' ? { coil: v, valor: true } : v;
      }
      return { ...COILS_PADRAO, ...out };
    } catch {
      this.logger.warn('AUTOMACAO_MODBUS_COILS invalido, usando padrao');
      return COILS_PADRAO;
    }
  }

  async executar(cmd: ComandoAutomacao): Promise<ResultadoAutomacao> {
    const chave = `${cmd.dispositivo}_${cmd.comando}`;
    const mapping = this.coilMap[chave];
    if (!mapping) {
      return { ok: false, motivo: `mapping ausente para ${chave}` };
    }

    const client = new ModbusRTU();
    try {
      await client.connectTCP(this.host, { port: this.port });
      client.setID(this.unitId);
      client.setTimeout(this.timeoutMs);
      await client.writeCoil(mapping.coil, mapping.valor);
      this.logger.log(
        `Modbus OK ${cmd.dispositivo}/${cmd.comando} coil=${mapping.coil} valor=${mapping.valor}`,
      );
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Modbus FALHA ${cmd.dispositivo}/${cmd.comando}: ${msg}`);
      return { ok: false, motivo: msg };
    } finally {
      try {
        client.close(() => {});
      } catch {
        /* ignore */
      }
    }
  }
}
