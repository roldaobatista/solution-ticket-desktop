/**
 * S2.3: custo único e auditável para todas as chamadas bcrypt.hash em produção.
 * Tests podem usar valor menor diretamente (não importam esta constante).
 * Trocar para 12 quando hardware permitir (>= 250ms aceitável em login).
 */
export const BCRYPT_COST_PROD = 12;

if (BCRYPT_COST_PROD < 10) {
  throw new Error(`BCRYPT_COST_PROD muito baixo (${BCRYPT_COST_PROD}). Mínimo 10.`);
}
