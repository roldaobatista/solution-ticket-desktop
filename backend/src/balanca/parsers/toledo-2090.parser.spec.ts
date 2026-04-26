import { Toledo2090Parser } from './toledo-2090.parser';

describe('Toledo2090Parser', () => {
  // Onda 1.7 (C9): 2090 nao envia byte de status — parser retorna
  // estavel:false e a estabilidade e validada pela janela movel no service.
  it('decodifica STX + 6 dígitos + CR/LF', () => {
    const parser = new Toledo2090Parser({});
    const trama = Buffer.from([0x02, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x0d, 0x0a]);
    const { leitura, restante } = parser.parse(trama);
    expect(leitura!.peso).toBe(12345);
    expect(leitura!.estavel).toBe(false);
    expect(restante.length).toBe(0);
  });

  it('aplica fator e invertePeso', () => {
    const parser = new Toledo2090Parser({ fator: 100, invertePeso: true });
    const trama = Buffer.from([0x02, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x0d, 0x0a]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(-123.45);
  });

  it('aguarda mais bytes sem LF', () => {
    const parser = new Toledo2090Parser({});
    const { leitura, restante } = parser.parse(Buffer.from('012345'));
    expect(leitura).toBeNull();
    expect(restante.length).toBe(6);
  });
});
