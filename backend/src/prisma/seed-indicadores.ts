import { PrismaClient } from '@prisma/client';

/**
 * 12 indicadores de pesagem pré-configurados (extraídos do PesoLog).
 * Campos por ordem: baudrate, inicioPeso, tamanhoPeso, tamanhoString, marcador, fator.
 */
export const INDICADORES_PADRAO = [
  {
    descricao: 'ALFA 3102',
    baudrate: 9600,
    inicioPeso: 5,
    tamanhoPeso: 6,
    tamanhoString: 22,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'WEIGHTECH WT1000 LED A12',
    baudrate: 4800,
    inicioPeso: 4,
    tamanhoPeso: 5,
    tamanhoString: 13,
    marcador: 13,
    fator: 10,
    parserTipo: 'generic',
  },
  {
    descricao: 'WEIGHTECH WT3000 I',
    baudrate: 9600,
    inicioPeso: 9,
    tamanhoPeso: 6,
    tamanhoString: 20,
    marcador: 10,
    fator: 10,
    parserTipo: 'generic',
  },
  {
    descricao: 'WEIGHTECH WT genérico',
    baudrate: 9600,
    inicioPeso: 8,
    tamanhoPeso: 6,
    tamanhoString: 18,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'JUNDIAI BJ-850',
    baudrate: 9600,
    inicioPeso: 10,
    tamanhoPeso: 6,
    tamanhoString: 30,
    marcador: 58,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'MASTERTEC MASTERPRO',
    baudrate: 4800,
    inicioPeso: 1,
    tamanhoPeso: 6,
    tamanhoString: 12,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'SATURNO C/ INDICADOR',
    baudrate: 4800,
    inicioPeso: 1,
    tamanhoPeso: 6,
    tamanhoString: 12,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'SATURNO S/ INDICADOR',
    baudrate: 4800,
    inicioPeso: 1,
    tamanhoPeso: 6,
    tamanhoString: 8,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'TOLEDO 9091 P03',
    baudrate: 9600,
    inicioPeso: 6,
    tamanhoPeso: 6,
    tamanhoString: 18,
    marcador: 13,
    fator: 1,
    parserTipo: 'toledo',
  },
  {
    descricao: 'DIGITRON 6 dígitos',
    baudrate: 9600,
    inicioPeso: 2,
    tamanhoPeso: 6,
    tamanhoString: 9,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'DIGITRON 5 dígitos',
    baudrate: 9600,
    inicioPeso: 2,
    tamanhoPeso: 5,
    tamanhoString: 8,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
  {
    descricao: 'MULLER CRM 80000',
    baudrate: 1200,
    inicioPeso: 2,
    tamanhoPeso: 6,
    tamanhoString: 8,
    marcador: 13,
    fator: 1,
    parserTipo: 'generic',
  },
];

export async function seedIndicadoresHardware(prisma: PrismaClient, tenantId: string) {
  for (const ind of INDICADORES_PADRAO) {
    const existe = await prisma.indicadorPesagem.findFirst({
      where: { tenantId, descricao: ind.descricao },
    });
    if (existe) {
      await prisma.indicadorPesagem.update({
        where: { id: existe.id },
        data: {
          parserTipo: ind.parserTipo,
          baudrate: ind.baudrate,
          databits: 8,
          stopbits: 1,
          parity: 'none',
          flowControl: 'none',
          inicioPeso: ind.inicioPeso,
          tamanhoPeso: ind.tamanhoPeso,
          tamanhoString: ind.tamanhoString,
          marcador: ind.marcador,
          fator: ind.fator,
          invertePeso: false,
        },
      });
    } else {
      await prisma.indicadorPesagem.create({
        data: {
          tenantId,
          descricao: ind.descricao,
          parserTipo: ind.parserTipo,
          baudrate: ind.baudrate,
          databits: 8,
          stopbits: 1,
          parity: 'none',
          flowControl: 'none',
          inicioPeso: ind.inicioPeso,
          tamanhoPeso: ind.tamanhoPeso,
          tamanhoString: ind.tamanhoString,
          marcador: ind.marcador,
          fator: ind.fator,
          invertePeso: false,
        },
      });
    }
  }
  console.log(`Seeded ${INDICADORES_PADRAO.length} indicadores de hardware`);
}
