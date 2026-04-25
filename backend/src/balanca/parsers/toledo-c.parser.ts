import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Toledo Protocolo C (request/response).
 *
 * Trama: STX + 'i' + status + N espaços + peso (dígitos) + CR + ENQ
 * Ex.:   \x02 i 2   "  " 00010000000 \x0D \x05
 *
 * - Cliente envia ENQ (0x05) para solicitar leitura.
 * - Indicador responde com a trama acima e termina com ENQ (handshake).
 * - O peso é numérico, com zeros à esquerda. Usar `fator` para casas decimais.
 *
 * Referência: log real capturado em FERRAMENTAS PARA TESTES/BalLog.txt
 *   `[STX]i2  00010000000[CR][ENQ]` → peso 0 (10000000 / fator)
 */
export class ToledoCParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const stxIdx = buffer.indexOf(0x02);
    if (stxIdx < 0) return { leitura: null, restante: buffer };
    const crIdx = buffer.indexOf(0x0d, stxIdx + 1);
    if (crIdx < 0) return { leitura: null, restante: buffer };

    // Consome até CR; ENQ pós-CR é handshake e fica no restante para descarte
    const trama = buffer.subarray(stxIdx + 1, crIdx).toString('latin1');
    let consumed = crIdx + 1;
    if (buffer[consumed] === 0x05) consumed += 1; // ENQ trailing
    const restante = buffer.subarray(consumed);

    if (trama[0] !== 'i') return { leitura: null, restante };

    const status = trama[1] ?? '0';
    // C8: whitelist de status válidos (descarta trama corrompida silenciosamente).
    // Manual Toledo: '0'=movimento, '1'=subpeso, '2'=estável, '3'=sobrecarga.
    if (!['0', '1', '2', '3'].includes(status)) return { leitura: null, restante };
    const estavel = status === '2';

    const pesoStr = trama
      .slice(2)
      .replace(/\s+/g, '')
      .replace(/[^0-9\-]/g, '');
    // C8: peso Toledo-C tem entre 6 e 11 dígitos; fora disso é quase certamente ruído.
    if (!pesoStr || pesoStr.length < 4 || pesoStr.length > 12) {
      return { leitura: null, restante };
    }
    let peso = parseInt(pesoStr, 10);
    if (isNaN(peso)) return { leitura: null, restante };

    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    return { leitura: { peso, estavel, bruto: trama }, restante };
  }
}
