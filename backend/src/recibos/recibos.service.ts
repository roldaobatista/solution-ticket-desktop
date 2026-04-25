import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { numeroParaExtenso } from '../common/extenso.util';
import { CreateReciboDto, UpdateReciboDto } from './dto/create-recibo.dto';

@Injectable()
export class RecibosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReciboDto) {
    const valor = Number(dto.valor || 0);
    const valorExtenso =
      dto.valorExtenso && dto.valorExtenso.trim().length > 0
        ? dto.valorExtenso
        : numeroParaExtenso(valor);
    return this.prisma.recibo.create({
      data: {
        tenantId: dto.tenantId,
        data: new Date(dto.data),
        cedente: dto.cedente,
        sacado: dto.sacado,
        valor,
        telefone: dto.telefone ?? null,
        celular: dto.celular ?? null,
        cpf: dto.cpf ?? null,
        endereco: dto.endereco ?? null,
        valorExtenso,
        referente: dto.referente ?? null,
        usuarioId: dto.usuarioId ?? null,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.recibo.findMany({
      where: { tenantId },
      orderBy: { data: 'desc' },
    });
  }

  async findOne(id: string) {
    const r = await this.prisma.recibo.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Recibo nao encontrado');
    return r;
  }

  async update(id: string, dto: UpdateReciboDto) {
    await this.findOne(id);
    const patch: Prisma.ReciboUpdateInput = {};
    if (dto.data !== undefined) patch.data = new Date(dto.data);
    if (dto.cedente !== undefined) patch.cedente = dto.cedente;
    if (dto.sacado !== undefined) patch.sacado = dto.sacado;
    if (dto.telefone !== undefined) patch.telefone = dto.telefone;
    if (dto.celular !== undefined) patch.celular = dto.celular;
    if (dto.cpf !== undefined) patch.cpf = dto.cpf;
    if (dto.endereco !== undefined) patch.endereco = dto.endereco;
    if (dto.referente !== undefined) patch.referente = dto.referente;
    if (dto.usuarioId !== undefined) patch.usuarioId = dto.usuarioId;
    if (dto.valor !== undefined) {
      patch.valor = Number(dto.valor);
      if (!dto.valorExtenso || dto.valorExtenso.trim().length === 0) {
        patch.valorExtenso = numeroParaExtenso(Number(dto.valor));
      }
    }
    if (dto.valorExtenso !== undefined && dto.valorExtenso.trim().length > 0) {
      patch.valorExtenso = dto.valorExtenso;
    }
    return this.prisma.recibo.update({ where: { id }, data: patch });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.recibo.delete({ where: { id } });
  }

  async gerarPdf(id: string): Promise<Buffer> {
    const r = await this.findOne(id);
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text('RECIBO', { align: 'center' });
        doc.moveDown();
        doc
          .fontSize(14)
          .text(`Valor: R$ ${Number(r.valor).toFixed(2).replace('.', ',')}`, { align: 'right' });
        doc.moveDown();
        doc.fontSize(11);
        doc.text(
          `Recebi(emos) de ${r.sacado} a importancia de R$ ${Number(r.valor).toFixed(2).replace('.', ',')} (${r.valorExtenso || numeroParaExtenso(Number(r.valor))}),`,
          { align: 'justify' },
        );
        if (r.referente) {
          doc.text(`referente a ${r.referente}.`, { align: 'justify' });
        }
        doc.moveDown();
        doc.text(`Cedente: ${r.cedente}`);
        if (r.cpf) doc.text(`CPF/CNPJ: ${r.cpf}`);
        if (r.endereco) doc.text(`Endereco: ${r.endereco}`);
        if (r.telefone) doc.text(`Telefone: ${r.telefone}`);
        if (r.celular) doc.text(`Celular: ${r.celular}`);
        doc.moveDown(2);
        const dataStr = new Date(r.data).toLocaleDateString('pt-BR');
        doc.text(`Data: ${dataStr}`, { align: 'right' });
        doc.moveDown(3);
        doc.text('_______________________________________', { align: 'center' });
        doc.text(r.cedente, { align: 'center' });
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
