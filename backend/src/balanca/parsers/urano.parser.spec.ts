import { UranoParser } from './urano.parser';

describe('UranoParser', () => {
  it('decodifica trama com STX...ETX', () => {
    const parser = new UranoParser({});
    const trama = Buffer.concat([
      Buffer.from([0x02]),
      Buffer.from(' 00 12,345 ,kg '),
      Buffer.from([0x03]),
    ]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBeCloseTo(12.345, 3);
    expect(leitura!.estavel).toBe(true);
  });

  it('decodifica streaming com LF (variante POP)', () => {
    const parser = new UranoParser({});
    const trama = Buffer.concat([Buffer.from('012345'), Buffer.from([0x0d, 0x0a])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(12345);
    expect(leitura!.estavel).toBe(false); // sem ETX
  });

  it('aplica fator', () => {
    const parser = new UranoParser({ fator: 1000 });
    const trama = Buffer.concat([Buffer.from([0x02]), Buffer.from('001000'), Buffer.from([0x03])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(1);
  });
});
