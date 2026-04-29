import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBalancaDto } from './dto/create-balanca.dto';
import { UpdateBalancaDto } from './dto/update-balanca.dto';
import { BalancaFilterDto } from './dto/balanca-filter.dto';
import { resolveEffectiveConfigWithSources } from './config-resolver';

@Injectable()
export class BalancaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBalancaDto, tenantId: string) {
    await this.validarPosseEmpresaUnidade(dto.empresaId, dto.unidadeId, tenantId);
    await this.validarIndicador(dto.indicadorId, tenantId);
    const data = this.normalizarProtocolo(dto, 'serial');
    await this.validarProtocoloEPorta(data);
    return this.prisma.balanca.create({
      data: { ...data, statusOnline: false, tenantId },
    });
  }

  private normalizarProtocolo<T extends CreateBalancaDto | UpdateBalancaDto>(
    dto: T,
    defaultProtocolo?: string,
  ): T {
    const protocoloOriginal = dto.protocolo ?? defaultProtocolo;
    if (!protocoloOriginal) return dto;
    const protocolo = protocoloOriginal.toLowerCase();
    let normalizado = protocolo;
    if (['rs232', 'rs485'].includes(protocolo)) normalizado = 'serial';
    if (['tcpip', 'tcp/ip', 'ethernet'].includes(protocolo)) normalizado = 'tcp';
    return { ...dto, protocolo: normalizado } as T;
  }

  private async validarPosseEmpresaUnidade(empresaId: string, unidadeId: string, tenantId: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, tenantId },
      select: { id: true },
    });
    if (!empresa) {
      throw new ForbiddenException('Empresa nao pertence ao tenant');
    }
    const unidade = await this.prisma.unidade.findFirst({
      where: { id: unidadeId, empresaId },
      select: { id: true },
    });
    if (!unidade) {
      throw new ForbiddenException('Unidade nao pertence a empresa do tenant');
    }
  }

  private async validarIndicador(indicadorId: string | undefined, tenantId: string) {
    if (!indicadorId) return;
    const indicador = await this.prisma.indicadorPesagem.findFirst({
      where: { id: indicadorId, tenantId },
      select: { id: true },
    });
    if (!indicador) {
      throw new ForbiddenException('Indicador de pesagem nao pertence ao tenant');
    }
  }

  private async validarProtocoloEPorta(
    dto: CreateBalancaDto | UpdateBalancaDto,
    excluirId?: string,
  ) {
    const protocolo = dto.protocolo ?? 'serial';
    if (protocolo === 'modbus') {
      throw new BadRequestException(
        'protocolo=modbus exige escolha explicita: modbus-rtu ou modbus-tcp',
      );
    }
    const usaSerial = protocolo === 'serial' || protocolo === 'modbus-rtu';
    const usaTcp = protocolo === 'tcp' || protocolo === 'modbus-tcp';
    const finalAtivo = dto.ativo !== false;

    if (usaSerial) {
      if (!dto.porta) {
        throw new BadRequestException(`protocolo=${dto.protocolo} exige porta serial (ex: COM3)`);
      }
      if (finalAtivo) {
        const conflito = await this.prisma.balanca.findFirst({
          where: {
            porta: dto.porta,
            ativo: true,
            ...(excluirId ? { NOT: { id: excluirId } } : {}),
          },
          select: { id: true, nome: true },
        });
        if (conflito) {
          throw new ConflictException(
            `Porta ${dto.porta} ja esta em uso pela balanca ativa "${conflito.nome}" neste computador`,
          );
        }
      }
    }
    if (usaTcp && (!dto.enderecoIp || !dto.portaTcp)) {
      throw new BadRequestException(`protocolo=${protocolo} exige enderecoIp e portaTcp`);
    }
    if (protocolo === 'modbus-rtu' || protocolo === 'modbus-tcp') {
      if (!dto.modbusUnitId) {
        throw new BadRequestException(`protocolo=${protocolo} exige modbusUnitId`);
      }
      if (dto.modbusRegister === undefined || dto.modbusRegister === null) {
        throw new BadRequestException(`protocolo=${protocolo} exige modbusRegister`);
      }
    }
    if (dto.ovrDataBits != null && ![7, 8].includes(dto.ovrDataBits)) {
      throw new BadRequestException('ovrDataBits deve ser 7 ou 8');
    }
    if (dto.ovrStopBits != null && ![1, 2].includes(dto.ovrStopBits)) {
      throw new BadRequestException('ovrStopBits deve ser 1 ou 2');
    }
    this.validarLeituraConfiguravel(dto);
  }

  private validarLeituraConfiguravel(dto: CreateBalancaDto | UpdateBalancaDto) {
    const readMode = dto.readMode ?? 'continuous';
    if (!['continuous', 'polling', 'manual'].includes(readMode)) {
      throw new BadRequestException('readMode deve ser continuous, polling ou manual');
    }
    if (dto.readIntervalMs != null && dto.readIntervalMs < 200) {
      throw new BadRequestException('readIntervalMs minimo de 200ms');
    }
    if (dto.readTimeoutMs != null && dto.readTimeoutMs < 200) {
      throw new BadRequestException('readTimeoutMs minimo de 200ms');
    }
    const command = dto.readCommandHex?.replace(/\s+/g, '') ?? '';
    if (command && (!/^[0-9a-fA-F]+$/.test(command) || command.length % 2 !== 0)) {
      throw new BadRequestException('readCommandHex deve ser hexadecimal com quantidade par');
    }
    if (readMode === 'polling' && !command) {
      throw new BadRequestException('readMode=polling exige readCommandHex');
    }
  }

  private deveValidarConexao(dto: UpdateBalancaDto): boolean {
    const campos: Array<keyof UpdateBalancaDto> = [
      'protocolo',
      'porta',
      'enderecoIp',
      'portaTcp',
      'ativo',
      'baudRate',
      'modbusUnitId',
      'modbusRegister',
      'modbusFunction',
      'modbusByteOrder',
      'modbusWordOrder',
      'modbusSigned',
      'modbusScale',
      'modbusOffset',
      'ovrDataBits',
      'ovrParity',
      'ovrStopBits',
      'ovrFlowControl',
      'readMode',
      'readCommandHex',
      'readIntervalMs',
      'readTimeoutMs',
    ];
    return campos.some((campo) => Object.prototype.hasOwnProperty.call(dto, campo));
  }

  async findAll(filter: BalancaFilterDto, tenantId: string) {
    const where: Prisma.BalancaWhereInput = { tenantId };
    if (filter.empresaId) where.empresaId = filter.empresaId;
    if (filter.unidadeId) where.unidadeId = filter.unidadeId;
    if (filter.statusOnline !== undefined) where.statusOnline = filter.statusOnline;
    if (filter.ativo !== undefined) where.ativo = filter.ativo;

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.balanca.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        include: { empresa: true, unidade: true, indicador: true },
      }),
      this.prisma.balanca.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const balanca = await this.prisma.balanca.findFirst({
      where: { id, tenantId },
      include: { empresa: true, unidade: true, indicador: true },
    });
    if (!balanca) throw new NotFoundException('Balanca nao encontrada');
    return balanca;
  }

  async update(id: string, dto: UpdateBalancaDto, tenantId: string) {
    const atual = await this.findOne(id, tenantId);
    const empresaId = dto.empresaId ?? atual.empresaId;
    const unidadeId = dto.unidadeId ?? atual.unidadeId;
    if (dto.empresaId || dto.unidadeId) {
      await this.validarPosseEmpresaUnidade(empresaId, unidadeId, tenantId);
    }
    await this.validarIndicador(dto.indicadorId, tenantId);
    const data = this.normalizarProtocolo(dto);
    if (this.deveValidarConexao(dto)) {
      const estado = this.normalizarProtocolo(
        { ...atual, ...data } as unknown as UpdateBalancaDto,
        atual.protocolo,
      );
      await this.validarProtocoloEPorta(estado, id);
    }
    const updateData = data as Prisma.BalancaUncheckedUpdateInput;
    return this.prisma.balanca.update({
      where: { id, tenantId },
      data: updateData,
    });
  }

  async effectiveConfig(id: string, tenantId: string) {
    const balanca = await this.prisma.balanca.findFirst({
      where: { id, tenantId },
      include: { indicador: true },
    });
    if (!balanca) throw new NotFoundException('Balanca nao encontrada');
    return resolveEffectiveConfigWithSources(balanca, balanca.indicador);
  }

  async updateStatus(id: string, statusOnline: boolean, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.balanca.update({
      where: { id, tenantId },
      data: { statusOnline, atualizadoEm: new Date() },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.balanca.update({
      where: { id, tenantId },
      data: { ativo: false },
    });
  }
}
