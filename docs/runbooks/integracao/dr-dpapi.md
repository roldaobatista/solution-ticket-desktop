# Runbook — Disaster Recovery DPAPI (Restauração de Credenciais)

**Versão**: 1.0 — 2026-04-27
**Resolve**: HIGH H8 da auditoria
**Audiência**: Suporte L2/L3 + Tech Lead
**Tempo médio de resolução**: 30–60 min por instalação

**RTO**: 30 min por conector + 1 h total para 6 ERPs (cliente Enterprise típico)
**RPO**: tokens — sempre re-obteníveis via re-OAuth ou re-input de API Key (não há perda de dado de domínio; outbox local preserva fila pendente)

---

## Quando aplicar

DPAPI (Windows Data Protection API) deriva chave de criptografia do **perfil do usuário Windows**. Credenciais armazenadas via DPAPI ficam **inacessíveis** quando:

| Cenário                                    | Frequência |
| ------------------------------------------ | ---------- |
| Cliente formata Windows                    | ~1×/ano    |
| Troca de máquina (PC novo)                 | ~5%/ano    |
| Conta de usuário Windows recriada          | raro       |
| Migração para outro usuário Windows        | médio      |
| HD falha sem backup do banco               | raro       |
| Restauração de backup em máquina diferente | médio      |

Sem este runbook: cliente precisa **reonboardar TODOS os conectores** manualmente — perda de SLA e satisfação.

---

## Sintomas

- Login no Solution Ticket funciona normalmente (banco SQLite acessível)
- Conectores aparecem no dashboard mas **status = "OFFLINE"** ou erro de credencial
- Logs mostram erro `DPAPI_DECRYPT_FAILED` ou `CREDENTIAL_NOT_FOUND`
- Teste de conexão falha em todos os conectores OAuth
- Webhook entrante não chega (token relay também afetado)

---

## Diagnóstico (5 min)

### Passo 1: confirmar é DPAPI

```powershell
# No PowerShell como o usuário do ST
cd "%APPDATA%\@solution-ticket\electron\"
# Verificar se banco SQLite existe e tem dados
sqlite3 solution-ticket.db "SELECT COUNT(*) FROM integracao_secret;"
```

Se retorna > 0 mas decriptação falha → DPAPI quebrado, dados estão lá mas inacessíveis.

### Passo 2: identificar mudança ambiental

- Reinstalou Windows? (DPAPI master key zerada)
- Mudou de máquina? (DPAPI é per-machine)
- Trocou senha do Windows? (DPAPI master key re-cifrada — pode falhar se mudança feita por admin)
- Logou com outro usuário Windows? (DPAPI é per-user)

---

## Procedimento de recuperação

### Cenário A: Mesma máquina, mesmo usuário Windows, senha mudou

**Frequência**: alta após reset de senha pelo admin TI

**Passos**:

1. Logar com a senha antiga do Windows (se disponível)
2. DPAPI re-cifra automaticamente os secrets
3. Nada a fazer no ST

Se senha antiga **perdida**: vai para Cenário B.

---

### Cenário B: Mesma máquina, senha perdida ou usuário recriado

**Frequência**: média

**Passos**:

1. Logar como o usuário do ST
2. Backup do banco atual:
   ```
   copy "%APPDATA%\@solution-ticket\electron\solution-ticket.db" %TEMP%\backup.db
   ```
3. Deletar tabela `integracao_secret`:
   ```
   sqlite3 solution-ticket.db "DELETE FROM integracao_secret;"
   ```
4. Marcar todos os profiles como `OAUTH_REAUTH_REQUIRED`:
   ```
   sqlite3 solution-ticket.db "UPDATE integracao_profile SET status = 'OAUTH_REAUTH_REQUIRED';"
   ```
5. Reiniciar Solution Ticket
6. Para cada conector OAuth (Bling, ContaAzul, SAP, Dynamics, NetSuite):
   - Tela Conectores → conector → "Renovar autorização"
   - Refazer fluxo OAuth (Loopback, Device Grant ou Relay conforme ADR-012)
   - Token novo grava no DPAPI atual
7. Para conectores API Key (Omie, Sankhya, TOTVS Protheus, customizados):
   - Tela Conectores → conector → "Editar credenciais"
   - Re-inserir API Key/Secret
8. Solicitar token novo do **relay cloud** via Admin API:
   ```
   POST https://relay.solution-ticket.com/admin/tenants/<tenant>/tokens/rotate
   ```
9. Inserir novo token relay no ST
10. Validar webhook entrante: enviar evento de teste do ERP

**Tempo estimado**: 15 min por conector × N conectores

---

### Cenário C: Máquina nova / restauração em outro hardware

**Frequência**: ~5% das instalações/ano

**Passos**:

1. Instalar Solution Ticket na máquina nova
2. Restaurar banco SQLite do backup:
   ```
   copy backup.db "%APPDATA%\@solution-ticket\electron\solution-ticket.db"
   ```
3. **Atenção**: DPAPI da máquina nova **não decripta** secrets da máquina antiga
4. Aplicar passos 3–10 do Cenário B
5. Validar fingerprint da licença RSA (pode precisar nova chave de licença)

---

### Cenário D: Migração para outro usuário Windows na mesma máquina

**Procedimento**: igual ao Cenário B (DPAPI é per-user)

---

## Script PowerShell — `dr-dpapi-recover.ps1`

> Auditoria Rodada 5 (Agente 3) marcou este runbook como **narrativo demais**. Pseudo-código abaixo automatiza a parte mecânica do Cenário B/C/D (tudo até a re-autorização interativa, que continua manual por design — segurança).

```powershell
# dr-dpapi-recover.ps1
# Uso: powershell -ExecutionPolicy Bypass -File dr-dpapi-recover.ps1 [-DryRun]
# Pré: usuário Windows do Solution Ticket logado; SQLite CLI instalado; ST parado.

[CmdletBinding()]
param([switch]$DryRun)

$DbPath = "$env:APPDATA\@solution-ticket\electron\solution-ticket.db"
$BackupDir = "$env:TEMP\st-dr-dpapi-$(Get-Date -Format yyyyMMdd-HHmmss)"
$Sqlite = "sqlite3.exe"  # do PATH ou caminho explícito

if (-not (Test-Path $DbPath)) { Write-Error "Banco não encontrado: $DbPath"; exit 1 }

# 1. Backup obrigatório
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
Copy-Item $DbPath "$BackupDir\solution-ticket.db.bak"
Write-Host "[OK] Backup em $BackupDir"

# 2. Listar conectores afetados (status atual)
$profiles = & $Sqlite $DbPath "SELECT id, connectorType, status FROM integracao_profile;"
Write-Host "[INFO] Profiles encontrados:"; $profiles

# 3. Contar segredos órfãos (decifração vai falhar — só contagem)
$secretCount = & $Sqlite $DbPath "SELECT COUNT(*) FROM integracao_secret;"
Write-Host "[INFO] Segredos a invalidar: $secretCount"

if ($DryRun) { Write-Host "[DRY-RUN] Nenhuma alteração feita."; exit 0 }

# 4. Limpar segredos órfãos (DPAPI antigo não decifra mais)
& $Sqlite $DbPath "DELETE FROM integracao_secret;"

# 5. Marcar todos os profiles como precisando de re-auth
& $Sqlite $DbPath "UPDATE integracao_profile SET status = 'OAUTH_REAUTH_REQUIRED';"

# 6. Gerar lista de UI de re-OAuth (entrada para tela de Conectores)
$reauthList = & $Sqlite $DbPath "SELECT id, connectorType, displayName FROM integracao_profile WHERE status = 'OAUTH_REAUTH_REQUIRED';"
$reauthList | Out-File "$BackupDir\reauth-required.txt"
Write-Host "[OK] Lista de re-auth: $BackupDir\reauth-required.txt"

# 7. Próximo passo manual (segurança): abrir ST, ir em Conectores → "Renovar autorização"
Write-Host "[NEXT] Reinicie o Solution Ticket e refaça OAuth/API Key para cada profile listado."
Write-Host "[NEXT] Token relay deve ser rotacionado via: POST https://relay.solution-ticket.com/admin/tenants/<tenant>/tokens/rotate"
```

Este script automatiza 5 dos 10 passos do Cenário B (passos 2, 3, 4 e geração da lista do passo 6). Re-OAuth (passo 6) e validação (passo 10) continuam manuais — interação humana com o ERP é obrigatória por design.

---

## Gate de Sprint 6 — Drill obrigatório

> **Bloqueador GA Sprint 6**: este runbook NÃO está validado até primeiro drill completo. Auditoria Rodada 5 (Agente 3): drill DR-DPAPI nunca foi executado.

### Template de relatório de drill

Salvar em `docs/runbooks/integracao/drills/YYYY-MM-DD-dpapi.md`:

```markdown
# Drill DR-DPAPI — YYYY-MM-DD

**Cenário simulado**: B / C / D
**Conectores no escopo**: <lista>
**Executor**: <nome>
**Aprovador**: Tech Lead

## Métricas

- Tempo total (start → último conector ONLINE): <min>
- Tempo por conector: <tabela>
- RTO atingido vs alvo (30 min/conector): <ok|miss>
- Eventos perdidos: <0 esperado>
- Eventos reprocessados via idempotência: <count>

## Desvios do runbook

<lista do que divergiu>

## Ações de melhoria

<lista>
```

Sem ao menos 1 drill registrado, **GA do Sprint 6 fica bloqueado**.

---

## Prevenção (preventivo, antes do incidente)

### 1. Backup periódico

Configurar conforme `../../DISASTER-RECOVERY.md` para backup diário **excluindo** `integracao_secret` (DPAPI) — apenas dados úteis.

### 2. Documentação cliente

No onboarding, entregar ao cliente:

- Lista de conectores configurados (SEM credenciais)
- Procedimento de re-onboarding (este runbook simplificado)
- Avisar que troca de máquina exige re-OAuth

### 3. Export-ready credentials

Para credenciais não-OAuth (API Keys), oferecer exportação cifrada com senha do cliente:

```
File → Exportar credenciais → senha forte → arquivo .stkenc
```

Restaurar com mesma senha em máquina nova.
**OAuth não é exportável** (nature do refresh token vinculado).

---

## SLA por cenário

| Cenário           | SLA Pro      | SLA Enterprise |
| ----------------- | ------------ | -------------- |
| A (senha mudou)   | self-service | 1h suporte     |
| B (mesma máquina) | 4h business  | 1h             |
| C (máquina nova)  | 8h business  | 4h             |
| D (outro usuário) | 4h business  | 2h             |

Comunicar cliente proativamente: "operação local da balança continua — apenas sincronia com ERP em pausa."

---

## Pós-recovery

1. Validar todos os conectores `STATUS = ONLINE` no dashboard
2. Disparar 1 ticket de teste por conector
3. Verificar webhook entrante
4. Reconciliação para checar consistência
5. Marcar incidente como resolvido em CRM
6. Atualizar runbook se cenário novo apareceu

---

## Quando escalar para Tech Lead

- DPAPI corrompido sem causa identificada
- Banco SQLite parcialmente corrompido
- Cliente tem > 5 conectores e tempo > SLA
- Cliente Enterprise com SLA contratual

---

## Referências

- ADR-004 — Credenciais via DPAPI (limitação documentada)
- ADR-012 — OAuth em desktop
- `../../DISASTER-RECOVERY.md` — DR geral do produto
- `../../integracao/008-runbook-suporte.md`
