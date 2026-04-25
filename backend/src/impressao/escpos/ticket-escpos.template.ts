import { EscposBuffer } from './escpos-buffer';

export interface TicketEscposData {
  empresaNome?: string;
  empresaDocumento?: string;
  empresaEndereco?: string;
  numero: string;
  dataHora: string;
  placa?: string;
  motorista?: string;
  produto?: string;
  cliente?: string;
  transportadora?: string;
  origem?: string;
  destino?: string;
  pesoBruto?: string;
  pesoTara?: string;
  pesoLiquido?: string;
  descontos?: string;
  pesoLiquidoFinal?: string;
  observacao?: string;
  qrCode?: string;
}

/**
 * D13: Template de ticket de pesagem em ESC/POS 80mm.
 * Largura útil: ~32-48 caracteres em fonte normal (depende da densidade).
 */
export function gerarTicketEscpos(data: TicketEscposData): Buffer {
  const b = EscposBuffer.create().init();

  // Cabeçalho da empresa
  b.align(1).bold(true);
  if (data.empresaNome) b.text(data.empresaNome).newline();
  b.bold(false);
  if (data.empresaDocumento) b.text(data.empresaDocumento).newline();
  if (data.empresaEndereco) b.text(data.empresaEndereco).newline();
  b.separator('=', 32).newline();

  // Título
  b.align(1).large().bold(true).text('TICKET DE PESAGEM').newline();
  b.normal().bold(false).newline();

  // Número e data
  b.align(0).text(`Nº: ${data.numero}`).newline();
  b.text(`Data/Hora: ${data.dataHora}`).newline();
  b.separator('-', 32).newline();

  // Dados do veículo e motorista
  if (data.placa) b.text(`Placa: ${data.placa}`).newline();
  if (data.motorista) b.text(`Motorista: ${data.motorista}`).newline();
  b.newline();

  // Dados comerciais
  if (data.cliente) b.text(`Cliente: ${data.cliente}`).newline();
  if (data.transportadora) b.text(`Transportadora: ${data.transportadora}`).newline();
  if (data.produto) b.text(`Produto: ${data.produto}`).newline();
  if (data.origem) b.text(`Origem: ${data.origem}`).newline();
  if (data.destino) b.text(`Destino: ${data.destino}`).newline();
  b.separator('-', 32).newline();

  // Pesos
  b.align(0);
  if (data.pesoBruto) b.text(`PESO BRUTO:   ${data.pesoBruto.padStart(12)} kg`).newline();
  if (data.pesoTara) b.text(`PESO TARA:    ${data.pesoTara.padStart(12)} kg`).newline();
  b.separator('-', 32).newline();

  if (data.pesoLiquido) {
    b.bold(true)
      .text(`PESO LIQUIDO: ${data.pesoLiquido.padStart(12)} kg`)
      .newline()
      .bold(false);
  }
  if (data.descontos) {
    b.text(`DESCONTOS:    ${data.descontos.padStart(12)} kg`).newline();
  }
  if (data.pesoLiquidoFinal) {
    b.large()
      .bold(true)
      .text(`LIQ. FINAL:   ${data.pesoLiquidoFinal.padStart(12)} kg`)
      .newline();
    b.normal().bold(false);
  }
  b.separator('=', 32).newline();

  // Observação
  if (data.observacao) {
    b.text(`Obs: ${data.observacao}`).newline();
    b.newline();
  }

  // QR Code (se houver)
  if (data.qrCode) {
    b.align(1).text(data.qrCode).newline();
  }

  // Rodapé
  b.align(1).newline().text('--- Solution Ticket ---').newline();
  b.text('Sistema de Pesagem Veicular').newline();
  b.newline().newline();

  // Corte e abertura de gaveta (opcional)
  b.pulse().cut();

  return b.build();
}
