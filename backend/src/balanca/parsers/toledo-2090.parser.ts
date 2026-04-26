import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * Toledo 2090 (streaming contínuo).
 * Trama típica: STX + 6 dígitos peso + CR + LF
 * Não há byte de status separado — peso negativo indica deslocamento.
 *
 * Compatível com ACBrBALToledo2090 (biblioteca ACBr).
 */
export class Toledo2090Parser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const lf = buffer.indexOf(0x0a);
    if (lf < 0) return { leitura: null, restante: buffer };

    const slice = buffer.subarray(0, lf);
    const restante = buffer.subarray(lf + 1);

    // Pode terminar em CR+LF — descarta CR final
    const text = slice.toString('latin1').replace(/\r$/, '');
    // Pula STX se presente
    const body = text.startsWith('\x02') ? text.slice(1) : text;
    const limpo = body.trim().replace(/[^0-9\-+.]/g, '');
    if (!limpo) return { leitura: null, restante };

    let peso = parseFloat(limpo);
    if (isNaN(peso)) return { leitura: null, restante };
    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    // Onda 1.7 (C9): 2090 nao envia byte de status — estabilidade indefinida
    // no parser. O service decide via janela movel (toleranciaEstabilidade,
    // janelaEstabilidade configuraveis por balanca). Antes retornava
    // estavel:true hardcoded, permitindo travar peso de caminhao em movimento.
    return { leitura: { peso, estavel: false, bruto: text }, restante };
  }
}
