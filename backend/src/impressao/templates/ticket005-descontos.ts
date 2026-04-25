import PDFDocument from 'pdfkit';
import {
  TicketContext,
  toBuffer,
  drawCabecalho,
  drawNumeroTicket,
  linhaCampo,
  drawAssinaturas,
  fmtKg,
  fmtMoeda,
  calcularBruto,
  calcularTara,
  calcularLiquido,
} from './shared';

interface Ticket005Opts {
  variante?: 'SEM_VALOR' | 'COM_VALOR' | 'COM_VALOR_TAB_UMIDADE';
}

/**
 * TICKET005 - A4 com Descontos. Variantes:
 *  - SEM_VALOR (A), COM_VALOR (B), COM_VALOR_TAB_UMIDADE (C)
 */
export async function renderTicket005(
  ctx: TicketContext,
  opts: Ticket005Opts = {},
): Promise<Buffer> {
  const variante = opts.variante || 'SEM_VALOR';
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const out = toBuffer(doc);
  const t = ctx.ticket;

  const subtitulo =
    variante === 'COM_VALOR_TAB_UMIDADE'
      ? 'TICKET DE PESAGEM - DESCONTOS + UMIDADE + VALOR'
      : variante === 'COM_VALOR'
        ? 'TICKET DE PESAGEM - DESCONTOS E VALOR'
        : 'TICKET DE PESAGEM - DESCONTOS';

  drawCabecalho(doc, ctx, subtitulo);
  drawNumeroTicket(doc, t);

  linhaCampo(doc, 'Cliente:', t.cliente?.razaoSocial || '-');
  linhaCampo(doc, 'Produto:', t.produto?.descricao || '-');
  linhaCampo(doc, 'Placa:', t.veiculo?.placa || t.veiculoPlaca || '-');
  linhaCampo(doc, 'Motorista:', t.motorista?.nome || '-');
  if (t.notaFiscal) linhaCampo(doc, 'NF:', t.notaFiscal);
  doc.moveDown(0.5);

  linhaCampo(doc, 'Peso Bruto:', `${fmtKg(calcularBruto(t))} kg`, { bold: true });
  linhaCampo(doc, 'Tara:', `${fmtKg(calcularTara(t))} kg`);

  // Tabela de descontos
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(10).text('Descontos aplicados:', { underline: true });
  doc.font('Helvetica').fontSize(9);
  const descontos = t.descontos || [];
  if (descontos.length === 0) {
    doc.text('  (nenhum)');
  } else {
    descontos.forEach((d: any) => {
      const tipo = d.tipo || d.descricao || 'Desconto';
      const valorKg = Number(d.valor || 0);
      const pct = d.percentual ? ` (${Number(d.percentual).toFixed(2)}%)` : '';
      doc.text(`  - ${tipo}${pct}: ${fmtKg(valorKg)} kg`);
    });
  }
  doc.moveDown(0.3);
  linhaCampo(doc, 'Total descontos:', `${fmtKg(Number(t.totalDescontos || 0))} kg`, { bold: true });

  // Tabela de umidade
  if (variante === 'COM_VALOR_TAB_UMIDADE') {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(10).text('Tabela de Umidade:', { underline: true });
    doc.font('Helvetica').fontSize(9);
    const umidade = descontos.find((d: any) => (d.tipo || '').toUpperCase().includes('UMIDADE'));
    if (umidade) {
      doc.text(
        `  Umidade: ${umidade.percentual || '-'}% -> Desconto ${fmtKg(Number(umidade.valor || 0))} kg`,
      );
    } else {
      doc.text('  (sem desconto de umidade)');
    }
  }

  doc.moveDown(0.5);
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.rect(left, doc.y, width, 30).stroke();
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`PESO LIQUIDO FINAL: ${fmtKg(calcularLiquido(t))} kg`, left, doc.y + 8, {
      align: 'center',
      width,
    });
  doc.moveDown(2);

  if (variante !== 'SEM_VALOR' && t.valorTotal) {
    linhaCampo(doc, 'Valor Unit.:', fmtMoeda(Number(t.valorUnitario || 0)));
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`VALOR TOTAL: ${fmtMoeda(Number(t.valorTotal))}`, { align: 'right' });
  }

  drawAssinaturas(doc);
  doc.end();
  return out;
}
