import PDFDocument from 'pdfkit';

export interface TicketContext {
  ticket: any;
  empresa?: any;
  unidade?: any;
}

export interface TemplateResult {
  buffer: Buffer;
  contentType: string;
}

export function toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function fmtKg(n?: number | null): string {
  if (n === null || n === undefined) return '0';
  const v = typeof n === 'number' ? n : Number(n);
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function fmtMoeda(n?: number | null): string {
  if (n === null || n === undefined) return 'R$ 0,00';
  const v = typeof n === 'number' ? n : Number(n);
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtData(d?: Date | string | null): string {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

export function drawCabecalho(doc: PDFKit.PDFDocument, ctx: TicketContext, subtitulo: string) {
  const empresa = ctx.empresa || ctx.ticket?.unidade?.empresa;
  const unidade = ctx.unidade || ctx.ticket?.unidade;
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(empresa?.nomeFantasia || empresa?.nomeEmpresarial || 'SOLUTION TICKET', {
      align: 'center',
    });
  doc.fontSize(9).font('Helvetica');
  if (empresa?.documento) doc.text(`CNPJ: ${empresa.documento}`, { align: 'center' });
  if (empresa?.endereco)
    doc.text(
      `${empresa.endereco}${empresa.cidade ? ' - ' + empresa.cidade : ''}${empresa.uf ? '/' + empresa.uf : ''}`,
      { align: 'center' },
    );
  if (unidade?.nome) doc.text(unidade.nome, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text(subtitulo, { align: 'center' });
  doc.moveDown(0.3);
}

export function drawNumeroTicket(doc: PDFKit.PDFDocument, ticket: any) {
  doc.fontSize(16).font('Helvetica-Bold').text(`Ticket Nº ${ticket.numero}`, { align: 'center' });
  doc
    .fontSize(9)
    .font('Helvetica')
    .text(`Emitido em ${fmtData(ticket.criadoEm)}`, { align: 'center' });
  doc.moveDown(0.5);
}

export function linhaCampo(
  doc: PDFKit.PDFDocument,
  label: string,
  valor: string,
  opts?: { bold?: boolean; x?: number; width?: number },
) {
  const y = doc.y;
  const x = opts?.x ?? doc.page.margins.left;
  const width = opts?.width ?? doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.font('Helvetica-Bold').fontSize(9).text(label, x, y, { continued: true, width });
  doc
    .font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(9)
    .text(` ${valor}`);
}

export function drawAssinaturas(doc: PDFKit.PDFDocument) {
  doc.moveDown(2);
  const y = doc.y;
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const mid = (left + right) / 2;
  doc
    .moveTo(left, y)
    .lineTo(mid - 20, y)
    .stroke();
  doc
    .moveTo(mid + 20, y)
    .lineTo(right, y)
    .stroke();
  doc.fontSize(8).text('Motorista', left, y + 4, { width: mid - 20 - left, align: 'center' });
  doc.text('Balanceiro', mid + 20, y + 4, { width: right - mid - 20, align: 'center' });
}

export function calcularLiquido(ticket: any): number {
  return Number(ticket.pesoLiquidoFinal || ticket.pesoLiquidoSemDesconto || 0);
}

export function calcularBruto(ticket: any): number {
  return Number(ticket.pesoBrutoApurado || 0);
}

export function calcularTara(ticket: any): number {
  return Number(ticket.pesoTaraApurada || ticket.taraCadastradaSnapshot || 0);
}
