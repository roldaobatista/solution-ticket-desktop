import { IBalancaParser, LeituraPeso, ParserConfig } from './parser.interface';

/**
 * A&D FTS / TCS / similar (ACBrBALAFTS).
 * Trama: `ST,GS,+   12.345 kg\r\n`
 *   ST = stable, US = unstable, OL = overload
 *   GS = gross, NT = net
 * Compatível com balanças A&D, Cubas (algumas) e TCS.
 */
export class AftsParser implements IBalancaParser {
  constructor(private config: ParserConfig) {}

  parse(buffer: Buffer): { leitura: LeituraPeso | null; restante: Buffer } {
    const lf = buffer.indexOf(0x0a);
    if (lf < 0) return { leitura: null, restante: buffer };
    const slice = buffer.subarray(0, lf).toString('latin1').replace(/\r$/, '');
    const restante = buffer.subarray(lf + 1);

    // C8: trama AFTS bem formada tem unidade 'kg' ou 'g' no final.
    // A ausência costuma indicar trama truncada/ruído — rejeitar.
    if (!/(kg|g|t|lb)\s*$/.test(slice.trim())) return { leitura: null, restante };

    // Aceita ST/US/OL como prefixo
    const m = slice.match(/^(ST|US|OL),(?:GS|NT),([+\-\s\d.]+)/);
    if (!m) return { leitura: null, restante };

    const status = m[1];
    const numStr = m[2].replace(/\s+/g, '');
    // C8: número não pode ter múltiplos pontos nem ser apenas sinal.
    if ((numStr.match(/\./g) ?? []).length > 1) return { leitura: null, restante };
    if (!/\d/.test(numStr)) return { leitura: null, restante };
    let peso = parseFloat(numStr);
    if (isNaN(peso)) return { leitura: null, restante };

    const fator = this.config.fator ?? 1;
    if (fator > 1) peso = peso / fator;
    if (this.config.invertePeso) peso = -peso;

    const estavel = status === 'ST';
    return { leitura: { peso, estavel, bruto: slice }, restante };
  }
}
