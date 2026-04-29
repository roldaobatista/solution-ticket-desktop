import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRESETS_BALANCA } from '../balanca/presets';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';

type IndicadorInput = CreateIndicadorDto;

@Injectable()
export class IndicadorService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.indicadorPesagem.findMany({
      where: { tenantId, ativo: true },
      orderBy: [{ fabricante: 'asc' }, { modelo: 'asc' }, { descricao: 'asc' }],
    });
  }

  async findById(id: string, tenantId: string) {
    const ind = await this.prisma.indicadorPesagem.findFirst({ where: { id, tenantId } });
    if (!ind) throw new NotFoundException(`Indicador ${id} não encontrado`);
    return ind;
  }

  async create(input: IndicadorInput, tenantId: string) {
    if (!input.descricao || input.descricao.length < 3) {
      throw new BadRequestException('descrição obrigatória (>=3 chars)');
    }
    this.validarRead(input.readMode, input.readCommandHex);
    return this.prisma.indicadorPesagem.create({
      data: {
        tenantId,
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
        readMode: input.readMode ?? 'continuous',
        readCommandHex: input.readCommandHex,
        readIntervalMs: input.readIntervalMs,
        readTimeoutMs: input.readTimeoutMs,
        exemploTrama: input.exemploTrama,
        notas: input.notas,
        cor: input.cor,
        builtin: false,
      },
    });
  }

  async update(id: string, input: UpdateIndicadorDto, tenantId: string) {
    const existente = await this.findById(id, tenantId);
    const readMode = input.readMode === null ? 'continuous' : input.readMode;
    this.validarRead(
      readMode ?? existente.readMode,
      input.readCommandHex ?? existente.readCommandHex,
    );
    const data = this.toUpdateData({ ...input, readMode });
    return this.prisma.indicadorPesagem.update({
      where: { id },
      data,
    });
  }

  private validarRead(readMode?: string | null, commandHex?: string | null) {
    const mode = readMode ?? 'continuous';
    const command = commandHex?.replace(/\s+/g, '') ?? '';
    if (!['continuous', 'polling', 'manual'].includes(mode)) {
      throw new BadRequestException('readMode deve ser continuous, polling ou manual');
    }
    if (command && (!/^[0-9a-fA-F]+$/.test(command) || command.length % 2 !== 0)) {
      throw new BadRequestException('readCommandHex deve ser hexadecimal com quantidade par');
    }
    if (mode === 'polling' && !command) {
      throw new BadRequestException('readMode=polling exige readCommandHex');
    }
  }

  private toUpdateData(input: UpdateIndicadorDto): Prisma.IndicadorPesagemUpdateInput {
    const nullableKeys = [
      'fabricante',
      'modelo',
      'parserTipo',
      'baudrate',
      'databits',
      'stopbits',
      'parity',
      'flowControl',
      'inicioPeso',
      'tamanhoPeso',
      'tamanhoString',
      'marcador',
      'fator',
      'atraso',
      'readCommandHex',
      'readIntervalMs',
      'readTimeoutMs',
      'exemploTrama',
      'notas',
      'cor',
    ] as const;
    const requiredKeys = ['descricao', 'protocolo', 'invertePeso', 'readMode'] as const;
    const data: Record<string, unknown> = {};
    for (const key of nullableKeys) {
      if (Object.prototype.hasOwnProperty.call(input, key)) data[key] = input[key];
    }
    for (const key of requiredKeys) {
      const value = input[key];
      if (value !== undefined && value !== null) data[key] = value;
    }
    return data as Prisma.IndicadorPesagemUpdateInput;
  }

  async delete(id: string, tenantId: string) {
    const ind = await this.findById(id, tenantId);
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
          atraso: null,
          readMode: p.read?.mode ?? 'continuous',
          readCommandHex: p.read?.commandHex ?? null,
          readIntervalMs: p.read?.intervalMs ?? null,
          readTimeoutMs: p.read?.timeoutMs ?? 2000,
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
