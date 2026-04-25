import { FilizolaParser } from './filizola.parser';

describe('FilizolaParser', () => {
  it('interpreta trama estável (mesma estrutura do Toledo)', () => {
    const parser = new FilizolaParser({});
    const trama = Buffer.concat([Buffer.from('\x02 012345', 'ascii'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura).not.toBeNull();
    expect(leitura!.peso).toBe(12345);
    expect(leitura!.estavel).toBe(true);
  });

  it('aplica fator do config', () => {
    const parser = new FilizolaParser({ fator: 100 });
    const trama = Buffer.concat([Buffer.from('\x02 010000', 'ascii'), Buffer.from([0x0d])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(100);
  });
});
