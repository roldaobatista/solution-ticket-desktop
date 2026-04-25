-- =============================================================================
-- PRE-CHECK: detecta duplicatas que fariam a migracao falhar (RD2 da reauditoria)
-- =============================================================================
--
-- Esta migracao adiciona dois @@unique tenant-scoped:
--   1. empresa: UNIQUE (tenant_id, documento)
--   2. veiculo: UNIQUE (tenant_id, placa)
--
-- Se o banco do cliente ja tem dois registros com o mesmo (tenantId, documento)
-- ou (tenantId, placa), a migracao FALHA com SQLITE_CONSTRAINT.
--
-- Rode este script ANTES de aplicar a migracao em qualquer cliente em producao:
--
--   sqlite3 solution-ticket.db < PRE-CHECK-duplicates.sql
--
-- Se retornar linhas, limpe os duplicados antes de migrar (ver RECOVERY no fim).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. Empresas com (tenant_id, documento) duplicado
-- ----------------------------------------------------------------------------
SELECT
    'empresa' AS tabela,
    tenant_id,
    documento,
    COUNT(*) AS qtd,
    GROUP_CONCAT(id, ',') AS ids
FROM empresa
WHERE documento IS NOT NULL AND documento != ''
GROUP BY tenant_id, documento
HAVING COUNT(*) > 1;

-- ----------------------------------------------------------------------------
-- 2. Veiculos com (tenant_id, placa) duplicada
-- ----------------------------------------------------------------------------
SELECT
    'veiculo' AS tabela,
    tenant_id,
    placa,
    COUNT(*) AS qtd,
    GROUP_CONCAT(id, ',') AS ids
FROM veiculo
GROUP BY tenant_id, placa
HAVING COUNT(*) > 1;

-- =============================================================================
-- RECOVERY (executar apenas apos analise manual)
-- =============================================================================
--
-- Para cada conjunto retornado acima, decidir qual registro manter e remover
-- as duplicatas. Exemplo para empresa:
--
--   -- 1. Liste tudo do tenant/documento conflitante
--   SELECT * FROM empresa WHERE tenant_id = '...' AND documento = '...';
--
--   -- 2. Identifique o "canonico" (mais recente, com mais relacionamentos, etc)
--   --    e atualize FKs apontando para os duplicados:
--   UPDATE balanca   SET empresa_id = '<canonico>' WHERE empresa_id IN ('<dup1>','<dup2>');
--   UPDATE veiculo   SET empresa_id = '<canonico>' WHERE empresa_id IN ('<dup1>','<dup2>');
--   UPDATE motorista SET empresa_id = '<canonico>' WHERE empresa_id IN ('<dup1>','<dup2>');
--   UPDATE unidade   SET empresa_id = '<canonico>' WHERE empresa_id IN ('<dup1>','<dup2>');
--
--   -- 3. Apague os duplicados
--   DELETE FROM empresa WHERE id IN ('<dup1>','<dup2>');
--
--   -- 4. Re-rode este script para confirmar 0 linhas retornadas.
--
-- Para veiculos, o procedimento e analogo (UPDATE em ticket/passagem antes do DELETE).
-- =============================================================================
