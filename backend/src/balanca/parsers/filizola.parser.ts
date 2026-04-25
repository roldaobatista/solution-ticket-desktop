import { ToledoParser } from './toledo.parser';
import { ParserConfig } from './parser.interface';

/**
 * Filizola segue estrutura similar a Toledo (STX + status + peso + CR).
 * Reutiliza ToledoParser.
 */
export class FilizolaParser extends ToledoParser {
  constructor(config: ParserConfig) {
    super(config);
  }
}
