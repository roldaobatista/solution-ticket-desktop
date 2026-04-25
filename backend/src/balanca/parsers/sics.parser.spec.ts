import { SicsParser } from './sics.parser';

describe('SicsParser', () => {
  it('interpreta trama estável (S S)', () => {
    const parser = new SicsParser({});
    const trama = Buffer.from('S S     12.345 kg\r\n', 'ascii');
    const { leitura } = parser.parse(trama);
    expect(leitura).not.toBeNull();
    expect(leitura!.peso).toBe(12.345);
    expect(leitura!.estavel).toBe(true);
  });

  it('interpreta trama instável/dinâmica (S D)', () => {
    const parser = new SicsParser({});
    const trama = Buffer.from('S D     12.345 kg\r\n', 'ascii');
    const { leitura } = parser.parse(trama);
    expect(leitura!.estavel).toBe(false);
  });

  it('retorna null sem LF terminal', () => {
    const parser = new SicsParser({});
    const trama = Buffer.from('S S     12.345 kg', 'ascii');
    const { leitura, restante } = parser.parse(trama);
    expect(leitura).toBeNull();
    expect(restante.length).toBeGreaterThan(0);
  });

  it('aplica invertePeso', () => {
    const parser = new SicsParser({ invertePeso: true });
    const trama = Buffer.from('S S     10.00 kg\r\n', 'ascii');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(-10);
  });

  it('ignora linha sem prefixo S', () => {
    const parser = new SicsParser({});
    const trama = Buffer.from('X Y 10.0 kg\r\n', 'ascii');
    const { leitura } = parser.parse(trama);
    expect(leitura).toBeNull();
  });
});
