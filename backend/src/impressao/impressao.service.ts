import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { gerarPdf, TEMPLATE_REGISTRY } from './templates';
import { ticketComRelacoesArgs, TicketComRelacoes } from './templates/types';
import { errorMessage } from '../common/error-message.util';

@Injectable()
export class ImpressaoService {
  private readonly logger = new Logger(ImpressaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  listarTemplates() {
    return TEMPLATE_REGISTRY;
  }

  private async carregarTicket(ticketId: string): Promise<TicketComRelacoes | null> {
    return this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId },
      ...ticketComRelacoesArgs,
    });
  }

  private async resolverTemplatePadrao(ticket: TicketComRelacoes): Promise<string> {
    try {
      const cfg = await this.prisma.configuracaoOperacionalUnidade.findFirst({
        where: { unidadeId: ticket.unidadeId },
      });
      return cfg?.modeloTicketPadrao || 'TICKET002';
    } catch {
      return 'TICKET002';
    }
  }

  async gerarTicketPdf(ticketId: string, template?: string): Promise<Buffer> {
    const ticket = await this.carregarTicket(ticketId);
    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const tpl = template || (await this.resolverTemplatePadrao(ticket));

    try {
      const buffer = await gerarPdf(tpl, {
        ticket,
        empresa: ticket.unidade?.empresa,
        unidade: ticket.unidade,
      });
      return buffer;
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao gerar PDF template=${tpl}: ${errorMessage(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.registrarErroImpressao(ticketId, tpl, err);
      throw err;
    }
  }

  async registrarErroImpressao(ticketId: string | null, template: string | null, err: unknown) {
    try {
      await this.prisma.erroImpressao.create({
        data: {
          ticketId,
          template,
          tipo: 'PDF',
          mensagem: String(errorMessage(err) || 'Erro desconhecido').substring(0, 2000),
          stack: err instanceof Error && err.stack ? err.stack.substring(0, 4000) : null,
        },
      });
    } catch (e: unknown) {
      this.logger.warn(`Não foi possível registrar erro de impressão: ${errorMessage(e)}`);
    }
  }

  async listarErros(resolvido?: boolean) {
    return this.prisma.erroImpressao.findMany({
      where: resolvido === undefined ? {} : { resolvido },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }

  async reimprimirErro(id: string): Promise<{ ok: boolean; erro?: string }> {
    const erro = await this.prisma.erroImpressao.findUnique({ where: { id } });
    if (!erro) throw new NotFoundException('Erro de impressão não encontrado');
    if (!erro.ticketId) {
      throw new NotFoundException('Erro não tem ticketId associado');
    }
    try {
      await this.gerarTicketPdf(erro.ticketId, erro.template || undefined);
      await this.prisma.erroImpressao.update({
        where: { id },
        data: { resolvido: true, resolvidoEm: new Date(), tentativas: { increment: 1 } },
      });
      return { ok: true };
    } catch (e: unknown) {
      await this.prisma.erroImpressao.update({
        where: { id },
        data: {
          tentativas: { increment: 1 },
          mensagem: String(errorMessage(e)).substring(0, 2000),
        },
      });
      return { ok: false, erro: errorMessage(e, 'Falha') };
    }
  }

  async marcarResolvido(id: string) {
    return this.prisma.erroImpressao.update({
      where: { id },
      data: { resolvido: true, resolvidoEm: new Date() },
    });
  }

  // Mantido por compatibilidade: HTML básico (não usado pelo novo fluxo)
  async gerarTicketHtml(ticketId: string) {
    const ticket = await this.carregarTicket(ticketId);
    if (!ticket) return { erro: 'Ticket não encontrado' };
    return {
      numero: ticket.numero,
      html: `<html><body><h2>Ticket ${ticket.numero}</h2><p>Use o endpoint de PDF para impressão oficial.</p></body></html>`,
    };
  }
}
