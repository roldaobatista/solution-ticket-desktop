import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

const StatusOperacional = {
  RASCUNHO: 'RASCUNHO',
  ABERTO: 'ABERTO',
  EM_PESAGEM: 'EM_PESAGEM',
  AGUARDANDO_PASSAGEM: 'AGUARDANDO_PASSAGEM',
  FECHADO: 'FECHADO',
  EM_MANUTENCAO: 'EM_MANUTENCAO',
  CANCELADO: 'CANCELADO',
} as const;

const StatusPassagem = {
  PENDENTE: 'PENDENTE',
  VALIDA: 'VALIDA',
  INVALIDADA: 'INVALIDADA',
} as const;

@Injectable()
export class RelatoriosService {
  private readonly logger = new Logger(RelatoriosService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // Helpers internos de PDF
  // ============================================================

  private async obterNomeEmpresa(unidadeId?: string): Promise<string> {
    if (!unidadeId) return 'Todas as unidades';
    try {
      const unidade = await this.prisma.unidade.findUnique({
        where: { id: unidadeId },
        include: { empresa: true },
      });
      if (!unidade) return 'Unidade nao encontrada';
      const emp: any = (unidade as any).empresa;
      const nomeEmp = emp?.nomeFantasia || emp?.razaoSocial || 'Empresa';
      return `${nomeEmp} - ${unidade.nome}`;
    } catch (err) {
      this.logger.warn(`Falha ao resolver cabeçalho da empresa: ${(err as Error).message}`);
      return 'Empresa';
    }
  }

  private desenharCabecalho(
    doc: any,
    titulo: string,
    nomeEmpresa: string,
    filtros: Record<string, string | undefined>,
  ) {
    doc.fontSize(14).text(nomeEmpresa, { align: 'center' });
    doc.fontSize(12).text(titulo, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8);
    const linhasFiltro: string[] = [];
    for (const [k, v] of Object.entries(filtros)) {
      if (v) linhasFiltro.push(`${k}: ${v}`);
    }
    if (linhasFiltro.length) doc.text(`Filtros - ${linhasFiltro.join(' | ')}`);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown(0.5);
  }

  private finalizarComPaginacao(doc: any) {
    const range = doc.bufferedPageRange();
    const total = range.count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(range.start + i);
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .fontSize(8)
        .text(`Pagina ${i + 1} de ${total}`, doc.page.margins.left, doc.page.height - 20, {
          align: 'center',
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        });
      doc.page.margins.bottom = bottom;
    }
  }

  private desenharLinhaTabela(
    doc: any,
    cols: { text: string; width: number; align?: string }[],
    y?: number,
  ) {
    const startX = doc.page.margins.left;
    const yPos = y ?? doc.y;
    let x = startX;
    for (const c of cols) {
      doc.text(c.text, x + 2, yPos, {
        width: c.width - 4,
        align: (c.align as any) || 'left',
        lineBreak: false,
      });
      x += c.width;
    }
    return yPos + 12;
  }

  // ============================================================
  // Relatorio de movimento de pesagem
  // ============================================================

  async movimento(dataInicio: string, dataFim: string, unidadeId?: string) {
    const where: any = {
      fechadoEm: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      },
      statusOperacional: StatusOperacional.FECHADO,
    };
    if (unidadeId) where.unidadeId = unidadeId;

    const tickets = await this.prisma.ticketPesagem.findMany({
      where,
      include: {
        cliente: { select: { razaoSocial: true } },
        transportadora: { select: { nome: true } },
        motorista: { select: { nome: true } },
        veiculo: { select: { placa: true } },
        produto: { select: { descricao: true } },
        destino: { select: { descricao: true } },
        passagens: { orderBy: { sequencia: 'asc' } },
        descontos: true,
      },
      orderBy: { fechadoEm: 'desc' },
    });

    const totalPeso = tickets.reduce((sum, t) => sum + Number(t.pesoLiquidoFinal || 0), 0);
    const totalDescontos = tickets.reduce((sum, t) => sum + Number(t.totalDescontos || 0), 0);
    const totalBruto = tickets.reduce((sum, t) => sum + Number(t.pesoBrutoApurado || 0), 0);

    return {
      periodo: { dataInicio, dataFim },
      totalTickets: tickets.length,
      totalPeso,
      totalDescontos,
      totalBruto,
      tickets,
    };
  }

  async movimentoPdf(
    dataInicio: string,
    dataFim: string,
    unidadeId?: string,
    variante: '001' | '002' = '001',
  ): Promise<Buffer> {
    const dados = await this.movimento(dataInicio, dataFim, unidadeId);
    const nomeEmpresa = await this.obterNomeEmpresa(unidadeId);
    const decimais = variante === '002' ? 3 : 2;
    const incluirMotorista = variante === '002';

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.desenharCabecalho(doc, `Relatorio de Movimentacao - Variante ${variante}`, nomeEmpresa, {
        'Data Inicio': dataInicio,
        'Data Fim': dataFim,
      });

      // Larguras (landscape ~ 781 pts uteis com margem 30)
      const cols = incluirMotorista
        ? [
            { key: 'placa', label: 'Placa', width: 70 },
            { key: 'data', label: 'Data', width: 110 },
            { key: 'cliente', label: 'Cliente', width: 140 },
            { key: 'produto', label: 'Produto', width: 110 },
            { key: 'bruto', label: 'P. Bruto', width: 80, align: 'right' },
            { key: 'tara', label: 'P. Tara', width: 80, align: 'right' },
            { key: 'liquido', label: 'P. Liquido', width: 80, align: 'right' },
            { key: 'motorista', label: 'Motorista', width: 111 },
          ]
        : [
            { key: 'placa', label: 'Placa', width: 80 },
            { key: 'data', label: 'Data', width: 120 },
            { key: 'cliente', label: 'Cliente', width: 190 },
            { key: 'produto', label: 'Produto', width: 140 },
            { key: 'bruto', label: 'P. Bruto', width: 85, align: 'right' },
            { key: 'tara', label: 'P. Tara', width: 85, align: 'right' },
            { key: 'liquido', label: 'P. Liquido', width: 81, align: 'right' },
          ];

      // Cabecalho da tabela
      doc.fontSize(8).font('Helvetica-Bold');
      let y = this.desenharLinhaTabela(
        doc,
        cols.map((c) => ({ text: c.label, width: c.width, align: c.align })),
      );
      doc
        .moveTo(doc.page.margins.left, y - 1)
        .lineTo(doc.page.width - doc.page.margins.right, y - 1)
        .stroke();
      doc.font('Helvetica');

      let totalBruto = 0;
      let totalTara = 0;
      let totalLiquido = 0;

      for (const t of dados.tickets) {
        if (y > doc.page.height - 60) {
          doc.addPage();
          this.desenharCabecalho(
            doc,
            `Relatorio de Movimentacao - Variante ${variante}`,
            nomeEmpresa,
            { 'Data Inicio': dataInicio, 'Data Fim': dataFim },
          );
          doc.fontSize(8).font('Helvetica-Bold');
          y = this.desenharLinhaTabela(
            doc,
            cols.map((c) => ({ text: c.label, width: c.width, align: c.align })),
          );
          doc
            .moveTo(doc.page.margins.left, y - 1)
            .lineTo(doc.page.width - doc.page.margins.right, y - 1)
            .stroke();
          doc.font('Helvetica');
        }

        const cliente = (t as any).cliente?.razaoSocial || '-';
        const produto = (t as any).produto?.descricao || '-';
        const placa = (t as any).veiculo?.placa || (t as any).veiculoPlaca || '-';
        const motorista = (t as any).motorista?.nome || '-';
        const data = t.fechadoEm ? new Date(t.fechadoEm).toLocaleString('pt-BR') : '-';
        const bruto = Number(t.pesoBrutoApurado || 0);
        const tara = Number(t.pesoTaraApurada || 0);
        const liquido = Number(t.pesoLiquidoFinal || 0);

        totalBruto += bruto;
        totalTara += tara;
        totalLiquido += liquido;

        const linha: Record<string, string> = {
          placa,
          data,
          cliente,
          produto,
          bruto: bruto.toFixed(decimais),
          tara: tara.toFixed(decimais),
          liquido: liquido.toFixed(decimais),
          motorista,
        };

        y = this.desenharLinhaTabela(
          doc,
          cols.map((c) => ({ text: linha[c.key] || '-', width: c.width, align: c.align })),
          y,
        );
      }

      // Totais
      doc
        .moveTo(doc.page.margins.left, y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, y + 2)
        .stroke();
      y += 6;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`Qtd. tickets: ${dados.tickets.length}`, doc.page.margins.left, y);
      y += 12;
      doc.text(
        `Total Bruto: ${totalBruto.toFixed(decimais)} kg  |  Total Tara: ${totalTara.toFixed(decimais)} kg  |  Total Liquido: ${totalLiquido.toFixed(decimais)} kg`,
        doc.page.margins.left,
        y,
      );

      this.finalizarComPaginacao(doc);
      doc.end();
    });
  }

  // ============================================================
  // Relatorio de pesagens alteradas
  // ============================================================

  async pesagensAlteradas(dataInicio: string, dataFim: string, unidadeId?: string) {
    const where: any = {
      atualizadoEm: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      },
      statusOperacional: StatusOperacional.EM_MANUTENCAO,
    };
    if (unidadeId) where.unidadeId = unidadeId;

    const tickets = await this.prisma.ticketPesagem.findMany({
      where,
      include: {
        cliente: { select: { razaoSocial: true } },
        produto: { select: { descricao: true } },
        passagens: true,
      },
      orderBy: { atualizadoEm: 'desc' },
    });

    return { tickets, total: tickets.length };
  }

  async alteradasPdf(dataInicio: string, dataFim: string, unidadeId?: string): Promise<Buffer> {
    const nomeEmpresa = await this.obterNomeEmpresa(unidadeId);

    // Busca eventos de auditoria de tickets no periodo
    const auditorias = await this.prisma.auditoria.findMany({
      where: {
        entidade: 'TicketPesagem',
        dataHora: {
          gte: new Date(dataInicio),
          lte: new Date(dataFim),
        },
      },
      orderBy: { dataHora: 'desc' },
    });

    // Carrega tickets e usuarios envolvidos
    const ticketIds = Array.from(new Set(auditorias.map((a) => a.entidadeId)));
    const usuarioIds = Array.from(
      new Set(auditorias.map((a) => a.usuarioId).filter((x): x is string => Boolean(x))),
    );
    const tickets = ticketIds.length
      ? await this.prisma.ticketPesagem.findMany({
          where: { id: { in: ticketIds }, ...(unidadeId ? { unidadeId } : {}) },
          select: { id: true, numero: true, unidadeId: true },
        })
      : [];
    const usuarios = usuarioIds.length
      ? await this.prisma.usuario.findMany({
          where: { id: { in: usuarioIds } },
          select: { id: true, nome: true },
        })
      : [];
    const mapTicket = new Map(tickets.map((t) => [t.id, t]));
    const mapUsuario = new Map(usuarios.map((u) => [u.id, u]));

    // Expande por campo alterado
    type Linha = {
      ticket: string;
      data: string;
      usuario: string;
      campo: string;
      valorAnterior: string;
      valorNovo: string;
      motivo: string;
    };
    const linhas: Linha[] = [];
    for (const a of auditorias) {
      const ticket = mapTicket.get(a.entidadeId);
      if (unidadeId && !ticket) continue; // filtrado por unidade
      const usuario = a.usuarioId ? mapUsuario.get(a.usuarioId)?.nome || '-' : '-';
      const dataHora = new Date(a.dataHora).toLocaleString('pt-BR');
      const motivo = a.motivo || '-';
      const numeroTicket = ticket?.numero || a.entidadeId.substring(0, 8);

      let anterior: any = {};
      let novo: any = {};
      try {
        anterior = a.estadoAnterior ? JSON.parse(a.estadoAnterior) : {};
      } catch (err) {
        this.logger.debug(`estadoAnterior inválido (auditoria=${a.id}): ${(err as Error).message}`);
        anterior = {};
      }
      try {
        novo = a.estadoNovo ? JSON.parse(a.estadoNovo) : {};
      } catch (err) {
        this.logger.debug(`estadoNovo inválido (auditoria=${a.id}): ${(err as Error).message}`);
        novo = {};
      }

      const campos = new Set<string>([...Object.keys(anterior || {}), ...Object.keys(novo || {})]);
      let adicionado = false;
      for (const campo of campos) {
        const va = anterior?.[campo];
        const vn = novo?.[campo];
        if (JSON.stringify(va) === JSON.stringify(vn)) continue;
        linhas.push({
          ticket: numeroTicket,
          data: dataHora,
          usuario,
          campo,
          valorAnterior: va === undefined || va === null ? '-' : String(va),
          valorNovo: vn === undefined || vn === null ? '-' : String(vn),
          motivo,
        });
        adicionado = true;
      }
      if (!adicionado) {
        linhas.push({
          ticket: numeroTicket,
          data: dataHora,
          usuario,
          campo: a.evento || '-',
          valorAnterior: '-',
          valorNovo: '-',
          motivo,
        });
      }
    }

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.desenharCabecalho(doc, 'Relatorio de Pesagens Alteradas', nomeEmpresa, {
        'Data Inicio': dataInicio,
        'Data Fim': dataFim,
      });

      const cols = [
        { key: 'ticket', label: 'Ticket', width: 70 },
        { key: 'data', label: 'Data Alteracao', width: 110 },
        { key: 'usuario', label: 'Usuario', width: 110 },
        { key: 'campo', label: 'Campo', width: 110 },
        { key: 'valorAnterior', label: 'Valor Anterior', width: 130 },
        { key: 'valorNovo', label: 'Valor Novo', width: 130 },
        { key: 'motivo', label: 'Motivo', width: 121 },
      ];

      doc.fontSize(8).font('Helvetica-Bold');
      let y = this.desenharLinhaTabela(
        doc,
        cols.map((c) => ({ text: c.label, width: c.width })),
      );
      doc
        .moveTo(doc.page.margins.left, y - 1)
        .lineTo(doc.page.width - doc.page.margins.right, y - 1)
        .stroke();
      doc.font('Helvetica');

      for (const ln of linhas) {
        if (y > doc.page.height - 40) {
          doc.addPage();
          this.desenharCabecalho(doc, 'Relatorio de Pesagens Alteradas', nomeEmpresa, {
            'Data Inicio': dataInicio,
            'Data Fim': dataFim,
          });
          doc.fontSize(8).font('Helvetica-Bold');
          y = this.desenharLinhaTabela(
            doc,
            cols.map((c) => ({ text: c.label, width: c.width })),
          );
          doc
            .moveTo(doc.page.margins.left, y - 1)
            .lineTo(doc.page.width - doc.page.margins.right, y - 1)
            .stroke();
          doc.font('Helvetica');
        }
        y = this.desenharLinhaTabela(
          doc,
          cols.map((c) => ({ text: (ln as any)[c.key] || '-', width: c.width })),
          y,
        );
      }

      doc
        .moveTo(doc.page.margins.left, y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, y + 2)
        .stroke();
      y += 6;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`Total de alteracoes: ${linhas.length}`, doc.page.margins.left, y);

      this.finalizarComPaginacao(doc);
      doc.end();
    });
  }

  // ============================================================
  // Relatorio de pesagens canceladas
  // ============================================================

  async pesagensCanceladas(dataInicio: string, dataFim: string, unidadeId?: string) {
    const where: any = {
      canceladoEm: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      },
      statusOperacional: StatusOperacional.CANCELADO,
    };
    if (unidadeId) where.unidadeId = unidadeId;

    const tickets = await this.prisma.ticketPesagem.findMany({
      where,
      include: {
        cliente: { select: { razaoSocial: true } },
        produto: { select: { descricao: true } },
      },
      orderBy: { canceladoEm: 'desc' },
    });

    return { tickets, total: tickets.length };
  }

  async canceladasPdf(dataInicio: string, dataFim: string, unidadeId?: string): Promise<Buffer> {
    const nomeEmpresa = await this.obterNomeEmpresa(unidadeId);
    const dados = await this.pesagensCanceladas(dataInicio, dataFim, unidadeId);

    // Descobre usuarios do cancelamento via auditoria
    const ids = dados.tickets.map((t) => t.id);
    const audits = ids.length
      ? await this.prisma.auditoria.findMany({
          where: {
            entidade: 'TicketPesagem',
            entidadeId: { in: ids },
            evento: { in: ['CANCELAMENTO', 'CANCELAR', 'CANCELADO', 'CANCEL'] },
          },
          orderBy: { dataHora: 'desc' },
        })
      : [];
    const mapAudit = new Map<string, any>();
    for (const a of audits) if (!mapAudit.has(a.entidadeId)) mapAudit.set(a.entidadeId, a);
    const usuarioIds = Array.from(
      new Set(audits.map((a) => a.usuarioId).filter((x): x is string => Boolean(x))),
    );
    const usuarios = usuarioIds.length
      ? await this.prisma.usuario.findMany({
          where: { id: { in: usuarioIds } },
          select: { id: true, nome: true },
        })
      : [];
    const mapUsuario = new Map(usuarios.map((u) => [u.id, u.nome]));

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.desenharCabecalho(doc, 'Relatorio de Pesagens Canceladas', nomeEmpresa, {
        'Data Inicio': dataInicio,
        'Data Fim': dataFim,
      });

      const cols = [
        { key: 'numero', label: 'Numero', width: 90 },
        { key: 'data', label: 'Data Exclusao', width: 120 },
        { key: 'motivo', label: 'Motivo', width: 215 },
        { key: 'usuario', label: 'Usuario', width: 110 },
      ];

      doc.fontSize(9).font('Helvetica-Bold');
      let y = this.desenharLinhaTabela(
        doc,
        cols.map((c) => ({ text: c.label, width: c.width })),
      );
      doc
        .moveTo(doc.page.margins.left, y - 1)
        .lineTo(doc.page.width - doc.page.margins.right, y - 1)
        .stroke();
      doc.font('Helvetica');

      for (const t of dados.tickets) {
        if (y > doc.page.height - 40) {
          doc.addPage();
          this.desenharCabecalho(doc, 'Relatorio de Pesagens Canceladas', nomeEmpresa, {
            'Data Inicio': dataInicio,
            'Data Fim': dataFim,
          });
          doc.fontSize(9).font('Helvetica-Bold');
          y = this.desenharLinhaTabela(
            doc,
            cols.map((c) => ({ text: c.label, width: c.width })),
          );
          doc
            .moveTo(doc.page.margins.left, y - 1)
            .lineTo(doc.page.width - doc.page.margins.right, y - 1)
            .stroke();
          doc.font('Helvetica');
        }

        const audit = mapAudit.get(t.id);
        const usuario = audit?.usuarioId ? mapUsuario.get(audit.usuarioId) || '-' : '-';
        const linha: Record<string, string> = {
          numero: t.numero,
          data: t.canceladoEm ? new Date(t.canceladoEm).toLocaleString('pt-BR') : '-',
          motivo: (t as any).motivoCancelamento || audit?.motivo || '-',
          usuario,
        };
        y = this.desenharLinhaTabela(
          doc,
          cols.map((c) => ({ text: linha[c.key] || '-', width: c.width })),
          y,
        );
      }

      doc
        .moveTo(doc.page.margins.left, y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, y + 2)
        .stroke();
      y += 6;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(`Total de cancelamentos: ${dados.tickets.length}`, doc.page.margins.left, y);

      this.finalizarComPaginacao(doc);
      doc.end();
    });
  }

  // ============================================================
  // Analise de passagens por balanca
  // ============================================================

  async passagensPorBalanca(dataInicio: string, dataFim: string, unidadeId?: string) {
    const where: any = {
      criadoEm: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      },
      statusPassagem: StatusPassagem.VALIDA,
    };
    if (unidadeId) {
      where.balanca = { unidadeId };
    }

    const passagens = await this.prisma.passagemPesagem.groupBy({
      by: ['balancaId'],
      where,
      _count: { id: true },
      _sum: { pesoCapturado: true },
    });

    const balancas = await this.prisma.balanca.findMany({
      where: unidadeId ? { unidadeId } : undefined,
    });

    const resultado = passagens.map((p) => ({
      balancaId: p.balancaId,
      balancaNome: balancas.find((b) => b.id === p.balancaId)?.nome || 'Desconhecida',
      totalPassagens: p._count.id,
      pesoTotal: Number(p._sum.pesoCapturado || 0),
    }));

    return resultado;
  }
}
