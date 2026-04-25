import { AftsParser } from './afts.parser';

describe('AftsParser', () => {
  it('decodifica ST,GS,+   12.345 kg', () => {
    const parser = new AftsParser({});
    const trama = Buffer.from('ST,GS,+   12.345 kg\r\n');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBeCloseTo(12.345, 3);
    expect(leitura!.estavel).toBe(true);
  });

  it('marca instável quando US (unstable)', () => {
    const parser = new AftsParser({});
    const trama = Buffer.from('US,GS,+    1.000 kg\r\n');
    const { leitura } = parser.parse(trama);
    expect(leitura!.estavel).toBe(false);
    expect(leitura!.peso).toBe(1);
  });

  it('aceita NT (net weight)', () => {
    const parser = new AftsParser({});
    const trama = Buffer.from('ST,NT,+    5.000 kg\r\n');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(5);
  });

  it('aceita peso negativo', () => {
    const parser = new AftsParser({});
    const trama = Buffer.from('ST,GS,-    2.500 kg\r\n');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(-2.5);
  });

  it('descarta linha sem ST/US/OL prefix', () => {
    const parser = new AftsParser({});
    const trama = Buffer.from('XX,GS,+    1.000 kg\r\n');
    const { leitura } = parser.parse(trama);
    expect(leitura).toBeNull();
  });
});
