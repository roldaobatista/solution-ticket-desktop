import PDFDocument from 'pdfkit';
import {
  TicketContext,
  toBuffer,
  drawCabecalho,
  drawNumeroTicket,
  linhaCampo,
  drawAssinaturas,
  fmtKg,
  calcularBruto,
  calcularTara,
  calcularLiquido,
} from './shared';

/**
 * TICKET001 - A5 1PF (1 passagem, tara referenciada)
 */
export async function renderTicket001(ctx: TicketContext): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A5', margin: 30 });
  const out = toBuffer(doc);
  const t = ctx.ticket;

  drawCabecalho(doc, ctx, 'TICKET DE PESAGEM - 1 PASSAGEM');
  drawNumeroTicket(doc, t);

  linhaCampo(doc, 'Cliente:', t.cliente?.razaoSocial || '-');
  linhaCampo(doc, 'Produto:', t.produto?.descricao || '-');
  linhaCampo(doc, 'Placa:', t.veiculo?.placa || t.veiculoPlaca || '-');
  linhaCampo(doc, 'Motorista:', t.motorista?.nome || '-');
  linhaCampo(doc, 'Transportadora:', t.transportadora?.nome || '-');
  if (t.notaFiscal) linhaCampo(doc, 'NF:', t.notaFiscal);
  doc.moveDown(0.5);

  linhaCampo(doc, 'Peso Bruto:', `${fmtKg(calcularBruto(t))} kg`, { bold: true });
  linhaCampo(doc, 'Tara (referenciada):', `${fmtKg(calcularTara(t))} kg`);
  doc.moveDown(0.3);
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`PESO LIQUIDO: ${fmtKg(calcularLiquido(t))} kg`, { align: 'center' });

  drawAssinaturas(doc);
  doc.end();
  return out;
}
