/**
 * Smoke test dos 13 parsers de balança.
 *
 * Para cada tipo registrado em `parser.factory.ts`, alimenta um frame
 * representativo (extraído dos *.parser.spec.ts) e valida que `parse()`
 * devolve uma leitura coerente — peso esperado (com tolerância 1e-6),
 * estabilidade quando aplicável, e buffer restante vazio.
 *
 * Uso:
 *   cd backend
 *   pnpm exec ts-node --transpile-only \
 *     --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
 *     scripts/smoke-balanca.ts
 *
 * Exit code 1 se qualquer parser falhar.
 */

import { createParser } from '../src/balanca/parsers/parser.factory';
import type { ParserConfig } from '../src/balanca/parsers/parser.interface';

interface Caso {
  tipo: string;
  config: ParserConfig;
  frame: Buffer;
  pesoEsperado: number;
  estavelEsperado?: boolean;
}

const STX = 0x02;
const ETX = 0x03;
const CR = 0x0d;
const LF = 0x0a;
const ENQ = 0x05;

function tramaToledoB(statusByte: number, peso: string): Buffer {
  return Buffer.concat([Buffer.from([STX, statusByte]), Buffer.from(peso), Buffer.from([CR])]);
}

const casos: Caso[] = [
  {
    tipo: 'toledo',
    config: {},
    frame: tramaToledoB(0x20, '012345'),
    pesoEsperado: 12345,
    estavelEsperado: true,
  },
  {
    tipo: 'toledo-c',
    config: { fator: 100 },
    frame: Buffer.concat([
      Buffer.from([STX]),
      Buffer.from('i2  00010000000'),
      Buffer.from([CR, ENQ]),
    ]),
    pesoEsperado: 100000,
    estavelEsperado: true,
  },
  {
    tipo: 'toledo-2090',
    config: {},
    frame: Buffer.from([STX, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, CR, LF]),
    pesoEsperado: 12345,
    estavelEsperado: false,
  },
  {
    tipo: 'toledo-2180',
    config: {},
    frame: Buffer.from([STX, 0x20, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, CR, LF]),
    pesoEsperado: 12345,
    estavelEsperado: true,
  },
  {
    tipo: 'filizola',
    config: {},
    frame: tramaToledoB(0x20, '012345'),
    pesoEsperado: 12345,
    estavelEsperado: true,
  },
  {
    tipo: 'filizola-at',
    config: {},
    frame: Buffer.concat([Buffer.from('@002.448'), Buffer.from([CR])]),
    pesoEsperado: 2.448,
    estavelEsperado: false,
  },
  {
    tipo: 'digitron',
    config: {},
    frame: Buffer.concat([Buffer.from('D000.318'), Buffer.from([CR])]),
    pesoEsperado: 0.318,
  },
  {
    tipo: 'urano',
    config: {},
    frame: Buffer.concat([Buffer.from([STX]), Buffer.from(' 00 12,345 ,kg '), Buffer.from([ETX])]),
    pesoEsperado: 12.345,
    estavelEsperado: true,
  },
  {
    tipo: 'afts',
    config: {},
    frame: Buffer.from('ST,GS,+   12.345 kg\r\n'),
    pesoEsperado: 12.345,
    estavelEsperado: true,
  },
  {
    tipo: 'saturno',
    config: {},
    frame: Buffer.concat([Buffer.from([STX]), Buffer.from('012345'), Buffer.from([ETX])]),
    pesoEsperado: 12345,
    estavelEsperado: false,
  },
  {
    tipo: 'sics',
    config: {},
    frame: Buffer.from('S S     12.345 kg\r\n'),
    pesoEsperado: 12.345,
    estavelEsperado: true,
  },
  {
    tipo: 'modbus',
    config: {},
    frame: Buffer.from('1234.5\n'),
    pesoEsperado: 1234.5,
  },
  {
    tipo: 'generic',
    config: { inicioPeso: 3, tamanhoPeso: 6, marcador: 13 },
    frame: Buffer.from([STX, 0x53, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, CR]),
    pesoEsperado: 12345,
  },
];

interface Resultado {
  tipo: string;
  ok: boolean;
  peso: number | null;
  estavel: boolean | null;
  erro?: string;
}

const EPS = 1e-6;

function executar(caso: Caso): Resultado {
  try {
    const parser = createParser({ parserTipo: caso.tipo, ...caso.config });
    const { leitura, restante } = parser.parse(caso.frame);
    if (leitura === null) {
      return { tipo: caso.tipo, ok: false, peso: null, estavel: null, erro: 'leitura nula' };
    }
    if (Math.abs(leitura.peso - caso.pesoEsperado) > EPS) {
      return {
        tipo: caso.tipo,
        ok: false,
        peso: leitura.peso,
        estavel: leitura.estavel,
        erro: `peso esperado ${caso.pesoEsperado}, lido ${leitura.peso}`,
      };
    }
    if (caso.estavelEsperado !== undefined && leitura.estavel !== caso.estavelEsperado) {
      return {
        tipo: caso.tipo,
        ok: false,
        peso: leitura.peso,
        estavel: leitura.estavel,
        erro: `estavel esperado ${caso.estavelEsperado}, lido ${leitura.estavel}`,
      };
    }
    if (restante.length !== 0) {
      return {
        tipo: caso.tipo,
        ok: false,
        peso: leitura.peso,
        estavel: leitura.estavel,
        erro: `buffer restante ${restante.length} bytes`,
      };
    }
    return { tipo: caso.tipo, ok: true, peso: leitura.peso, estavel: leitura.estavel };
  } catch (e) {
    return { tipo: caso.tipo, ok: false, peso: null, estavel: null, erro: (e as Error).message };
  }
}

function main() {
  console.log('Smoke parsers de balança\n');
  const linhas = casos.map(executar);

  const w = (s: string, n: number) => s.padEnd(n);
  console.log(w('tipo', 16) + w('status', 8) + w('peso', 12) + w('estavel', 10) + 'erro');
  console.log('-'.repeat(80));
  for (const r of linhas) {
    console.log(
      w(r.tipo, 16) +
        w(r.ok ? 'OK' : 'FAIL', 8) +
        w(r.peso === null ? '-' : String(r.peso), 12) +
        w(r.estavel === null ? '-' : String(r.estavel), 10) +
        (r.erro ?? ''),
    );
  }

  const falhas = linhas.filter((r) => !r.ok);
  console.log(
    '\n' +
      (falhas.length === 0
        ? `OK ${linhas.length}/${linhas.length} parsers`
        : `FAIL ${falhas.length}/${linhas.length} parsers`),
  );
  process.exit(falhas.length === 0 ? 0 : 1);
}

main();
