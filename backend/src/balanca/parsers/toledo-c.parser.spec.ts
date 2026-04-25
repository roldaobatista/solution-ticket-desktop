import { ToledoCParser } from './toledo-c.parser';

/** Helpers para reconstruir tramas reais observadas em FERRAMENTAS PARA TESTES/BalLog.txt */
const STX = 0x02;
const CR = 0x0d;
const ENQ = 0x05;

function tramaC(corpo: string, withEnqTail = true): Buffer {
  const head = Buffer.from([STX]);
  const body = Buffer.from(corpo, 'ascii');
  const tail = withEnqTail ? Buffer.from([CR, ENQ]) : Buffer.from([CR]);
  return Buffer.concat([head, body, tail]);
}

describe('ToledoCParser (Protocolo C real)', () => {
  it('decodifica trama capturada em log: [STX]i2  00010000000[CR][ENQ]', () => {
    const parser = new ToledoCParser({ fator: 100 }); // 2 casas decimais
    const trama = tramaC('i2  00010000000');
    const { leitura, restante } = parser.parse(trama);

    expect(leitura).not.toBeNull();
    expect(leitura!.estavel).toBe(true); // status '2' = estável
    expect(leitura!.peso).toBe(100000); // 10000000 / 100
    expect(restante.length).toBe(0);
  });

  it('marca instável quando status = 0', () => {
    const parser = new ToledoCParser({});
    const { leitura } = parser.parse(tramaC('i0  00000000123'));
    expect(leitura!.estavel).toBe(false);
    expect(leitura!.peso).toBe(123);
  });

  it('aplica invertePeso para fluxo de descarga', () => {
    const parser = new ToledoCParser({ invertePeso: true });
    const { leitura } = parser.parse(tramaC('i2  00000005000'));
    expect(leitura!.peso).toBe(-5000);
  });

  it('aguarda mais bytes se trama está incompleta (sem CR)', () => {
    const parser = new ToledoCParser({});
    const incompleto = Buffer.from([STX, 0x69, 0x32, 0x20, 0x30]); // \x02 i 2 space 0
    const { leitura, restante } = parser.parse(incompleto);
    expect(leitura).toBeNull();
    expect(restante.length).toBe(incompleto.length);
  });

  it('descarta trama sem prefixo "i"', () => {
    const parser = new ToledoCParser({});
    const trama = tramaC('x2  00000000099');
    const { leitura } = parser.parse(trama);
    expect(leitura).toBeNull();
  });

  it('processa duas respostas consecutivas (request-response em sequência)', () => {
    const parser = new ToledoCParser({ fator: 1000 });
    const buf = Buffer.concat([tramaC('i2  00000012345'), tramaC('i0  00000067890')]);
    const r1 = parser.parse(buf);
    expect(r1.leitura!.peso).toBeCloseTo(12.345, 3);
    expect(r1.leitura!.estavel).toBe(true);
    const r2 = parser.parse(r1.restante);
    expect(r2.leitura!.peso).toBeCloseTo(67.89, 2);
    expect(r2.leitura!.estavel).toBe(false);
    expect(r2.restante.length).toBe(0);
  });
});
