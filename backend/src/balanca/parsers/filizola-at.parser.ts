import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Filizola variante "@" — capturada em FERRAMENTAS PARA TESTES/BalLog.txt:
 *   `@002.448[CR]`
 *
 * Trama: '@' + peso decimal + CR
 * Sem byte de status — estabilidade derivada por janela no service ou
 * confiada quando recebida em resposta a ENQ.
 *
 * Compatível com algumas firmwares Filizola que respondem a ENQ neste formato.
 */
export class FilizolaAtParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const cr = buffer.indexOf(0x0d);
    if (cr < 0) return { leitura: null, restante: buffer };
    const slice = buffer.subarray(0, cr).toString('ascii');
    const restante = buffer.subarray(cr + 1);

    const at = slice.indexOf('@');
    if (at < 0) return { leitura: null, restante };
    const body = slice.slice(at + 1).trim();
    const limpo = body.replace(/[^0-9\-+.]/g, '');
    if (!limpo) return { leitura: null, restante };

    let peso = parseFloat(limpo);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    return { leitura: { peso, estavel: true, bruto: slice }, restante };
  }
}
