import { GenericParser } from './generic.parser';

describe('GenericParser', () => {
  it('extrai peso de trama Toledo-like (STX + status + 6 digits + CR)', () => {
    // inicio=3 (1-indexed, pula STX + status), tamanho=6, marcador=13 (CR)
    const parser = new GenericParser({
      inicioPeso: 3,
      tamanhoPeso: 6,
      marcador: 13,
    });
    // STX(0x02) + 'S' (estável) + '012345' + CR
    const trama = Buffer.from([0x02, 0x53, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x0d]);
    const { leitura, restante } = parser.parse(trama);
    expect(leitura).not.toBeNull();
    expect(leitura!.peso).toBe(12345);
    expect(restante.length).toBe(0);
  });

  it('aplica fator (divisor)', () => {
    const parser = new GenericParser({
      inicioPeso: 1,
      tamanhoPeso: 6,
      marcador: 13,
      fator: 10,
    });
    const trama = Buffer.concat([Buffer.from('012345'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(1234.5);
  });

  it('aplica invertePeso', () => {
    const parser = new GenericParser({
      inicioPeso: 1,
      tamanhoPeso: 6,
      marcador: 13,
      invertePeso: true,
    });
    const trama = Buffer.concat([Buffer.from('001000'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(-1000);
  });

  it('retorna null e mantém buffer quando não há marcador', () => {
    const parser = new GenericParser({ inicioPeso: 1, tamanhoPeso: 6, marcador: 13 });
    const trama = Buffer.from('012345');
    const { leitura, restante } = parser.parse(trama);
    expect(leitura).toBeNull();
    expect(restante.length).toBe(6);
  });

  it('preserva bytes após o marcador como restante', () => {
    const parser = new GenericParser({ inicioPeso: 1, tamanhoPeso: 6, marcador: 13 });
    const buf = Buffer.concat([Buffer.from('012345'), Buffer.from([0x0d]), Buffer.from('rest')]);
    const { leitura, restante } = parser.parse(buf);
    expect(leitura!.peso).toBe(12345);
    expect(restante.toString()).toBe('rest');
  });

  // ==========================================================
  // Tramas reais capturadas em FERRAMENTAS PARA TESTES/BalLog.txt
  // ==========================================================

  it('decodifica trama "D000.318[CR]" (genérica modo D - log real)', () => {
    // 'D' + 7 chars peso + CR
    const parser = new GenericParser({ inicioPeso: 2, tamanhoPeso: 7, marcador: 13 });
    const trama = Buffer.concat([Buffer.from('D000.318'), Buffer.from([0x0d])]);
    const { leitura, restante } = parser.parse(trama);
    expect(leitura).not.toBeNull();
    expect(leitura!.peso).toBeCloseTo(0.318, 3);
    expect(restante.length).toBe(0);
  });

  it('processa duas leituras consecutivas "D000.318[CR]D000.318[CR]" (log real)', () => {
    const parser = new GenericParser({ inicioPeso: 2, tamanhoPeso: 7, marcador: 13 });
    const buf = Buffer.concat([
      Buffer.from('D000.318'),
      Buffer.from([0x0d]),
      Buffer.from('D000.319'),
      Buffer.from([0x0d]),
    ]);
    const r1 = parser.parse(buf);
    expect(r1.leitura!.peso).toBeCloseTo(0.318, 3);
    const r2 = parser.parse(r1.restante);
    expect(r2.leitura!.peso).toBeCloseTo(0.319, 3);
    expect(r2.restante.length).toBe(0);
  });

  it('decodifica trama 7-bit ASCII "[20][STX][STX].318[CR]" (log real)', () => {
    // 0x20 + 0x02 + 0x02 + ".318" + CR.
    // inicioPeso=4 (pula 0x20 + STX + STX), tamanhoPeso=4, marcador=13.
    const parser = new GenericParser({ inicioPeso: 4, tamanhoPeso: 4, marcador: 13 });
    const trama = Buffer.from([0x20, 0x02, 0x02, 0x2e, 0x33, 0x31, 0x38, 0x0d]);
    const { leitura } = parser.parse(trama);
    expect(leitura).not.toBeNull();
    expect(leitura!.peso).toBeCloseTo(0.318, 3);
  });
});
