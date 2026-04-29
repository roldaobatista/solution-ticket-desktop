# ADR-019 — Backup e Restore do SQLite local

**Status**: Aceita
**Data**: 2026-04-27
**Autor**: SRE
**Decisores**: CTO, Tech Lead, Suporte
**Cross-link**: `docs/integracao/BACKUP-RESTORE-SQLITE.md`, ADR-002 (Outbox local-first), `docs/integracao/004-outbox-inbox-retry.md`

---

## 1. Contexto

O Solution Ticket persiste no PC do cliente em `%APPDATA%\@solution-ticket\electron\solution-ticket.db` (SQLite). Esse arquivo concentra:

- Pesagens (operação fim-a-fim do cliente)
- Outbox/Inbox de integração ERP (eventos em vôo)
- `integracao_log` com hash chain (ADR-018)
- Configurações, usuários, licença

Riscos reais:

- HD do PC do cliente falha (média de mercado: 1–2 % ao ano).
- Banco corrompe por queda de energia durante WAL checkpoint.
- Regressão de schema após update do app (raro mas possível).
- Ransomware criptografa o arquivo.

Sem estratégia formal: cliente perde meses de pesagens, fica sem fiscal, processo judicial vira problema. Inaceitável para Tier-1.

---

## 2. Decisão

Adotamos política de backup/restore com **3 camadas**:

### 2.1 Backup automático horário (local)

- A cada **1 h**, executar `VACUUM INTO 'backups/solution-ticket-YYYYMMDDHH.db'` (atomic, online, não bloqueia operação).
- Pasta separada do banco principal: `%APPDATA%\@solution-ticket\electron\backups\`.
- **RPO local: 1 h**.
- Rotação: manter **7 dias** locais (168 backups). Job de limpeza diário.

### 2.2 Sync cloud opt-in (30 dias)

- Cliente habilita em Configurações → Backup Cloud.
- Upload incremental via relay para bucket S3 (criptografado client-side com chave do tenant).
- Retenção: **30 dias rolling**.
- Custo: ~R$ 5/mês/cliente (incluso no Tier Enterprise; opcional R$ 15/mês no Pro).

### 2.3 Restore (4 cenários documentados)

Detalhados em `BACKUP-RESTORE-SQLITE.md`:

- **HD falhou** — restore do último backup local (se disco sobrevive) ou cloud.
- **Banco corrompido** — `PRAGMA integrity_check` falha → escolher último backup íntegro.
- **Regressão de schema** — restore + replay de migrations.
- **Ransomware** — restore via cloud + reset de credenciais + auditoria.

**RTO objetivo: ≤ 30 min** para restore manual com acompanhamento de Suporte L2.

### 2.4 Outbox em vôo

O outbox preserva eventos PENDING. Após restore:

- `processedAt` ausente → reprocessar.
- Idempotência via `idempotencyKey` evita duplicação no ERP (ADR-014).
- Cliente **não perde fiscal** mesmo perdendo até 1 h.

### 2.5 Drill mensal

- Toda primeira segunda do mês: SRE pega backup aleatório de cliente staging, restaura em ambiente isolado, executa smoke test (login + listar pesagens + reprocessar 1 outbox PENDING).
- Sucesso atualiza métrica `restore_test_last_pass_date`.
- Falha gera P2 imediato.

### 2.6 Comandos PowerShell

Documentados em `BACKUP-RESTORE-SQLITE.md`:

- `sqlite-backup.ps1` — força backup imediato (suporte chama em P1).
- `sqlite-restore.ps1 --from <arquivo>` — restore guiado.

---

## 3. Consequências

### Positivas

- RPO 1 h local + 24 h cloud cobre os cenários reais.
- RTO 30 min é compatível com SLA Enterprise (P1 4 h).
- Drill mensal evita "backup que não restaura" (problema clássico).

### Negativas

- Espaço em disco: ~7× tamanho do banco (em média 200–700 MB/cliente).
- Banda upload cloud: leve, mas cliente em rede ruim percebe.
- Custo cloud R$ 5–15/mês incluso no plano.

### Riscos

- Backup corrompido junto com primário (caso ransomware) → mitigação: cloud com versionamento.
- Cliente desliga PC antes do backup horário rodar → mitigação: disparar backup também no shutdown gracioso do Electron.

---

## 4. Implementação

- Job NestJS `BackupService` com cron `0 * * * *` (hora cheia).
- Hook `app.on('before-quit')` no Electron para forçar backup final.
- `sqlite-backup.ps1` e `sqlite-restore.ps1` em `keygen/scripts/` (release).
- Métricas exportadas: `backup_age_seconds`, `backup_last_size_bytes`, `restore_test_last_pass_date`.

---

## 5. Referências

- ADR-002 — Outbox local-first
- ADR-014 — Consistência outbox/inbox (idempotência)
- `docs/integracao/BACKUP-RESTORE-SQLITE.md` (runbook detalhado)
- SQLite Online Backup API — https://www.sqlite.org/backup.html
- AWS S3 Versioning — https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html
