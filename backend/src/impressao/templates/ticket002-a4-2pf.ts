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
  fmtMoeda,
  fmtData,
  calcularBruto,
  calcularTara,
  calcularLiquido,
} from './shared';

interface Ticket002Opts {
  variante?: 'PADRAO' | 'DIF_NOTA' | 'VALOR' | 'INTEIRO' | 'SEM_DESCONTO';
}

/**
 * TICKET002 - A4 2PF (Bruto/Tara). Variantes:
 *  - PADRAO, DIF_NOTA, VALOR, INTEIRO, SEM_DESCONTO
 */
export async function renderTicket002(
  ctx: TicketContext,
  opts: Ticket002Opts = {},
): Promise<Buffer> {
  const variante = opts.variante || 'PADRAO';
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const out = toBuffer(doc);
  const t = ctx.ticket;

  const subtitulo =
    variante === 'VALOR'
      ? 'TICKET DE PESAGEM - COM VALOR'
      : variante === 'DIF_NOTA'
        ? 'TICKET DE PESAGEM - DIFERENCA DE NOTA'
        : variante === 'INTEIRO'
          ? 'TICKET DE PESAGEM - INTEIRO'
          : variante === 'SEM_DESCONTO'
            ? 'TICKET DE PESAGEM - SEM DESCONTOS'
            : 'TICKET DE PESAGEM - 2 PASSAGENS';

  drawCabecalho(doc, ctx, subtitulo);
  drawNumeroTicket(doc, t);

  // Grid dados em 2 colunas
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colW = width / 2;

  const yStart = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Cliente: ', left, yStart, { continued: true, width: colW });
  doc.font('Helvetica').text(t.cliente?.razaoSocial || '-');
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Produto: ', left + colW, yStart, { continued: true, width: colW });
  doc.font('Helvetica').text(t.produto?.descricao || '-');

  const y2 = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Placa: ', left, y2, { continued: true, width: colW });
  doc.font('Helvetica').text(t.veiculo?.placa || t.veiculoPlaca || '-');
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Motorista: ', left + colW, y2, { continued: true, width: colW });
  doc.font('Helvetica').text(t.motorista?.nome || '-');

  linhaCampo(doc, 'Transportadora:', t.transportadora?.nome || '-');
  if (t.notaFiscal)
    linhaCampo(
      doc,
      'NF:',
      `${t.notaFiscal}${t.pesoNf ? ' - Peso NF: ' + fmtKg(Number(t.pesoNf)) + ' kg' : ''}`,
    );
  doc.moveDown(0.5);

  // Passagens
  const passagens = t.passagens || [];
  doc.font('Helvetica-Bold').fontSize(10).text('Passagens:', { underline: true });
  doc.font('Helvetica').fontSize(9);
  passagens.forEach((p: PassagemRender) => {
    doc.text(
      `  ${p.sequencia}. ${p.papelCalculo} - ${fmtKg(Number(p.pesoCapturado))} kg - ${fmtData(p.dataHora)}`,
    );
  });
  doc.moveDown(0.5);

  // Pesos
  doc.font('Helvetica-Bold').fontSize(10).text('Pesos Apurados:', { underline: true });
  doc.moveDown(0.2);
  linhaCampo(doc, 'Peso Bruto:', `${fmtKg(calcularBruto(t))} kg`, { bold: true });
  linhaCampo(doc, 'Tara:', `${fmtKg(calcularTara(t))} kg`);
  if (variante !== 'SEM_DESCONTO' && Number(t.totalDescontos || 0) > 0) {
    linhaCampo(doc, 'Descontos:', `${fmtKg(Number(t.totalDescontos))} kg`);
  }
  doc.moveDown(0.3);

  // Liquido
  doc.rect(left, doc.y, width, 30).stroke();
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(`PESO LIQUIDO: ${fmtKg(calcularLiquido(t))} kg`, left, doc.y + 8, {
      align: 'center',
      width,
    });
  doc.moveDown(2);

  // Diferenca de nota
  if (variante === 'DIF_NOTA' && t.pesoNf) {
    const dif = calcularLiquido(t) - Number(t.pesoNf);
    linhaCampo(doc, 'Peso NF:', `${fmtKg(Number(t.pesoNf))} kg`);
    linhaCampo(doc, 'Diferenca:', `${fmtKg(dif)} kg`, { bold: true });
    doc.moveDown(0.5);
  }

  // Valor
  if (variante === 'VALOR' && t.valorTotal) {
    linhaCampo(doc, 'Valor Unitario:', fmtMoeda(Number(t.valorUnitario || 0)));
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`VALOR TOTAL: ${fmtMoeda(Number(t.valorTotal))}`, { align: 'right' });
  }

  if (t.observacao) {
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica-Oblique').text(`Obs: ${t.observacao}`);
  }

  drawAssinaturas(doc);
  doc.end();
  return out;
}
