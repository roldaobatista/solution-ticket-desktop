import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Urano (US Series, indicador padrão).
 * Trama típica observada em ACBrBALUrano:
 *   `\x02 NN PESO ,UNI \x03`  ou  `IkPESO,UNIkg\r\n`
 *
 * Variante "popular": peso direto + CR+LF (`xxxxxx[CR][LF]`).
 * Status estável quando STX/ETX presentes; movimento quando truncada.
 */
export class UranoParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    // Procura ETX (0x03) ou LF (0x0A) como terminador
    const etx = buffer.indexOf(0x03);
    const lf = buffer.indexOf(0x0a);
    const idx = etx >= 0 && (lf < 0 || etx < lf) ? etx : lf;
    if (idx < 0) return { leitura: null, restante: buffer };

    const slice = buffer.subarray(0, idx).toString('latin1');
    const restante = buffer.subarray(idx + 1);

    // Remove STX inicial e CR no fim
    const body = slice.replace(/^\x02/, '').replace(/\r$/, '').trim();
    // Extrai número (pode ter ',' como decimal — Urano usa vírgula)
    const limpo = body.replace(/[^0-9\-+.,]/g, '').replace(',', '.');
    if (!limpo) return { leitura: null, restante };
    let peso = parseFloat(limpo);
    if (isNaN(peso)) return { leitura: null, restante };

    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    // Estabilidade: se trama vier completa com ETX (idx==etx), considera estável
    const estavel = etx === idx;
    return { leitura: { peso, estavel, bruto: slice }, restante };
  }
}
