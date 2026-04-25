import { Toledo2180Parser } from './toledo-2180.parser';

describe('Toledo2180Parser', () => {
  it('decodifica trama com status estável', () => {
    const parser = new Toledo2180Parser({});
    // STX + status(0x20=estavel bit0=0) + '012345' + CR + LF
    const trama = Buffer.from([0x02, 0x20, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x0d, 0x0a]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.peso).toBe(12345);
    expect(leitura!.estavel).toBe(true);
  });

  it('marca instável quando bit0 do status = 1', () => {
    const parser = new Toledo2180Parser({});
    const trama = Buffer.from([0x02, 0x21, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x0d, 0x0a]);
    const { leitura } = parser.parse(trama);
    expect(leitura!.estavel).toBe(false);
  });

  it('descarta trama sem STX', () => {
    const parser = new Toledo2180Parser({});
    const { leitura } = parser.parse(Buffer.from('012345\r\n'));
    expect(leitura).toBeNull();
  });
});
