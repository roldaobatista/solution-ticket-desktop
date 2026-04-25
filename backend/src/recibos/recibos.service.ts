import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { numeroParaExtenso } from '../common/extenso.util';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class RecibosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    const valor = Number(data.valor || 0);
    const valorExtenso =
      data.valorExtenso && String(data.valorExtenso).trim().length > 0
        ? data.valorExtenso
        : numeroParaExtenso(valor);
    return this.prisma.recibo.create({
      data: {
        tenantId: data.tenantId,
        data: new Date(data.data),
        cedente: data.cedente,
        sacado: data.sacado,
        valor,
        telefone: data.telefone || null,
        celular: data.celular || null,
        cpf: data.cpf || null,
        endereco: data.endereco || null,
        valorExtenso,
        referente: data.referente || null,
        usuarioId: data.usuarioId || null,
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

  async update(id: string, data: any) {
    await this.findOne(id);
    const patch: any = { ...data };
    if (patch.data) patch.data = new Date(patch.data);
    if (patch.valor !== undefined) {
      patch.valor = Number(patch.valor);
      if (!patch.valorExtenso || String(patch.valorExtenso).trim().length === 0) {
        patch.valorExtenso = numeroParaExtenso(patch.valor);
      }
    }
    delete patch.id;
    delete patch.criadoEm;
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
        const doc = new (PDFDocument as any)({ size: 'A4', margin: 50 });
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
