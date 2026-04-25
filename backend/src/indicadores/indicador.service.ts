import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PRESETS_BALANCA } from '../balanca/presets';

export interface IndicadorInput {
  tenantId: string;
  fabricante?: string;
  modelo?: string;
  descricao: string;
  protocolo?: 'serial' | 'tcp' | 'modbus';
  parserTipo?: string;
  baudrate?: number;
  databits?: number;
  stopbits?: number;
  parity?: string;
  flowControl?: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
  atraso?: number;
  exemploTrama?: string;
  notas?: string;
  cor?: string;
}

@Injectable()
export class IndicadorService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.indicadorPesagem.findMany({
      where: { tenantId, ativo: true },
      orderBy: [{ fabricante: 'asc' }, { modelo: 'asc' }, { descricao: 'asc' }],
    });
  }

  async findById(id: string) {
    const ind = await this.prisma.indicadorPesagem.findUnique({ where: { id } });
    if (!ind) throw new NotFoundException(`Indicador ${id} não encontrado`);
    return ind;
  }

  async create(input: IndicadorInput) {
    if (!input.descricao || input.descricao.length < 3) {
      throw new BadRequestException('descrição obrigatória (>=3 chars)');
    }
    return this.prisma.indicadorPesagem.create({
      data: {
        tenantId: input.tenantId,
        fabricante: input.fabricante,
        modelo: input.modelo,
        descricao: input.descricao,
        protocolo: input.protocolo ?? 'serial',
        parserTipo: input.parserTipo,
        baudrate: input.baudrate ?? 9600,
        databits: input.databits ?? 8,
        stopbits: input.stopbits ?? 1,
        parity: input.parity ?? 'N',
        flowControl: input.flowControl ?? 'NONE',
        inicioPeso: input.inicioPeso,
        tamanhoPeso: input.tamanhoPeso,
        tamanhoString: input.tamanhoString,
        marcador: input.marcador ?? 13,
        fator: input.fator ?? 1,
        invertePeso: input.invertePeso ?? false,
        atraso: input.atraso ?? 0,
        exemploTrama: input.exemploTrama,
        notas: input.notas,
        cor: input.cor,
        builtin: false,
      },
    });
  }

  async update(id: string, input: Partial<IndicadorInput>) {
    const existente = await this.findById(id);
    return this.prisma.indicadorPesagem.update({
      where: { id },
      data: {
        fabricante: input.fabricante ?? existente.fabricante,
        modelo: input.modelo ?? existente.modelo,
        descricao: input.descricao ?? existente.descricao,
        protocolo: input.protocolo ?? existente.protocolo,
        parserTipo: input.parserTipo ?? existente.parserTipo,
        baudrate: input.baudrate ?? existente.baudrate,
        databits: input.databits ?? existente.databits,
        stopbits: input.stopbits ?? existente.stopbits,
        parity: input.parity ?? existente.parity,
        flowControl: input.flowControl ?? existente.flowControl,
        inicioPeso: input.inicioPeso ?? existente.inicioPeso,
        tamanhoPeso: input.tamanhoPeso ?? existente.tamanhoPeso,
        tamanhoString: input.tamanhoString ?? existente.tamanhoString,
        marcador: input.marcador ?? existente.marcador,
        fator: input.fator ?? existente.fator,
        invertePeso: input.invertePeso ?? existente.invertePeso,
        atraso: input.atraso ?? existente.atraso,
        exemploTrama: input.exemploTrama ?? existente.exemploTrama,
        notas: input.notas ?? existente.notas,
        cor: input.cor ?? existente.cor,
      },
    });
  }

  async delete(id: string) {
    const ind = await this.findById(id);
    if (ind.builtin) {
      throw new ForbiddenException(
        'Indicador builtin (preset) não pode ser excluído. Edite ou crie um novo.',
      );
    }
    // Soft delete
    return this.prisma.indicadorPesagem.update({
      where: { id },
      data: { ativo: false },
    });
  }

  /**
   * Faz seed dos 23 presets como builtin=true se ainda não existirem.
   * Idempotente — pode rodar a cada boot ou via endpoint.
   */
  async seedBuiltins(tenantId: string) {
    let criados = 0;
    for (const p of PRESETS_BALANCA) {
      const descricao = `${p.fabricante} - ${p.modelo}`;
      const existente = await this.prisma.indicadorPesagem.findFirst({
        where: { tenantId, descricao, builtin: true },
      });
      if (existente) continue;
      await this.prisma.indicadorPesagem.create({
        data: {
          tenantId,
          fabricante: p.fabricante,
          modelo: p.modelo,
          descricao,
          protocolo: p.protocolo,
          parserTipo: p.parserTipo,
          baudrate: p.serial.baudRate,
          databits: p.serial.dataBits,
          stopbits: p.serial.stopBits,
          parity: p.serial.parity,
          flowControl: p.serial.flowControl,
          inicioPeso: p.parser.inicioPeso ?? null,
          tamanhoPeso: p.parser.tamanhoPeso ?? null,
          tamanhoString: p.parser.tamanhoString ?? null,
          marcador: p.parser.marcador ?? 13,
          fator: p.parser.fator ?? 1,
          invertePeso: p.parser.invertePeso ?? false,
          exemploTrama: p.exemploTrama,
          notas: p.notas,
          builtin: true,
        },
      });
      criados += 1;
    }
    return { criados, totalPresets: PRESETS_BALANCA.length };
  }
}
