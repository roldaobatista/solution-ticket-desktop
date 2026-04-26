/**
 * Enum centralizado de permissões do sistema.
 * RS1: usar apenas estas constantes em seed, guards e controllers para
 * evitar divergência de string (ex: 'usuario:gerenciar' vs 'usuarios:gerenciar').
 */

export const Permissao = {
  // Tickets
  TICKET_CRIAR: 'ticket:criar',
  TICKET_EDITAR: 'ticket:editar',
  TICKET_FECHAR: 'ticket:fechar',
  TICKET_CANCELAR: 'ticket:cancelar',
  TICKET_MANUTENCAO: 'ticket:manutencao',
  TICKET_REIMPRIMIR: 'ticket:reimprimir',

  // Cadastros gerais
  CADASTRO_GERENCIAR: 'cadastro:gerenciar',

  // Configurações / balanças
  CONFIG_GERENCIAR: 'config:gerenciar',

  // Romaneio
  ROMANEIO_GERENCIAR: 'romaneio:gerenciar',

  // Fatura / financeiro
  FATURA_GERENCIAR: 'fatura:gerenciar',

  // Relatórios
  RELATORIO_VISUALIZAR: 'relatorio:visualizar',

  // Dashboard
  DASHBOARD_VISUALIZAR: 'dashboard:visualizar',

  // Usuários / perfis / permissões
  USUARIOS_GERENCIAR: 'usuarios:gerenciar',

  // Licença
  LICENCA_GERENCIAR: 'licenca:gerenciar',

  // Auditoria
  AUDITORIA_VISUALIZAR: 'auditoria:visualizar',

  // Pesagem
  PESO_MANUAL: 'peso:manual',
  PASSAGEM_INVALIDAR: 'passagem:invalidar',

  // Pagamento
  PAGAMENTO_GERENCIAR: 'pagamento:gerenciar',
} as const;

export type PermissaoValue = (typeof Permissao)[keyof typeof Permissao];
