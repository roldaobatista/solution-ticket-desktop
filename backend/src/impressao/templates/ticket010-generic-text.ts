import PDFDocument from 'pdfkit';
import {
  TicketContext,
  toBuffer,
  fmtKg,
  fmtData,
  calcularBruto,
  calcularTara,
  calcularLiquido,
} from './shared';

/**
 * TICKET010 - CUPOM Generic Text (matricial). Layout estilo texto puro mono.
 */
export async function renderTicket010(ctx: TicketContext): Promise<Buffer> {
  const doc = new PDFDocument({ size: [226, 700], margin: 6 });
  const out = toBuffer(doc);
  const t = ctx.ticket;
  const empresa = ctx.empresa || ctx.ticket?.unidade?.empresa;

  doc.font('Courier').fontSize(8);
  const line = (s = '') => doc.text(s);

  line((empresa?.nomeFantasia || 'SOLUTION TICKET').padStart(20, ' ').padEnd(38, ' '));
  if (empresa?.documento) line(`CNPJ: ${empresa.documento}`);
  line('----------------------------------------');
  line(`TICKET DE PESAGEM  Nº ${t.numero}`);
  line(`Data: ${fmtData(t.criadoEm)}`);
  line('----------------------------------------');
  line(`Cliente : ${(t.cliente?.razaoSocial || '-').substring(0, 28)}`);
  line(`Produto : ${(t.produto?.descricao || '-').substring(0, 28)}`);
  line(`Placa   : ${t.veiculo?.placa || t.veiculoPlaca || '-'}`);
  line(`Motor.  : ${(t.motorista?.nome || '-').substring(0, 28)}`);
  if (t.notaFiscal) line(`NF      : ${t.notaFiscal}`);
  line('----------------------------------------');
  line(`Bruto : ${fmtKg(calcularBruto(t)).padStart(10)} kg`);
  line(`Tara  : ${fmtKg(calcularTara(t)).padStart(10)} kg`);
  if (Number(t.totalDescontos || 0) > 0) {
    line(`Desc. : ${fmtKg(Number(t.totalDescontos)).padStart(10)} kg`);
  }
  line('----------------------------------------');
  line(`LIQUIDO: ${fmtKg(calcularLiquido(t)).padStart(10)} kg`);
  line('----------------------------------------');
  line('');
  line('______________________');
  line('Assinatura');
  doc.end();
  return out;
}
