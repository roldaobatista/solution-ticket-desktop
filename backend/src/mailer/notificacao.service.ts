import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';
import * as https from 'https';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';

export type EventoNotificacao = 'erro_impressao' | 'falha_backup';

export interface NotificacaoPayload {
  evento: EventoNotificacao;
  assunto: string;
  texto: string;
  html?: string;
  dados?: Record<string, unknown>;
}

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async getConfig(tenantId: string) {
    return this.prisma.configuracaoNotificacao.findUnique({ where: { tenantId } });
  }

  async upsertConfig(
    tenantId: string,
    data: {
      emailErrosImpressao?: boolean;
      emailBackupFalha?: boolean;
      emailEnderecos?: string;
      webhookUrl?: string;
    },
  ) {
    const existing = await this.prisma.configuracaoNotificacao.findUnique({ where: { tenantId } });
    if (existing) {
      return this.prisma.configuracaoNotificacao.update({ where: { tenantId }, data });
    }
    return this.prisma.configuracaoNotificacao.create({ data: { tenantId, ...data } });
  }

  /** Dispara e-mail e/ou webhook conforme as preferencias do tenant para o evento. */
  async notificar(tenantId: string, payload: NotificacaoPayload): Promise<void> {
    const cfg = await this.prisma.configuracaoNotificacao.findUnique({ where: { tenantId } });
    if (!cfg) return;

    const enviarEmail =
      (payload.evento === 'erro_impressao' && cfg.emailErrosImpressao) ||
      (payload.evento === 'falha_backup' && cfg.emailBackupFalha);

    if (enviarEmail) {
      const destinatarios = (cfg.emailEnderecos || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (destinatarios.length > 0) {
        const result = await this.mailer.sendMail(tenantId, {
          to: destinatarios,
          subject: payload.assunto,
          text: payload.texto,
          html: payload.html,
        });
        if (!result.ok) {
          this.logger.warn(`Falha ao enviar e-mail (${payload.evento}): ${result.error}`);
        }
      } else {
        this.logger.warn(
          `Notificacao ${payload.evento} habilitada mas sem destinatarios para tenant ${tenantId}`,
        );
      }
    }

    if (cfg.webhookUrl && cfg.webhookUrl.trim()) {
      this.dispararWebhook(cfg.webhookUrl.trim(), {
        evento: payload.evento,
        dados: payload.dados ?? {},
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** POST fire-and-forget. Erros sao apenas logados; nao quebram o caller. */
  private dispararWebhook(url: string, body: Record<string, unknown>): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      this.logger.warn(`webhook URL invalida: ${url}`);
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      this.logger.warn(`webhook protocolo nao suportado: ${parsed.protocol}`);
      return;
    }
    const payload = JSON.stringify(body);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload).toString(),
        },
        timeout: 5000,
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            this.logger.warn(`webhook respondeu ${res.statusCode} para ${url}`);
          }
        });
      },
    );
    req.on('error', (err) => this.logger.warn(`webhook erro: ${err.message}`));
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(payload);
    req.end();
  }

  /** Lista todos os tenants com alertas de backup habilitados. Usado pelo BackupService. */
  async listarTenantsComAlertaBackup(): Promise<string[]> {
    const cfgs = await this.prisma.configuracaoNotificacao.findMany({
      where: { emailBackupFalha: true },
      select: { tenantId: true },
    });
    return cfgs.map((c) => c.tenantId);
  }
}
