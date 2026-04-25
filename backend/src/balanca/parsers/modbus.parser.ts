import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Placeholder para parser de Modbus. O adapter Modbus faz a leitura
 * via holding registers e entrega diretamente o peso numérico — este
 * parser apenas normaliza a saída.
 * Pode ser estendido para interpretar status-bits conforme fabricante.
 */
export class ModbusParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    // Adapter Modbus injeta o peso como string decimal seguido de \n.
    const idx = buffer.indexOf(0x0a);
    if (idx < 0) return { leitura: null, restante: buffer };
    const linha = buffer.subarray(0, idx).toString('latin1').trim();
    const restante = buffer.subarray(idx + 1);
    if (!linha) return { leitura: null, restante };
    let peso = parseFloat(linha);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;
    return { leitura: { peso, estavel: false, bruto: linha }, restante };
  }
}
