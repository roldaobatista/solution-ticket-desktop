import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { gerarPdf, TEMPLATE_REGISTRY } from './templates';

@Injectable()
export class ImpressaoService {
  private readonly logger = new Logger(ImpressaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  listarTemplates() {
    return TEMPLATE_REGISTRY;
  }

  private async carregarTicket(ticketId: string) {
    return this.prisma.ticketPesagem.findUnique({
      where: { id: ticketId },
      include: {
        cliente: true,
        produto: true,
        veiculo: true,
        motorista: true,
        transportadora: true,
        origem: true,
        destino: true,
        passagens: { orderBy: { sequencia: 'asc' } },
        descontos: true,
        unidade: { include: { empresa: true } },
      },
    });
  }

  private async resolverTemplatePadrao(ticket: any): Promise<string> {
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
        empresa: (ticket as any).unidade?.empresa,
        unidade: (ticket as any).unidade,
      });
      return buffer;
    } catch (err: any) {
      this.logger.error(`Falha ao gerar PDF template=${tpl}: ${err?.message}`, err?.stack);
      await this.registrarErroImpressao(ticketId, tpl, err);
      throw err;
    }
  }

  async registrarErroImpressao(ticketId: string | null, template: string | null, err: any) {
    try {
      await (this.prisma as any).erroImpressao.create({
        data: {
          ticketId,
          template,
          tipo: 'PDF',
          mensagem: String(err?.message || err || 'Erro desconhecido').substring(0, 2000),
          stack: err?.stack ? String(err.stack).substring(0, 4000) : null,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Não foi possível registrar erro de impressão: ${e?.message}`);
    }
  }

  async listarErros(resolvido?: boolean) {
    return (this.prisma as any).erroImpressao.findMany({
      where: resolvido === undefined ? {} : { resolvido },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }

  async reimprimirErro(id: string): Promise<{ ok: boolean; erro?: string }> {
    const erro = await (this.prisma as any).erroImpressao.findUnique({ where: { id } });
    if (!erro) throw new NotFoundException('Erro de impressão não encontrado');
    if (!erro.ticketId) {
      throw new NotFoundException('Erro não tem ticketId associado');
    }
    try {
      await this.gerarTicketPdf(erro.ticketId, erro.template || undefined);
      await (this.prisma as any).erroImpressao.update({
        where: { id },
        data: { resolvido: true, resolvidoEm: new Date(), tentativas: { increment: 1 } },
      });
      return { ok: true };
    } catch (e: any) {
      await (this.prisma as any).erroImpressao.update({
        where: { id },
        data: {
          tentativas: { increment: 1 },
          mensagem: String(e?.message || e).substring(0, 2000),
        },
      });
      return { ok: false, erro: e?.message || 'Falha' };
    }
  }

  async marcarResolvido(id: string) {
    return (this.prisma as any).erroImpressao.update({
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
