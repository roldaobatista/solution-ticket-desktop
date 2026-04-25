import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getUserDataDir } from '../common/desktop-paths';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get fotosDir(): string {
    return path.join(getUserDataDir(), 'fotos');
  }

  /**
   * Recebe imagem em base64 (data URL ou puro), persiste no disco e
   * registra metadata no banco vinculado ao ticket/passagem.
   */
  async salvar(input: {
    ticketId: string;
    passagemId?: string;
    base64: string;
    origem?: 'WEBCAM' | 'IP_CAMERA' | 'OCR';
    placaDetectada?: string;
  }) {
    if (!input.base64 || input.base64.length < 100) {
      throw new BadRequestException('Imagem ausente ou inválida.');
    }
    const ticket = await this.prisma.ticketPesagem.findUnique({
      where: { id: input.ticketId },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${input.ticketId} não encontrado.`);

    fs.mkdirSync(this.fotosDir, { recursive: true });

    // Aceita "data:image/jpeg;base64,XXXX" ou base64 puro
    const m = input.base64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    const ext = m ? m[1].split('/')[1] : 'jpg';
    const raw = m ? m[2] : input.base64;
    const buffer = Buffer.from(raw, 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      throw new BadRequestException('Imagem maior que 8 MB.');
    }
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const filename = `${ticket.numero}-${Date.now()}-${sha256.slice(0, 8)}.${ext}`;
    const fullPath = path.join(this.fotosDir, filename);
    fs.writeFileSync(fullPath, buffer);

    return this.prisma.fotoPesagem.create({
      data: {
        ticketId: input.ticketId,
        passagemId: input.passagemId,
        caminhoArquivo: fullPath,
        origem: input.origem ?? 'WEBCAM',
        placaDetectada: input.placaDetectada,
        tamanhoBytes: buffer.length,
        sha256,
      },
    });
  }

  async listarPorTicket(ticketId: string) {
    return this.prisma.fotoPesagem.findMany({
      where: { ticketId },
      orderBy: { capturadoEm: 'asc' },
    });
  }

  async obterArquivo(id: string): Promise<{ buffer: Buffer; mime: string; filename: string }> {
    const foto = await this.prisma.fotoPesagem.findUnique({ where: { id } });
    if (!foto) throw new NotFoundException(`Foto ${id} não encontrada`);
    if (!fs.existsSync(foto.caminhoArquivo)) {
      throw new NotFoundException(`Arquivo físico ausente: ${foto.caminhoArquivo}`);
    }
    const buffer = fs.readFileSync(foto.caminhoArquivo);
    const ext = path.extname(foto.caminhoArquivo).slice(1).toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { buffer, mime, filename: path.basename(foto.caminhoArquivo) };
  }

  async excluir(id: string) {
    const foto = await this.prisma.fotoPesagem.findUnique({ where: { id } });
    if (!foto) throw new NotFoundException(`Foto ${id} não encontrada`);
    try {
      if (fs.existsSync(foto.caminhoArquivo)) fs.unlinkSync(foto.caminhoArquivo);
    } catch (err) {
      this.logger.warn(`Falha ao remover arquivo físico: ${(err as Error).message}`);
    }
    await this.prisma.fotoPesagem.delete({ where: { id } });
    return { ok: true };
  }
}
