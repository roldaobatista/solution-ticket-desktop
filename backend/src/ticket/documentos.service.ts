import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

function getBasePath(): string {
  const appdata =
    process.env.APPDATA ||
    path.join(process.env.USERPROFILE || process.env.HOME || '.', 'AppData', 'Roaming');
  return path.join(appdata, 'SolutionTicket', 'docs');
}

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(ticketId: string) {
    return this.prisma.documentoPesagem.findMany({
      where: { ticketId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async upload(
    ticketId: string,
    file: Express.Multer.File,
    tipo?: string,
    numero?: string,
    observacao?: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const ticket = await this.prisma.ticketPesagem.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const dir = path.join(getBasePath(), ticketId);
    fs.mkdirSync(dir, { recursive: true });

    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(dir, safeName);
    fs.writeFileSync(destPath, file.buffer);

    return this.prisma.documentoPesagem.create({
      data: {
        ticketId,
        tipo: tipo || 'ANEXO',
        numero: numero || null,
        arquivoUrl: destPath,
        observacao: observacao || file.originalname,
      },
    });
  }

  async remover(id: string) {
    const doc = await this.prisma.documentoPesagem.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    if (doc.arquivoUrl && fs.existsSync(doc.arquivoUrl)) {
      try {
        fs.unlinkSync(doc.arquivoUrl);
      } catch {
        /* ignore */
      }
    }
    await this.prisma.documentoPesagem.delete({ where: { id } });
    return { ok: true };
  }

  async download(id: string): Promise<{ path: string; nome: string; mime: string }> {
    const doc = await this.prisma.documentoPesagem.findUnique({ where: { id } });
    if (!doc || !doc.arquivoUrl) throw new NotFoundException('Documento não encontrado');
    if (!fs.existsSync(doc.arquivoUrl))
      throw new NotFoundException('Arquivo físico não encontrado');
    const nome = path.basename(doc.arquivoUrl);
    const ext = path.extname(nome).toLowerCase();
    const mime =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
          ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'application/octet-stream';
    return { path: doc.arquivoUrl, nome, mime };
  }
}
