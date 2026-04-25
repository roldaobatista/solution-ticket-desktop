import PDFDocument from 'pdfkit';
import type { PassagemRender } from './types';
import {
  TicketContext,
  toBuffer,
  drawCabecalho,
  drawNumeroTicket,
  linhaCampo,
  drawAssinaturas,
  fmtKg,
  fmtData,
  calcularBruto,
  calcularTara,
  calcularLiquido,
} from './shared';

/**
 * TICKET003 - A4 3PF (com passagem de controle)
 */
export async function renderTicket003(ctx: TicketContext): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const out = toBuffer(doc);
  const t = ctx.ticket;

  drawCabecalho(doc, ctx, 'TICKET DE PESAGEM - 3 PASSAGENS (COM CONTROLE)');
  drawNumeroTicket(doc, t);

  linhaCampo(doc, 'Cliente:', t.cliente?.razaoSocial || '-');
  linhaCampo(doc, 'Produto:', t.produto?.descricao || '-');
  linhaCampo(doc, 'Placa:', t.veiculo?.placa || t.veiculoPlaca || '-');
  linhaCampo(doc, 'Motorista:', t.motorista?.nome || '-');
  linhaCampo(doc, 'Transportadora:', t.transportadora?.nome || '-');
  if (t.notaFiscal) linhaCampo(doc, 'NF:', t.notaFiscal);
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(10).text('Passagens:', { underline: true });
  doc.font('Helvetica').fontSize(9);
  (t.passagens || []).forEach((p: PassagemRender) => {
    doc.text(
      `  ${p.sequencia}. ${p.papelCalculo} (${p.direcaoOperacional}) - ${fmtKg(Number(p.pesoCapturado))} kg - ${fmtData(p.dataHora)}`,
    );
  });
  doc.moveDown(0.5);

  linhaCampo(doc, 'Peso Bruto:', `${fmtKg(calcularBruto(t))} kg`, { bold: true });
  linhaCampo(doc, 'Tara:', `${fmtKg(calcularTara(t))} kg`);
  if (Number(t.totalDescontos || 0) > 0) {
    linhaCampo(doc, 'Descontos:', `${fmtKg(Number(t.totalDescontos))} kg`);
  }

  doc.moveDown(0.3);
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

  drawAssinaturas(doc);
  doc.end();
  return out;
}
