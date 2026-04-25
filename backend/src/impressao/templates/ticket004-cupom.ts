import PDFDocument from 'pdfkit';
import {
  TicketContext,
  toBuffer,
  fmtKg,
  fmtMoeda,
  fmtData,
  calcularBruto,
  calcularTara,
  calcularLiquido,
} from './shared';

interface Ticket004Opts {
  variante?:
    | 'PADRAO'
    | 'COM_DESCONTO'
    | 'GERTEC'
    | 'RESUMIDO'
    | 'RESUMIDO_PRODUTOR'
    | 'SEM_ASSINATURA';
}

/**
 * TICKET004 - CUPOM 80mm. Variantes:
 *  - PADRAO, COM_DESCONTO, GERTEC, RESUMIDO, RESUMIDO_PRODUTOR, SEM_ASSINATURA
 */
export async function renderTicket004(
  ctx: TicketContext,
  opts: Ticket004Opts = {},
): Promise<Buffer> {
  const variante = opts.variante || 'PADRAO';
  // 80mm = ~226pt
  const doc = new PDFDocument({ size: [226, 600], margin: 8 });
  const out = toBuffer(doc);
  const t = ctx.ticket;
  const empresa = ctx.empresa || ctx.ticket?.unidade?.empresa;

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(empresa?.nomeFantasia || 'SOLUTION TICKET', { align: 'center' });
  if (empresa?.documento) {
    doc.fontSize(7).font('Helvetica').text(`CNPJ: ${empresa.documento}`, { align: 'center' });
  }
  doc.moveDown(0.3);
  doc.fontSize(8).font('Helvetica-Bold').text('TICKET DE PESAGEM', { align: 'center' });
  doc.fontSize(9).text(`Nº ${t.numero}`, { align: 'center' });
  doc.fontSize(7).font('Helvetica').text(fmtData(t.criadoEm), { align: 'center' });
  doc.moveDown(0.3);
  doc.moveTo(8, doc.y).lineTo(218, doc.y).dash(1, { space: 2 }).stroke().undash();
  doc.moveDown(0.2);

  const resumido = variante === 'RESUMIDO' || variante === 'RESUMIDO_PRODUTOR';

  doc.fontSize(7).font('Helvetica');
  doc.text(`Cliente: ${t.cliente?.razaoSocial || '-'}`);
  doc.text(`Produto: ${t.produto?.descricao || '-'}`);
  doc.text(`Placa: ${t.veiculo?.placa || t.veiculoPlaca || '-'}`);
  if (!resumido) {
    doc.text(`Motorista: ${t.motorista?.nome || '-'}`);
    doc.text(`Transp.: ${t.transportadora?.nome || '-'}`);
    if (t.notaFiscal) doc.text(`NF: ${t.notaFiscal}`);
  }
  if (variante === 'RESUMIDO_PRODUTOR') {
    doc.text(`Origem: ${t.origem?.descricao || '-'}`);
  }
  doc.moveDown(0.2);
  doc.moveTo(8, doc.y).lineTo(218, doc.y).dash(1, { space: 2 }).stroke().undash();
  doc.moveDown(0.2);

  doc.fontSize(8);
  doc.text(`Bruto: ${fmtKg(calcularBruto(t))} kg`);
  doc.text(`Tara:  ${fmtKg(calcularTara(t))} kg`);
  if (variante === 'COM_DESCONTO' && Number(t.totalDescontos || 0) > 0) {
    doc.text(`Desc.: ${fmtKg(Number(t.totalDescontos))} kg`);
  }
  doc.moveDown(0.1);
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`LIQ.: ${fmtKg(calcularLiquido(t))} kg`, { align: 'center' });
  doc.moveDown(0.2);

  if (t.valorTotal) {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`TOTAL: ${fmtMoeda(Number(t.valorTotal))}`, { align: 'center' });
    doc.moveDown(0.2);
  }

  if (variante !== 'SEM_ASSINATURA') {
    doc.moveDown(1);
    doc.fontSize(7).font('Helvetica');
    doc.text('_______________________', { align: 'center' });
    doc.text('Assinatura', { align: 'center' });
  }

  doc.moveDown(0.3);
  doc.fontSize(6).font('Helvetica-Oblique').text('Solution Ticket', { align: 'center' });
  doc.end();
  return out;
}
