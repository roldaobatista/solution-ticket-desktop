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

@Injectable()
export class BalancaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBalancaDto, tenantId: string) {
    await this.validarPosseEmpresaUnidade(dto.empresaId, dto.unidadeId, tenantId);
    const data = this.normalizarProtocolo(dto);
    await this.validarProtocoloEPorta(data);
    return this.prisma.balanca.create({
      data: { ...data, tenantId },
    });
  }

  private normalizarProtocolo<T extends CreateBalancaDto | UpdateBalancaDto>(dto: T): T {
    const protocolo = (dto.protocolo ?? 'serial').toLowerCase();
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

  private async validarProtocoloEPorta(
    dto: CreateBalancaDto | UpdateBalancaDto,
    excluirId?: string,
  ) {
    const protocolo = dto.protocolo ?? 'serial';
    const usaSerial = protocolo === 'serial' || protocolo === 'modbus-rtu';
    const usaTcp = protocolo === 'tcp' || protocolo === 'modbus-tcp';

    if (usaSerial) {
      if (!dto.porta) {
        throw new BadRequestException(`protocolo=${dto.protocolo} exige porta serial (ex: COM3)`);
      }
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
          `Porta ${dto.porta} ja esta em uso pela balanca "${conflito.nome}"`,
        );
      }
    }
    if (usaTcp && (!dto.enderecoIp || !dto.portaTcp)) {
      throw new BadRequestException(`protocolo=${protocolo} exige enderecoIp e portaTcp`);
    }
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
        include: { empresa: true, unidade: true },
      }),
      this.prisma.balanca.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const balanca = await this.prisma.balanca.findFirst({
      where: { id, tenantId },
      include: { empresa: true, unidade: true },
    });
    if (!balanca) throw new NotFoundException('Balanca nao encontrada');
    return balanca;
  }

  async update(id: string, dto: UpdateBalancaDto, tenantId: string) {
    await this.findOne(id, tenantId);
    const data = this.normalizarProtocolo(dto);
    if (dto.protocolo || dto.porta || dto.enderecoIp) {
      await this.validarProtocoloEPorta(data, id);
    }
    return this.prisma.balanca.update({
      where: { id, tenantId },
      data: { ...data },
    });
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
