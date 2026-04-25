/**
 * D12: Utilitários para construção de buffers ESC/POS.
 * Compatível com impressoras térmicas Epson TM-T20/TM-T20X e similares.
 *
 * Referência de comandos ESC/POS:
 *   ESC @       = inicializa impressora
 *   ESC ! n     = modo de fonte (n: bitfield de largura/altura/negrito)
 *   ESC a n     = alinhamento (0=esquerda, 1=centro, 2=direita)
 *   ESC d n     = avança n linhas
 *   ESC - n     = underline (0=off, 1=on, 2=on grosso)
 *   GS ! n      = tamanho de caractere (altura<<4 | largura)
 *   GS V m      = corte de papel (m=0 parcial, m=1 total)
 *   ESC p m t1 t2 = pulso para gaveta (m=0/1, t1=50ms, t2=200ms)
 *   LF          = nova linha (0x0A)
 */

export class EscposBuffer {
  private buf: number[] = [];

  static create(): EscposBuffer {
    return new EscposBuffer();
  }

  /** Inicializa a impressora (limpa buffer, reseta formatação) */
  init(): this {
    this.buf.push(0x1b, 0x40); // ESC @
    return this;
  }

  /** Alinhamento: 0=esquerda, 1=centro, 2=direita */
  align(pos: 0 | 1 | 2): this {
    this.buf.push(0x1b, 0x61, pos);
    return this;
  }

  /** Modo de fonte padrão */
  normal(): this {
    this.buf.push(0x1b, 0x21, 0x00); // ESC ! 0x00
    return this;
  }

  /** Negrito */
  bold(on: boolean): this {
    this.buf.push(0x1b, 0x45, on ? 0x01 : 0x00); // ESC E n
    return this;
  }

  /** Fonte dupla altura e largura (título) */
  large(): this {
    this.buf.push(0x1d, 0x21, 0x11); // GS ! 0x11 (2x2)
    return this;
  }

  /** Fonte média (1.5x altura) */
  medium(): this {
    this.buf.push(0x1d, 0x21, 0x01); // GS ! 0x01 (1x largura, 2x altura)
    return this;
  }

  /** Underline */
  underline(on: boolean): this {
    this.buf.push(0x1b, 0x2d, on ? 0x01 : 0x00); // ESC - n
    return this;
  }

  /** Texto simples (codificado em Latin1 para acentos brasileiros) */
  text(str: string): this {
    const latin1 = Buffer.from(str, 'latin1');
    for (const byte of latin1) {
      this.buf.push(byte);
    }
    return this;
  }

  /** Nova linha */
  newline(count = 1): this {
    for (let i = 0; i < count; i++) {
      this.buf.push(0x0a); // LF
    }
    return this;
  }

  /** Linha separadora com caracteres = ou - */
  separator(char = '-', width = 32): this {
    const line = char.repeat(width);
    const latin1 = Buffer.from(line, 'latin1');
    for (const byte of latin1) this.buf.push(byte);
    this.buf.push(0x0a);
    return this;
  }

  /** Corte total do papel */
  cut(): this {
    this.buf.push(0x1d, 0x56, 0x01); // GS V 0x01
    return this;
  }

  /** Corte parcial do papel */
  cutPartial(): this {
    this.buf.push(0x1d, 0x56, 0x00); // GS V 0x00
    return this;
  }

  /** Pulso para abrir gaveta (pino 2, tempo padrão) */
  pulse(): this {
    this.buf.push(0x1b, 0x70, 0x00, 0x32, 0xc8); // ESC p 0 50 200
    return this;
  }

  /** Avanço de n linhas */
  feed(lines: number): this {
    this.buf.push(0x1b, 0x64, lines); // ESC d n
    return this;
  }

  /** Buffer final pronto para envio */
  build(): Buffer {
    return Buffer.from(this.buf);
  }

  /** Limpa o buffer interno */
  clear(): this {
    this.buf = [];
    return this;
  }
}
