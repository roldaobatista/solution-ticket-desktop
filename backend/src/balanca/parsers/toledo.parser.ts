import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Toledo 9091 e similares.
 * Trama típica: STX | status(1) | peso(6) | tara(6) | ETX | CR
 * Status byte bit0: 0 = estável, 1 = instável (varia por modelo).
 */
export class ToledoParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const idx = buffer.indexOf(0x0d); // CR
    if (idx < 0) return { leitura: null, restante: buffer };
    const tramaBytes = buffer.subarray(0, idx);
    const restante = buffer.subarray(idx + 1);
    const trama = tramaBytes.toString('ascii');

    // Procura STX (0x02) ou usa desde o inicio
    let start = trama.indexOf('\x02');
    if (start < 0) start = 0;
    else start += 1;

    const body = trama.substring(start);
    if (body.length < 7) return { leitura: null, restante };

    const status = body.charCodeAt(0);
    const estavel = (status & 0x01) === 0; // bit0 = 0 -> estavel
    const pesoStr = body.substring(1, 7).trim();
    const limpo = pesoStr.replace(/[^0-9\-]/g, '');
    if (!limpo) return { leitura: null, restante };
    let peso = parseInt(limpo, 10);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    return { leitura: { peso, estavel, bruto: trama }, restante };
  }
}
