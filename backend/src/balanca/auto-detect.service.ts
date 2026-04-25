import { Injectable, Logger } from '@nestjs/common';
import { createParser } from './parsers/parser.factory';
import { LeituraPeso } from './parsers/parser.interface';
import { PRESETS_BALANCA, PresetBalanca } from './presets';

export interface CandidatoDetectado {
  preset: PresetBalanca;
  leitura: LeituraPeso;
  confianca: number; // 0..1
}

/**
 * Tenta interpretar bytes capturados com cada parser conhecido, ranqueando
 * por confiança (peso plausível, estabilidade, restante limpo).
 *
 * Uso típico:
 *   1. Usuário aciona "Detectar automaticamente" na UI.
 *   2. Backend abre porta serial com baud/data/parity de teste e captura ~2s.
 *   3. AutoDetectService recebe os bytes brutos e devolve candidatos rankeados.
 *   4. UI mostra top 3 e usuário escolhe (ou auto-aplica o melhor).
 */
@Injectable()
export class AutoDetectService {
  private readonly logger = new Logger(AutoDetectService.name);

  detectar(bytes: Buffer): CandidatoDetectado[] {
    const candidatos: CandidatoDetectado[] = [];

    for (const preset of PRESETS_BALANCA) {
      if (preset.protocolo !== 'serial' && preset.protocolo !== 'tcp') continue;
      try {
        const parser = createParser(preset.parser);
        let buf: Buffer = Buffer.from(bytes);
        let melhor: LeituraPeso | null = null;
        let leituras = 0;
        // Deixa o parser consumir várias tramas
        for (let i = 0; i < 10; i++) {
          const r = parser.parse(buf);
          if (!r.leitura) break;
          melhor = r.leitura;
          leituras += 1;
          buf = r.restante;
          if (buf.length === 0) break;
        }
        if (melhor && this.pesoPlausivel(melhor.peso)) {
          const confianca = this.calcularConfianca(leituras, melhor, buf.length, bytes.length);
          candidatos.push({ preset, leitura: melhor, confianca });
        }
      } catch (err) {
        this.logger.debug(`Preset ${preset.id} falhou: ${(err as Error).message}`);
      }
    }

    return candidatos.sort((a, b) => b.confianca - a.confianca).slice(0, 5);
  }

  private pesoPlausivel(peso: number): boolean {
    // Veicular: aceita qualquer valor finito entre -200t e +200t.
    return Number.isFinite(peso) && Math.abs(peso) <= 200_000;
  }

  private calcularConfianca(
    leituras: number,
    leitura: LeituraPeso,
    bytesRestantes: number,
    bytesTotal: number,
  ): number {
    let score = 0;
    // 1. Quantas tramas conseguiu extrair (mais = melhor)
    score += Math.min(leituras / 5, 0.4);
    // 2. Estabilidade explícita
    if (leitura.estavel) score += 0.2;
    // 3. Bytes consumidos vs descartados
    const consumidos = (bytesTotal - bytesRestantes) / Math.max(bytesTotal, 1);
    score += Math.min(consumidos, 0.3);
    // 4. Peso > 0 (evita scores altos em buffer de zeros)
    if (leitura.peso !== 0) score += 0.1;
    return Math.min(score, 1);
  }
}
