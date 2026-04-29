-- Balanças não devem permanecer online por default após upgrade.
-- SQLite não permite alterar DEFAULT em coluna existente sem rebuild de tabela;
-- o código de criação passa a gravar status_online=false explicitamente.
UPDATE "balanca" SET "status_online" = false;
