import { DigitronParser } from './digitron.parser';

describe('DigitronParser', () => {
  it('decodifica "D000.318[CR]" (log real)', () => {
    const parser = new DigitronParser({});
    const trama = Buffer.concat([Buffer.from('D000.318'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBeCloseTo(0.318, 3);
  });

  it('aplica invertePeso', () => {
    const parser = new DigitronParser({ invertePeso: true });
    const trama = Buffer.concat([Buffer.from('D001.000'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(-1);
  });

  it('aguarda mais bytes sem CR', () => {
    const parser = new DigitronParser({});
    const { leitura, restante } = parser.parse(Buffer.from('D000.318'));
    expect(leitura).toBeNull();
    expect(restante.length).toBe(8);
  });
});
