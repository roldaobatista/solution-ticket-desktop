import { ModbusParser } from './modbus.parser';

describe('ModbusParser', () => {
  it('lê peso decimal terminado em LF', () => {
    const parser = new ModbusParser({});
    const buffer = Buffer.from('1234.5\n', 'ascii');
    const { leitura, restante } = parser.parse(buffer);
    expect(leitura!.peso).toBe(1234.5);
    expect(leitura!.estavel).toBe(false); // adapter modbus não infere estabilidade
    expect(restante.length).toBe(0);
  });

  it('retorna null sem LF', () => {
    const parser = new ModbusParser({});
    const buffer = Buffer.from('1234.5', 'ascii');
    const { leitura, restante } = parser.parse(buffer);
    expect(leitura).toBeNull();
    expect(restante.length).toBe(buffer.length);
  });

  it('aplica fator', () => {
    const parser = new ModbusParser({ fator: 10 });
    const buffer = Buffer.from('1000\n', 'ascii');
    const { leitura } = parser.parse(buffer);
    expect(leitura!.peso).toBe(100);
  });

  it('inverte peso', () => {
    const parser = new ModbusParser({ invertePeso: true });
    const buffer = Buffer.from('500\n', 'ascii');
    const { leitura } = parser.parse(buffer);
    expect(leitura!.peso).toBe(-500);
  });

  it('descarta linha vazia', () => {
    const parser = new ModbusParser({});
    const buffer = Buffer.from('\n', 'ascii');
    const { leitura, restante } = parser.parse(buffer);
    expect(leitura).toBeNull();
    expect(restante.length).toBe(0);
  });

  it('descarta linha não numérica', () => {
    const parser = new ModbusParser({});
    const buffer = Buffer.from('error\n', 'ascii');
    const { leitura } = parser.parse(buffer);
    expect(leitura).toBeNull();
  });
});
