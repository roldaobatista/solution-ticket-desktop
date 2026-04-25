import { ToledoParser } from './toledo.parser';

function buildTrama(statusByte: number, peso: string): Buffer {
  // STX + status + peso(6) + CR
  const ascii = Buffer.from('\x02' + String.fromCharCode(statusByte) + peso, 'ascii');
  return Buffer.concat([ascii, Buffer.from([0x0d])]);
}

describe('ToledoParser', () => {
  it('interpreta peso estável (status bit0 = 0)', () => {
    const parser = new ToledoParser({});
    const trama = buildTrama(0x20, '012345');
    const { leitura, restante } = parser.parse(trama);
    expect(leitura).not.toBeNull();
    expect(leitura!.peso).toBe(12345);
    expect(leitura!.estavel).toBe(true);
    expect(restante.length).toBe(0);
  });

  it('interpreta peso instável (status bit0 = 1)', () => {
    const parser = new ToledoParser({});
    const trama = buildTrama(0x21, '012345');
    const { leitura } = parser.parse(trama);
    expect(leitura!.estavel).toBe(false);
  });

  it('retorna null e mantém buffer enquanto não há CR', () => {
    const parser = new ToledoParser({});
    const trama = Buffer.from('\x02 012345');
    const { leitura, restante } = parser.parse(trama);
    expect(leitura).toBeNull();
    expect(restante.length).toBe(trama.length);
  });

  it('aplica fator (peso / fator)', () => {
    const parser = new ToledoParser({ fator: 10 });
    const trama = buildTrama(0x20, '001000');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(100);
  });

  it('inverte peso quando invertePeso=true', () => {
    const parser = new ToledoParser({ invertePeso: true });
    const trama = buildTrama(0x20, '001000');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(-1000);
  });

  it('retorna null quando peso não-numérico', () => {
    const parser = new ToledoParser({});
    const trama = buildTrama(0x20, 'abcdef');
    const { leitura } = parser.parse(trama);
    expect(leitura).toBeNull();
  });

  it('processa múltiplas tramas em sequência', () => {
    const parser = new ToledoParser({});
    const trama1 = buildTrama(0x20, '001000');
    const trama2 = buildTrama(0x20, '002000');
    const buffer = Buffer.concat([trama1, trama2]);

    const r1 = parser.parse(buffer);
    expect(r1.leitura!.peso).toBe(1000);

    const r2 = parser.parse(r1.restante);
    expect(r2.leitura!.peso).toBe(2000);
    expect(r2.restante.length).toBe(0);
  });
});
