import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { createTransport, Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../common/crypto.util';
import { CreateSmtpConfigDto } from './dto/create-smtp-config.dto';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    const cfg = await this.prisma.configuracaoSmtp.findUnique({ where: { tenantId } });
    if (!cfg) return null;
    return {
      id: cfg.id,
      tenantId: cfg.tenantId,
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      user: cfg.user,
      from: cfg.from,
      fromName: cfg.fromName,
      ativo: cfg.ativo,
      criadoEm: cfg.criadoEm,
      atualizadoEm: cfg.atualizadoEm,
    };
  }

  async createOrUpdate(tenantId: string, dto: CreateSmtpConfigDto | UpdateSmtpConfigDto) {
    const existing = await this.prisma.configuracaoSmtp.findUnique({ where: { tenantId } });
    const data: Prisma.ConfiguracaoSmtpUncheckedCreateInput = {
      ...(dto as Prisma.ConfiguracaoSmtpUncheckedCreateInput),
      tenantId,
    };
    if (dto.senha) {
      data.senha = encrypt(dto.senha);
    }
    if (existing) {
      return this.prisma.configuracaoSmtp.update({
        where: { tenantId },
        data,
      });
    }
    return this.prisma.configuracaoSmtp.create({ data });
  }

  async remove(tenantId: string) {
    await this.prisma.configuracaoSmtp.delete({ where: { tenantId } });
  }

  async testConnection(tenantId: string): Promise<{ ok: boolean; message: string }> {
    const cfg = await this.prisma.configuracaoSmtp.findUnique({ where: { tenantId } });
    if (!cfg) {
      return { ok: false, message: 'Nenhuma configuracao SMTP encontrada para este tenant.' };
    }
    if (!cfg.ativo) {
      return { ok: false, message: 'Configuracao SMTP esta desativada.' };
    }
    try {
      const transport = this.buildTransporter(cfg);
      await transport.verify();
      return { ok: true, message: 'Conexao SMTP verificada com sucesso.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Falha no teste SMTP para tenant ${tenantId}: ${msg}`);
      return { ok: false, message: `Falha na conexao SMTP: ${msg}` };
    }
  }

  async sendMail(
    tenantId: string,
    options: SendMailOptions,
  ): Promise<{ ok: boolean; messageId?: string; error?: string }> {
    const cfg = await this.prisma.configuracaoSmtp.findUnique({ where: { tenantId } });
    if (!cfg || !cfg.ativo) {
      this.logger.warn(`Tentativa de envio de e-mail sem SMTP configurado para tenant ${tenantId}`);
      return { ok: false, error: 'SMTP nao configurado ou inativo.' };
    }
    try {
      const transport = this.buildTransporter(cfg);
      const from = cfg.fromName ? `"${cfg.fromName}" <${cfg.from}>` : cfg.from;
      const info = await transport.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(
        `E-mail enviado para ${Array.isArray(options.to) ? options.to.join(', ') : options.to}: ${info.messageId}`,
      );
      return { ok: true, messageId: info.messageId };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Falha ao enviar e-mail para tenant ${tenantId}: ${msg}`);
      return { ok: false, error: msg };
    }
  }

  private buildTransporter(cfg: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    senha: string;
  }): Transporter {
    const password = decrypt(cfg.senha);
    return createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: password },
    });
  }
}
