import { createParser } from './parser.factory';
import { ToledoParser } from './toledo.parser';
import { ToledoCParser } from './toledo-c.parser';
import { FilizolaParser } from './filizola.parser';
import { SicsParser } from './sics.parser';
import { ModbusParser } from './modbus.parser';
import { GenericParser } from './generic.parser';

describe('createParser factory', () => {
  it('retorna ToledoParser para "toledo" e "toledo-b"', () => {
    expect(createParser({ parserTipo: 'toledo' })).toBeInstanceOf(ToledoParser);
    expect(createParser({ parserTipo: 'toledo-b' })).toBeInstanceOf(ToledoParser);
  });

  it('retorna ToledoCParser para "toledo-c"', () => {
    expect(createParser({ parserTipo: 'toledo-c' })).toBeInstanceOf(ToledoCParser);
  });

  it('retorna FilizolaParser para "filizola"', () => {
    expect(createParser({ parserTipo: 'filizola' })).toBeInstanceOf(FilizolaParser);
  });

  it('retorna SicsParser para "sics" e "mt-sics"', () => {
    expect(createParser({ parserTipo: 'sics' })).toBeInstanceOf(SicsParser);
    expect(createParser({ parserTipo: 'mt-sics' })).toBeInstanceOf(SicsParser);
  });

  it('retorna ModbusParser para "modbus"', () => {
    expect(createParser({ parserTipo: 'modbus' })).toBeInstanceOf(ModbusParser);
  });

  it('retorna GenericParser para tipo desconhecido ou null', () => {
    expect(createParser({ parserTipo: null })).toBeInstanceOf(GenericParser);
    expect(createParser({ parserTipo: 'xyz' })).toBeInstanceOf(GenericParser);
    expect(createParser({})).toBeInstanceOf(GenericParser);
  });

  it('é case-insensitive', () => {
    expect(createParser({ parserTipo: 'TOLEDO' })).toBeInstanceOf(ToledoParser);
    expect(createParser({ parserTipo: 'Modbus' })).toBeInstanceOf(ModbusParser);
  });
});
