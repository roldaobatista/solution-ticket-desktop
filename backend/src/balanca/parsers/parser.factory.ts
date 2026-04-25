import { IBalancaParser, ParserConfig } from './parser.interface';
import { GenericParser } from './generic.parser';
import { ToledoParser } from './toledo.parser';
import { ToledoCParser } from './toledo-c.parser';
import { Toledo2090Parser } from './toledo-2090.parser';
import { Toledo2180Parser } from './toledo-2180.parser';
import { FilizolaParser } from './filizola.parser';
import { FilizolaAtParser } from './filizola-at.parser';
import { DigitronParser } from './digitron.parser';
import { UranoParser } from './urano.parser';
import { AftsParser } from './afts.parser';
import { SaturnoParser } from './saturno.parser';
import { SicsParser } from './sics.parser';
import { ModbusParser } from './modbus.parser';

export function createParser(config: ParserConfig): IBalancaParser {
  const tipo = (config.parserTipo ?? 'generic').toLowerCase();
  switch (tipo) {
    case 'toledo':
    case 'toledo-b':
      return new ToledoParser(config);
    case 'toledo-c':
      return new ToledoCParser(config);
    case 'toledo-2090':
      return new Toledo2090Parser(config);
    case 'toledo-2180':
    case 'toledo-8530':
      return new Toledo2180Parser(config);
    case 'filizola':
      return new FilizolaParser(config);
    case 'filizola-at':
    case 'filizola-@':
      return new FilizolaAtParser(config);
    case 'digitron':
      return new DigitronParser(config);
    case 'urano':
    case 'urano-pop':
      return new UranoParser(config);
    case 'afts':
    case 'tcs':
    case 'a-d':
      return new AftsParser(config);
    case 'saturno':
      return new SaturnoParser(config);
    case 'sics':
    case 'mt-sics':
      return new SicsParser(config);
    case 'modbus':
      return new ModbusParser(config);
    case 'generic':
    default:
      return new GenericParser(config);
  }
}
