import { TicketContext } from './shared';
import { renderTicket001 } from './ticket001-a5-1pf';
import { renderTicket002 } from './ticket002-a4-2pf';
import { renderTicket003 } from './ticket003-a4-3pf';
import { renderTicket004 } from './ticket004-cupom';
import { renderTicket005 } from './ticket005-descontos';
import { renderTicket010 } from './ticket010-generic-text';

export interface TemplateInfo {
  id: string;
  nome: string;
  descricao: string;
  formato: string;
  implementado: boolean;
}

export const TEMPLATE_REGISTRY: TemplateInfo[] = [
  {
    id: 'TICKET001',
    nome: 'A5 - 1 Passagem (Tara Ref.)',
    descricao: '1PF com tara referenciada',
    formato: 'A5',
    implementado: true,
  },
  {
    id: 'TICKET002',
    nome: 'A4 - 2 Passagens (Padrao)',
    descricao: 'Bruto/Tara padrao',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET002_DIF_NOTA',
    nome: 'A4 - 2 Passagens (Dif. Nota)',
    descricao: 'Mostra diferenca vs NF',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET002_VALOR',
    nome: 'A4 - 2 Passagens (Valor)',
    descricao: 'Com valor comercial',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET002_INTEIRO',
    nome: 'A4 - 2 Passagens (Inteiro)',
    descricao: 'Variante INTEIRO',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET002_SEM_DESCONTO',
    nome: 'A4 - 2 Passagens (Sem Desconto)',
    descricao: 'Inteiro sem descontos',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET003',
    nome: 'A4 - 3 Passagens',
    descricao: 'Com passagem de controle',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET004',
    nome: 'Cupom 80mm (Padrao)',
    descricao: 'Cupom termico',
    formato: 'Cupom',
    implementado: true,
  },
  {
    id: 'TICKET004_COM_DESCONTO',
    nome: 'Cupom 80mm (Com Desconto)',
    descricao: 'Cupom com descontos',
    formato: 'Cupom',
    implementado: true,
  },
  {
    id: 'TICKET004_GERTEC',
    nome: 'Cupom Gertec',
    descricao: 'Cupom Gertec',
    formato: 'Cupom',
    implementado: true,
  },
  {
    id: 'TICKET004_RESUMIDO',
    nome: 'Cupom Resumido',
    descricao: 'Cupom reduzido',
    formato: 'Cupom',
    implementado: true,
  },
  {
    id: 'TICKET004_RESUMIDO_PRODUTOR',
    nome: 'Cupom Resumido Produtor',
    descricao: 'Resumido com origem',
    formato: 'Cupom',
    implementado: true,
  },
  {
    id: 'TICKET004_SEM_ASSINATURA',
    nome: 'Cupom Sem Assinatura',
    descricao: 'Sem campo de assinatura',
    formato: 'Cupom',
    implementado: true,
  },
  {
    id: 'TICKET005A',
    nome: 'A4 Descontos (Sem Valor)',
    descricao: 'Descontos sem valor',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET005B',
    nome: 'A4 Descontos (Com Valor)',
    descricao: 'Descontos com valor',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET005C',
    nome: 'A4 Descontos + Umidade',
    descricao: 'Com tabela umidade',
    formato: 'A4',
    implementado: true,
  },
  {
    id: 'TICKET010',
    nome: 'Cupom Generic Text',
    descricao: 'Formato matricial mono',
    formato: 'Cupom',
    implementado: true,
  },
];

export async function gerarPdf(templateId: string, ctx: TicketContext): Promise<Buffer> {
  const id = (templateId || 'TICKET002').toUpperCase();
  switch (id) {
    case 'TICKET001':
      return renderTicket001(ctx);
    case 'TICKET002':
    case 'TICKET002_PADRAO':
      return renderTicket002(ctx, { variante: 'PADRAO' });
    case 'TICKET002_DIF_NOTA':
      return renderTicket002(ctx, { variante: 'DIF_NOTA' });
    case 'TICKET002_VALOR':
      return renderTicket002(ctx, { variante: 'VALOR' });
    case 'TICKET002_INTEIRO':
      return renderTicket002(ctx, { variante: 'INTEIRO' });
    case 'TICKET002_SEM_DESCONTO':
      return renderTicket002(ctx, { variante: 'SEM_DESCONTO' });
    case 'TICKET003':
      return renderTicket003(ctx);
    case 'TICKET004':
    case 'TICKET004_PADRAO':
      return renderTicket004(ctx, { variante: 'PADRAO' });
    case 'TICKET004_COM_DESCONTO':
      return renderTicket004(ctx, { variante: 'COM_DESCONTO' });
    case 'TICKET004_GERTEC':
      return renderTicket004(ctx, { variante: 'GERTEC' });
    case 'TICKET004_RESUMIDO':
      return renderTicket004(ctx, { variante: 'RESUMIDO' });
    case 'TICKET004_RESUMIDO_PRODUTOR':
      return renderTicket004(ctx, { variante: 'RESUMIDO_PRODUTOR' });
    case 'TICKET004_SEM_ASSINATURA':
      return renderTicket004(ctx, { variante: 'SEM_ASSINATURA' });
    case 'TICKET005A':
      return renderTicket005(ctx, { variante: 'SEM_VALOR' });
    case 'TICKET005B':
      return renderTicket005(ctx, { variante: 'COM_VALOR' });
    case 'TICKET005C':
      return renderTicket005(ctx, { variante: 'COM_VALOR_TAB_UMIDADE' });
    case 'TICKET010':
      return renderTicket010(ctx);
    default:
      return renderTicket002(ctx, { variante: 'PADRAO' });
  }
}
