import { SaturnoParser } from './saturno.parser';

describe('SaturnoParser', () => {
  it('decodifica STX...ETX como estável', () => {
    const parser = new SaturnoParser({});
    const trama = Buffer.concat([Buffer.from([0x02]), Buffer.from('012345'), Buffer.from([0x03])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(12345);
    expect(leitura!.estavel).toBe(true);
  });

  it('decodifica linha simples terminada em LF como instável', () => {
    const parser = new SaturnoParser({});
    const trama = Buffer.from('+001234\r\n');
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(1234);
    expect(leitura!.estavel).toBe(false);
  });

  it('aplica fator', () => {
    const parser = new SaturnoParser({ fator: 100 });
    const trama = Buffer.concat([Buffer.from([0x02]), Buffer.from('010000'), Buffer.from([0x03])]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(100);
  });
});
