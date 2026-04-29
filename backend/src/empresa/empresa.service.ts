import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';
import { validarPessoaFiscal, normalizarDocumento, TipoPessoa } from '../common/pessoa-fiscal';

@Injectable()
export class EmpresaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmpresaDto, tenantId: string) {
    const tipoPessoa: TipoPessoa = (dto.tipoPessoa ?? 'PJ') as TipoPessoa;
    validarPessoaFiscal({
      tipoPessoa,
      documento: dto.documento,
      inscricaoEstadual: dto.inscricaoEstadual,
    });
    return this.prisma.empresa.create({
      data: {
        tenantId,
        nomeEmpresarial: dto.nomeEmpresarial,
        nomeFantasia: dto.nomeFantasia,
        tipoPessoa,
        documento: normalizarDocumento(dto.documento)!,
        inscricaoEstadual: dto.inscricaoEstadual,
        inscricaoMunicipal: dto.inscricaoMunicipal,
        endereco: dto.endereco,
        cidade: dto.cidade,
        uf: dto.uf,
        telefone: dto.telefone,
        email: dto.email,
        site: dto.site,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.empresa.findMany({
      where: { tenantId },
      include: { unidades: true },
    });
  }

  async findOne(id: string, tenantId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id, tenantId },
      include: { unidades: true, tenant: true },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto, tenantId: string) {
    const atual = await this.findOne(id, tenantId);
    // Re-valida pessoa fiscal se algum campo relevante mudou.
    if (
      dto.tipoPessoa !== undefined ||
      dto.documento !== undefined ||
      dto.inscricaoEstadual !== undefined
    ) {
      validarPessoaFiscal({
        tipoPessoa: (dto.tipoPessoa ?? atual.tipoPessoa) as TipoPessoa,
        documento: dto.documento ?? atual.documento,
        inscricaoEstadual: dto.inscricaoEstadual ?? atual.inscricaoEstadual,
      });
    }
    return this.prisma.empresa.update({
      where: { id },
      data: {
        ...dto,
        documento: dto.documento === undefined ? undefined : normalizarDocumento(dto.documento)!,
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.unidade.deleteMany({ where: { empresaId: id } });
    await this.prisma.empresa.delete({ where: { id } });
    return { message: 'Empresa removida com sucesso' };
  }

  // Unidades
  async createUnidade(dto: CreateUnidadeDto, tenantId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: dto.empresaId, tenantId },
      select: { id: true },
    });
    if (!empresa) throw new ForbiddenException('Empresa nao pertence ao tenant');
    return this.prisma.unidade.create({ data: { ...dto } });
  }

  async findAllUnidades(tenantId: string, empresaId?: string) {
    return this.prisma.unidade.findMany({
      where: {
        ...(empresaId ? { empresaId } : {}),
        empresa: { tenantId },
      },
      include: { empresa: true },
    });
  }

  async findOneUnidade(id: string, tenantId: string) {
    const unidade = await this.prisma.unidade.findUnique({
      where: { id },
      include: { empresa: true },
    });
    if (!unidade || unidade.empresa.tenantId !== tenantId) {
      throw new NotFoundException('Unidade não encontrada');
    }
    return unidade;
  }

  async updateUnidade(id: string, dto: UpdateUnidadeDto, tenantId: string) {
    await this.findOneUnidade(id, tenantId);
    return this.prisma.unidade.update({ where: { id }, data: { ...dto } });
  }

  async removeUnidade(id: string, tenantId: string) {
    await this.findOneUnidade(id, tenantId);
    await this.prisma.unidade.delete({ where: { id } });
    return { message: 'Unidade removida com sucesso' };
  }
}
