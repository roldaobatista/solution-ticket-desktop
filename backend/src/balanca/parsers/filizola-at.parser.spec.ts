import { FilizolaAtParser } from './filizola-at.parser';

describe('FilizolaAtParser', () => {
  it('decodifica trama "@002.448[CR]" (log real)', () => {
    const parser = new FilizolaAtParser({});
    const trama = Buffer.concat([Buffer.from('@002.448'), Buffer.from([0x0d])]);
    const { leitura, restante } = parser.parse(trama);
    expect(leitura!.peso).toBeCloseTo(2.448, 3);
    expect(leitura!.estavel).toBe(true);
    expect(restante.length).toBe(0);
  });

  it('processa múltiplas tramas em fluxo', () => {
    const parser = new FilizolaAtParser({});
    const buf = Buffer.concat([
      Buffer.from('@001.234'),
      Buffer.from([0x0d]),
      Buffer.from('@002.345'),
      Buffer.from([0x0d]),
    ]);
    const r1 = parser.parse(buf);
    expect(r1.leitura!.peso).toBeCloseTo(1.234, 3);
    const r2 = parser.parse(r1.restante);
    expect(r2.leitura!.peso).toBeCloseTo(2.345, 3);
  });

  it('descarta linha sem "@"', () => {
    const parser = new FilizolaAtParser({});
    const trama = Buffer.concat([Buffer.from('xxxx.yyy'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura).toBeNull();
  });
});
