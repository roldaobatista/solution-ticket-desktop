# Backup e Restore — SQLite local

**Versão**: 1.0 — 2026-04-27
**Audiência**: Suporte L2/L3, SRE
**Cross-link**: ADR-019, ADR-002

---

## 1. Política

| Item                      | Valor                             |
| ------------------------- | --------------------------------- |
| Frequência local          | a cada 1 h (hora cheia)           |
| Frequência cloud (opt-in) | sync incremental 1×/dia (03h BRT) |
| RPO local                 | 1 h                               |
| RPO cloud                 | 24 h                              |
| RTO objetivo              | ≤ 30 min                          |
| Retenção local            | 7 dias (168 backups)              |
| Retenção cloud            | 30 dias rolling                   |
| Drill                     | 1ª segunda do mês                 |

---

## 2. Backup automático

- Comando interno: `VACUUM INTO 'backups/solution-ticket-YYYYMMDDHH.db'` (atomic, online).
- Pasta: `%APPDATA%\@solution-ticket\electron\backups\`.
- Limpeza diária 02h: remove arquivos > 7 dias.
- Backup de shutdown: `app.on('before-quit')` força um backup final.

### Backup manual (Suporte chama em P1)

```powershell
# Em PowerShell na máquina do cliente
& "C:\Program Files\Solution Ticket\resources\scripts\sqlite-backup.ps1"
# Saída: caminho do backup gerado
```

---

## 3. Sync cloud opt-in

- Habilitado em Configurações → Backup Cloud.
- Upload incremental criptografado com chave do tenant.
- Bucket: `solution-ticket-backups-tenant-<id>` (S3 com versionamento).
- Retenção 30 dias; expurgo automático.

---

## 4. Cenários de restore

### Cenário A — HD falhou (físico)

**Tempo estimado: 45–60 min** (inclui troca de HD).

1. Trocar HD, reinstalar Solution Ticket.
2. Antes de iniciar pela primeira vez, copiar backup mais recente para `%APPDATA%\@solution-ticket\electron\solution-ticket.db`.
3. Se backup local perdido → restore via cloud (Suporte L2 dispara download).
4. Iniciar app → revalidar licença (fingerprint mudou após troca HD; emitir nova).
5. Smoke test: login admin + listar últimas 10 pesagens + reprocessar 1 outbox PENDING.

### Cenário B — Banco corrompido

**Tempo estimado: 15–20 min**.

1. App não abre ou loga `database disk image is malformed`.
2. Suporte L2 roda:
   ```powershell
   sqlite3.exe solution-ticket.db "PRAGMA integrity_check;"
   ```
3. Se falhar:
   ```powershell
   & "...\scripts\sqlite-restore.ps1" --auto-pick-latest-valid
   ```
4. Script testa backups do mais recente ao mais antigo até achar íntegro.
5. Smoke test obrigatório antes de devolver ao cliente.

### Cenário C — Regressão de schema (após update do app)

**Tempo estimado: 20–30 min**.

1. App falha ao subir com `Prisma migration error`.
2. Restore do último backup pré-update.
3. Aplicar migrations Prisma manualmente:
   ```powershell
   & "...\scripts\sqlite-restore.ps1" --from <backup> --then-migrate
   ```
4. Validar com `npx prisma db pull` que schema fica consistente.

### Cenário D — Ransomware (arquivos criptografados)

**Tempo estimado: 60–120 min** (inclui higienização).

1. **Não pagar resgate.** Isolar máquina da rede.
2. Suporte L3 + Segurança escalados (P1 imediato).
3. Restore via **cloud** (backup local provavelmente comprometido).
4. **Rotacionar**: senhas, chave HMAC do audit log (ADR-018), licença RSA do cliente.
5. Auditoria com `audit verify` da semana anterior — confirmar integridade pré-ataque.
6. Comunicação cliente + DPO + relatório de incidente.

---

## 4.1 Off-machine replication assinada

Backup local horário (§2) cobre falha local. Mas precisa de cópia **off-machine** para sobreviver a ransomware, sinistro físico, fraude interna ou fatura fiscal de retenção 5 anos.

### Política

| Item                       | Valor                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Frequência                 | snapshot diário durante off-hours (03h BRT)                                          |
| Transporte                 | VPN ou relay cloud (mTLS + AES-256 em trânsito)                                      |
| Destino                    | bucket S3 Object Lock (WORM) por tenant: `s3://solution-ticket-archive-<tenant_id>/` |
| Modo Object Lock           | **Compliance** (não pode ser deletado nem por root da AWS dentro da janela)          |
| Retenção                   | **5 anos** (alinhamento fiscal SPED + LGPD Art. 16)                                  |
| Assinatura                 | snapshot encripta + assina com chave RSA da chave pública do tenant antes de upload  |
| Verificação de integridade | semanal: download + `sha256sum` + verificar assinatura                               |
| Restore testado            | mensal em ambiente staging com snapshot real do cliente piloto                       |
| Custo estimado             | ≤ U$ 0,50/tenant/mês (S3 Standard-IA + Object Lock)                                  |

### Fluxo do upload diário

1. App local fecha worker (drain ≤ 60 s).
2. `VACUUM INTO` cria snapshot consistente.
3. Hash + assinatura RSA da chave do tenant (mesma chave do audit log, ADR-018).
4. Upload via mTLS para S3 (presigned URL emitida pelo relay).
5. Object Lock aplicado automaticamente (retenção 5 anos).
6. Manifesto local atualizado (`backups/manifest.jsonl`) com hash + timestamp + objectVersionId.

### Verificação semanal

- Cron sábado 04h BRT: baixa snapshot do dia, verifica `sha256` e assinatura.
- Falha → alerta P2 + suporte L2 investiga.
- Sucesso → atualiza métrica `backup_offmachine_last_verify_seconds`.

### Restore drill mensal (staging)

- 1ª segunda do mês: SRE escolhe snapshot real (anonimizado) do cliente piloto.
- Download → verifica assinatura → aplica em SQLite vazio do staging.
- Smoke test (mesmo do §6).
- Mede **TTRec real** (download + verificação + apply + smoke). Alvo: ≤ 30 min.
- Resultado registrado em `docs/runbooks/drills/offmachine-restore-YYYY-MM.md`.

---

## 4.2 Cenário ransomware — playbook detalhado

Cenário D do §4 já existe; esta seção amplia para nível operacional.

### Detecção (IOCs)

- **Mudança em massa** em `%APPDATA%\@solution-ticket\electron\` em < 5 min (>50 arquivos modificados).
- Processos suspeitos: `vssadmin delete shadows`, `wbadmin delete catalog`, `cipher /w`.
- Extensões suspeitas em `data/` (ex.: `.lockbit`, `.encrypted`, `.crypt`).
- Falha de leitura do `solution-ticket.db` com mensagem de header inválido.
- EDR (se cliente tiver) dispara alerta.

Métrica embutida no app: `file_modification_rate{path}` — alerta P1 se > 100 modificações/min em diretório de dados.

### Resposta (ordem)

1. **Isolamento imediato (≤ 2 min):**
   - Kill conector (todos os profiles).
   - Pause outbox processor (worker em estado `PAUSED`, não processa novos eventos).
   - Bloquear saída de rede do app (firewall regra deny outbound).
   - Notificar SRE on-call (P0).

2. **Triagem (≤ 15 min):**
   - Confirmar IOC (humano, não só automatização).
   - Extrair amostra de arquivo criptografado (forense).
   - Identificar vetor inicial (e-mail? RDP? supply chain?).

3. **Restore from off-machine signed backup (≤ 60 min):**
   - **NÃO** restaurar do backup local — pode estar comprometido.
   - Download do snapshot do dia anterior (S3 Object Lock).
   - Verifica `sha256` e assinatura RSA.
   - Provisiona nova máquina (limpa) ou reinstala SO + Solution Ticket.
   - Aplica snapshot.

4. **Verificação tamper-evident hash chain (≤ 30 min):**
   - `audit verify --from <data-última-confiável>` valida hash chain do audit log.
   - Se quebra detectada antes do restore: incidente de integridade — escalar P0.
   - Se chain íntegro: confirma que dados restaurados são pré-ataque.

5. **Comunicação ANPD (se PII vazou — ≤ 72 h LGPD Art. 48):**
   - DPO redige relatório.
   - Notificação formal incluindo: natureza dos dados, número de titulares, medidas tomadas, riscos.
   - Comunicação aos titulares afetados (se risco alto, conforme Art. 48 §1 II).

6. **Retomada gradual (≤ 4 h):**
   - Habilitar conector em modo **shadow** (apenas read-only do ERP) por 2 h.
   - Comparar estado local vs ERP (reconciliação).
   - Reabilitar outbox em modo lento (50 % concurrency, 50 % rate-limit).
   - Após 24 h sem incidente: full speed.

7. **Pós-incidente:**
   - Post-mortem público (P0).
   - Rotação de credenciais (DPAPI, HMAC ADR-018, licença RSA — Cenário D §4 já cobria).
   - Revisão de antivirus / EDR / hardening do cliente.
   - Update do `THREAT-MODEL-INTEGRACAO.md` com vetor identificado.

### Chaos drill correspondente

Ver `CHAOS-ENGINEERING-PLAN.md` cenário "(a) ransomware com restauração desde off-machine backup".

---

## 5. Comandos PowerShell

### `sqlite-backup.ps1`

```powershell
# Localização: <install>\resources\scripts\sqlite-backup.ps1
# Uso:
.\sqlite-backup.ps1                        # backup imediato
.\sqlite-backup.ps1 -Output C:\temp\b.db   # destino custom
.\sqlite-backup.ps1 -CloudUpload           # força upload imediato (se opt-in)
```

### `sqlite-restore.ps1`

```powershell
.\sqlite-restore.ps1 --from <caminho>      # restore explícito
.\sqlite-restore.ps1 --auto-pick-latest-valid
.\sqlite-restore.ps1 --from <caminho> --then-migrate
.\sqlite-restore.ps1 --from-cloud <data>   # baixa do S3
```

Ambos exigem app fechado (script verifica processo `Solution Ticket.exe` e aborta se aberto).

---

## 6. Drill mensal — template de relatório

```markdown
# Relatório drill backup/restore — YYYY-MM

- Data: \_\_\_\_
- SRE responsável: \_\_\_\_
- Backup escolhido: <cliente staging> @ <timestamp>
- Tempo de download: \_\_ min
- Tempo de restore: \_\_ min
- Smoke test:
  - [ ] login admin
  - [ ] lista 10 pesagens recentes
  - [ ] reprocessa outbox PENDING
  - [ ] `audit verify --from <data>` retorna OK
- Resultado: PASS / FAIL
- Findings: \_\_\_\_
- Ação corretiva (se FAIL): \_\_\_\_
```

Salvo em `docs/runbooks/drills/backup-YYYY-MM.md`.

---

## 7. Métricas exportadas (Prometheus)

```
backup_age_seconds                 # idade do último backup local
backup_last_size_bytes             # tamanho do último backup
backup_cloud_last_upload_seconds   # idade do último upload cloud
restore_test_last_pass_date        # epoch do último drill PASS
```

Alertas:

- `backup_age_seconds > 7200` → P2 (backup falhou 2h+).
- `restore_test_last_pass_date < now - 45d` → P3 (drill atrasado).

---

## 8. Referências

- ADR-019 — decisão técnica
- ADR-002 — outbox local-first
- ADR-018 — audit trail tamper-evident
- SQLite Backup API — https://www.sqlite.org/backup.html
