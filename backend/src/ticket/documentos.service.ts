import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

async function fileExists(p: string): Promise<boolean> {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function getBasePath(): string {
  const appdata =
    process.env.APPDATA ||
    path.join(process.env.USERPROFILE || process.env.HOME || '.', 'AppData', 'Roaming');
  return path.join(appdata, 'SolutionTicket', 'docs');
}

function isInsideDocumentsBase(filePath: string): boolean {
  const base = path.resolve(getBasePath());
  const resolved = path.resolve(filePath);
  const relative = path.relative(base, resolved);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function detectMime(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return null;
}

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(ticketId: string, tenantId?: string) {
    // Onda 2.5: ownership check — usuario do tenant A nao lista docs do tenant B
    if (tenantId) {
      const ticket = await this.prisma.ticketPesagem.findUnique({
        where: { id: ticketId },
        select: { tenantId: true },
      });
      if (!ticket) throw new NotFoundException('Ticket não encontrado');
      if (ticket.tenantId !== tenantId) {
        throw new NotFoundException('Ticket não encontrado'); // nao expoe existencia
      }
    }
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
    tenantId?: string,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    const detectedMime = detectMime(file.buffer);
    if (!detectedMime || detectedMime !== file.mimetype) {
      throw new BadRequestException('Tipo de arquivo invalido');
    }
    const ticket = await this.prisma.ticketPesagem.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    // Onda 2.5: ownership check antes de aceitar upload
    if (tenantId && ticket.tenantId !== tenantId) {
      throw new NotFoundException('Ticket não encontrado');
    }

    const dir = path.join(getBasePath(), ticketId);
    await fsp.mkdir(dir, { recursive: true });

    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(dir, safeName);
    await fsp.writeFile(destPath, file.buffer);

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

  async remover(id: string, tenantId?: string) {
    const doc = await this.prisma.documentoPesagem.findUnique({
      where: { id },
      include: { ticket: { select: { tenantId: true } } },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    // Onda 2.5: ownership check — atacante autenticado nao remove doc de outro tenant
    if (tenantId && doc.ticket.tenantId !== tenantId) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (doc.arquivoUrl && !isInsideDocumentsBase(doc.arquivoUrl)) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (doc.arquivoUrl && (await fileExists(doc.arquivoUrl))) {
      try {
        await fsp.unlink(doc.arquivoUrl);
      } catch {
        /* ignore */
      }
    }
    await this.prisma.documentoPesagem.delete({ where: { id } });
    return { ok: true };
  }

  async download(
    id: string,
    tenantId?: string,
  ): Promise<{ path: string; nome: string; mime: string }> {
    const doc = await this.prisma.documentoPesagem.findUnique({
      where: { id },
      include: { ticket: { select: { tenantId: true } } },
    });
    if (!doc || !doc.arquivoUrl) throw new NotFoundException('Documento não encontrado');
    // Onda 2.5: ownership check antes de servir o arquivo
    if (tenantId && doc.ticket.tenantId !== tenantId) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (!isInsideDocumentsBase(doc.arquivoUrl)) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (!(await fileExists(doc.arquivoUrl)))
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
