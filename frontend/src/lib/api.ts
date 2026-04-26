/**
 * Facade do cliente HTTP — concentra re-exports dos modulos de dominio em api/.
 *
 * Migrado de um arquivo unico de 1655 linhas para sub-modulos por dominio:
 *   - api/client.ts      — axios instance, interceptors, helpers
 *   - api/auth.ts        — login, getMe, change/reset password
 *   - api/dashboard.ts   — KPIs, evolucao, top-clientes, distribuicao-produto
 *   - api/cadastros.ts   — clientes, transportadoras, motoristas, produtos,
 *                          veiculos, indicadores, unidades, perfis, usuarios,
 *                          armazens, empresas, tipos-veiculo, origens, destinos,
 *                          tipos-desconto
 *   - api/balanca.ts     — CRUD de balancas, peso, status, calibracao, stream
 *   - api/tickets.ts     — CRUD, fechar, cancelar, manutencao, historico
 *   - api/impressao.ts   — templates, PDF, documentos do ticket, erros
 *   - api/romaneios.ts   — listagem e criacao
 *   - api/financeiro.ts  — faturas, pagamentos, formas pgto, saldos, extrato
 *   - api/comercial.ts   — tabelas de preco, ajustes, historico
 *   - api/licenca.ts     — status, fingerprint, trial, ativar
 *   - api/configuracao.ts — get/update por unidade
 *   - api/relatorios.ts  — movimento, alteradas, canceladas, salvos
 *   - api/recibos.ts     — CRUD + impressao
 *   - api/utilitarios.ts — diagnostico, logs, parse XML, auditoria, serial terminal
 *
 * Para novo codigo, prefira importar diretamente do submodulo.
 * Esta facade existe para nao quebrar imports legados que apontam para `@/lib/api`.
 */

export * from './api/client';
export * from './api/auth';
export * from './api/dashboard';
export * from './api/cadastros';
export * from './api/balanca';
export * from './api/tickets';
export * from './api/impressao';
export * from './api/romaneios';
export * from './api/financeiro';
export * from './api/comercial';
export * from './api/licenca';
export * from './api/configuracao';
export * from './api/relatorios';
export * from './api/recibos';
export * from './api/utilitarios';
// Modulos de balanca config + indicador ja existiam pre-split — mantidos.
export * from './api/balanca-config';
export * from './api/indicador';
// Onda 5.1 — fotos de ticket via webcam/IP camera/OCR.
export * from './api/camera';
// Onda 5.2 — historico de calibracoes por balanca.
export * from './api/calibracao';
// Onda — backup do banco SQLite (manual + auto).
export * from './api/backup';
