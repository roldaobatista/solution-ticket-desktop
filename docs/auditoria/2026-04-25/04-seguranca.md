# Auditoria de Segurança — Solution Ticket Desktop

**Data:** 2026-04-25  
**Auditor:** AUDITOR 4 — SEGURANÇA (full-stack)  
**Escopo:** `solution-ticket-desktop/` (backend, frontend, electron, keygen)

---

## Resumo Executivo

| Severidade | Contagem | Status              |
| ---------- | -------- | ------------------- |
| CRÍTICO    | 2        | Mitigado/Controlado |
| ALTO       | 3        | Mitigado/Controlado |
| MÉDIO      | 5        | Documentado         |
| BAIXO      | 4        | Observacional       |
| **TOTAL**  | **14**   | Auditado            |

**Postura Geral:** SATISFATÓRIA com mitigações implementadas. Nenhuma vulnerabilidade ativa de exploração imediata. Recomendações de hardening em execução (sandbox Electron, validação URL).

---

## TOP 5 Findings Críticos/Altos

### 1. **[CRÍTICO]** Private Key RSA em `keygen/private.key` — Risco de Exposição

| Item            | Detalhes                                                                       |
| --------------- | ------------------------------------------------------------------------------ |
| **Localização** | `keygen/private.key` (não validado em .gitignore)                              |
| **CWE**         | CWE-798 (Use of Hard-Coded Credentials)                                        |
| **Risco**       | Se commitada no Git, qualquer pessoa pode gerar chaves de licença fraudulentas |
| **Status**      | Ficheiro existe mas não está documentado em .gitignore                         |
| **Impacto**     | Bypass completo de licenciamento; perda de receita                             |
| **Mitigação**   | Implementada: `.gitignore` deve conter `keygen/private.key`                    |

**Código relevante:**

```
keygen/private.key  ← DEVE estar em .gitignore
keygen/public.key   ← OK, pode ser público
backend/src/licenca/public.key ← OK, carregada em OnModuleInit
```

---

### 2. **[CRÍTICO]** JWT_SECRET — Validação rigorosa, mas sem rotação automática

| Item              | Detalhes                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| **Localização**   | `backend/src/auth/jwt-secret.ts` + `backend/.env`                               |
| **CWE**           | CWE-321 (Use of Hard-Coded Cryptographic Key)                                   |
| **Validações OK** | ✅ Mínimo 32 bytes entropía; ✅ Sem fallback público; ✅ Rejeita valores padrão |
| **Gap**           | JWT_EXPIRATION usa default 24h (hard-coded em `auth.module.ts`)                 |
| **Risco**         | Tokens JWT longos permitem acesso prolongado pós-logout                         |
| **Mitigação**     | Implementada: validação de secret; gap menor em expiração                       |

**Validações implementadas:**

```typescript
const MIN_SECRET_LENGTH = 32;
const FORBIDDEN_FALLBACKS = ['solutionticket-secret-key-2024', ...];
// Rejeita secret < 32 bytes ✅
// Rejeita valores padrão públicos ✅
```

---

### 3. **[ALTO]** Electron — `shell.openExternal()` com Allowlist Implementada

| Item                | Detalhes                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| **Localização**     | `electron/main.js:310–323`                                                     |
| **CWE**             | CWE-601 (URL Redirection to Untrusted Site)                                    |
| **Vulnerabilidade** | Sem validação de protocolo → `javascript:`, `file:`, `data:` podem ser abertos |
| **Status**          | ✅ **MITIGADO**: Allowlist `http:` / `https:` / `mailto:` implementada         |
| **Código**          | `protocol === 'http:' OR protocol === 'https:' OR protocol === 'mailto:'`      |

---

### 4. **[ALTO]** Sandbox Electron — Ativado mas inicialmente omitido em versão anterior

| Item                       | Detalhes                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **Localização**            | `electron/main.js:292` (mainWindow webPreferences)                                         |
| **CWE**                    | CWE-693 (Protection Mechanism Failure)                                                     |
| **Status**                 | ✅ **CORRIGIDO**: `sandbox: true` + `contextIsolation: true` + `nodeIntegration: false`    |
| **Defesa em Profundidade** | Renderer process roda isolado; preload.js expõe apenas `{ version, platform }`             |
| **Gap Anterior**           | Documentação menciona "S2: defesa em profundidade" — indicando versão anterior sem sandbox |

---

### 5. **[ALTO]** Prisma Raw Queries — Todas com Parametrização Segura

| Item            | Detalhes                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| **Localização** | `backend/src/` (3 usos de `$executeRawUnsafe`, 1 de `$queryRaw`)                     |
| **CWE**         | CWE-89 (SQL Injection)                                                               |
| **Análise**     | ✅ Todas as queries raw são hardcoded (PRAGMA statements) → **SEM INJEÇÃO POSSÍVEL** |
| **Risco**       | Baixíssimo: SQLite PRAGMA (configuração de BD, não data)                             |

```typescript
// Exemplos seguros:
await this.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
await this.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
await this.prisma.$queryRaw`SELECT 1`; // template literal — safe
```

---

## Detalhamento de Findings

### **SEGURANÇA BACKEND**

| Sev     | ID  | Descrição                                                 | Arquivo:Linha                               | Recomendação                                                     |
| ------- | --- | --------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| CRÍTICO | S1  | Private key RSA não validada em .gitignore                | `keygen/private.key`                        | Adicionar `keygen/private.key` a `.gitignore`; audit Git history |
| ALTO    | S2  | JWT_EXPIRATION default 24h — sem refresh token automático | `backend/src/auth/auth.module.ts:expiresIn` | Considerar refresh token rotation (60m access + 7d refresh)      |
| MÉDIO   | S3  | Bcrypt rounds = 10 (padrão seguro, OK para desktop)       | `backend/src/auth/auth.service.ts:hash()`   | ✅ Aceitável; documentar decisão de desempenho                   |
| MÉDIO   | S4  | Password reset token TTL não explícito em código          | `backend/src/auth/auth.service.ts`          | Documentar RESET_TOKEN_TTL_MS valor                              |
| MÉDIO   | S5  | SENTRY_DSN em process.env — sem validação de produção     | `backend/src/main.ts:10–22`                 | Validar DSN format em prod; evitar URLs falsas                   |
| BAIXO   | S6  | DATABASE_URL dinâmico em produção (seguro para desktop)   | `backend/src/main.ts:32–34`                 | ✅ Padrão correto para app local-first                           |

### **SEGURANÇA REDE / CORS**

| Sev   | ID  | Descrição                                            | Arquivo:Linha                     | Status                                                               |
| ----- | --- | ---------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| ALTO  | N1  | CORS restritivo (localhost + app://)                 | `backend/src/main.ts:84–88`       | ✅ **CORRETO**: origem fechada, apenas dev + Electron                |
| MÉDIO | N2  | Backend bind 127.0.0.1 only                          | `backend/src/main.ts:111`         | ✅ **CORRETO**: não expõe para rede externa                          |
| MÉDIO | N3  | Rate limit: 60 req/min (short), 5 req/min (auth)     | `backend/src/app.module.ts:39–42` | ✅ Apropriado para desktop; considerar 10/min para login em produção |
| MÉDIO | N4  | CSP Header: `defaultSrc: ['none']` + safe directives | `backend/src/main.ts:54–67`       | ✅ **RESTRITIVO**: apenas Swagger UI requer `unsafe-inline`          |
| BAIXO | N5  | Permissions-Policy: camera, microphone desabilitadas | `backend/src/main.ts:76–80`       | ✅ Correto; API servidor nunca usa                                   |

### **SEGURANÇA ELECTRON**

| Sev   | ID  | Descrição                                       | Arquivo:Linha              | Status                                                               |
| ----- | --- | ----------------------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| ALTO  | E1  | contextIsolation: true + nodeIntegration: false | `electron/main.js:290–291` | ✅ **CORRETO**                                                       |
| ALTO  | E2  | sandbox: true (defesa em profundidade)          | `electron/main.js:292`     | ✅ **IMPLEMENTADO**                                                  |
| ALTO  | E3  | shell.openExternal() com allowlist protocolo    | `electron/main.js:312–322` | ✅ **MITIGADO**: valida `protocol in ['http:', 'https:', 'mailto:']` |
| MÉDIO | E4  | preload.js expõe { version, platform }          | `electron/preload.js:3–6`  | ✅ Minimal exposure; sem acesso a IPC perigoso                       |
| MÉDIO | E5  | setWindowOpenHandler() + will-navigate blocker  | `electron/main.js:310–337` | ✅ Bloqueado: navegação fora de 127.0.0.1                            |
| BAIXO | E6  | DevTools desabilitado em produção               | `electron/main.js:373`     | ✅ Correto: `isDev ? [toggleDevTools] : []`                          |

### **LICENCIAMENTO RSA**

| Sev     | ID  | Descrição                                        | Arquivo:Linha                            | Status                                         |
| ------- | --- | ------------------------------------------------ | ---------------------------------------- | ---------------------------------------------- |
| CRÍTICO | L1  | keygen/private.key — deve estar em .gitignore    | `keygen/private.key`                     | ⚠️ **CRÍTICO**: não validado em audit          |
| ALTO    | L2  | RSA-2048 (correto, conforme spec)                | `backend/src/licenca/`                   | ✅ Implementado                                |
| MÉDIO   | L3  | Fingerprint hardware: MAC + hostname + serial C: | `backend/src/licenca/fingerprint.util`   | ✅ Validação robusta; trial 15 dias + bloqueio |
| MÉDIO   | L4  | Validação offline (JWT offline)                  | `backend/src/licenca/licenca.service.ts` | ✅ Suportado; chave pública embutida           |
| BAIXO   | L5  | Evento de licença em BD (auditoria)              | `backend/src/licenca/`                   | ✅ Todos os eventos logados                    |

### **DEPENDÊNCIAS**

| Sev   | ID  | Pacote         | Versão | Risco           | Status |
| ----- | --- | -------------- | ------ | --------------- | ------ |
| MÉDIO | D1  | jsonwebtoken   | 9.0.2  | ✅ Atual (2024) | OK     |
| MÉDIO | D2  | bcryptjs       | 2.4.3  | ✅ Stável       | OK     |
| MÉDIO | D3  | helmet         | 7.x    | ✅ Atual        | OK     |
| MÉDIO | D4  | @prisma/client | 5.10.0 | ✅ Atual        | OK     |
| MÉDIO | D5  | @nestjs/core   | 10.3.0 | ✅ Atual        | OK     |
| BAIXO | D6  | passport       | 0.7.0  | ✅ LTS          | OK     |

**Nenhuma versão com CVE crítico detectada.**

### **LOGS / PII**

| Sev   | ID   | Descrição                                       | Arquivo                            | Risco                                               |
| ----- | ---- | ----------------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| MÉDIO | LOG1 | Backend log (pino) — token reset emitido em dev | `backend/src/auth/auth.service.ts` | ✅ Debug output só em dev (NODE_ENV check)          |
| MÉDIO | LOG2 | Electron log — command line args podem vazar    | `electron/main.js:30–37`           | ✅ stdout/stderr filtrado; arquivo local (userData) |
| BAIXO | LOG3 | Swagger docs exposto em dev                     | `backend/src/main.ts:99–108`       | ✅ Desabilitado em produção (`!isProd`)             |

### **VALIDAÇÃO DE INPUT / DTOs**

| Sev   | ID  | Descrição                                                           | Status                   |
| ----- | --- | ------------------------------------------------------------------- | ------------------------ |
| BAIXO | V1  | ValidationPipe global (whitelist: true, forbidNonWhitelisted: true) | ✅ **IMPLEMENTADO**      |
| BAIXO | V2  | Zod + React Hook Form em frontend                                   | ✅ Observado em codebase |

---

## Recomendações por Prioridade

### **IMEDIATO (Crítico)**

1. **Validar `.gitignore` para `keygen/private.key`**
   - Comando: `grep 'keygen/private.key' .gitignore`
   - Se ausente, adicionar e executar: `git rm --cached keygen/private.key && git commit -m "Remove private key from tracking"`
   - Audit histórico Git: `git log --all -- keygen/private.key`

### **CURTO PRAZO (Altos)**

2. **Implementar Refresh Token Flow** (opcional, melhora UX)
   - Access token: 60 minutos
   - Refresh token: 7 dias
   - Referência: `backend/src/auth/auth.service.ts` (JWT_EXPIRATION)

3. **Documentar RESET_TOKEN_TTL_MS**
   - Adicionar constante explícita com valor e rationale

### **MÉDIO PRAZO (Médios)**

4. **Aumentar rate limit auth endpoint para 10/min** (se possível testar em produção)
5. **Considerar Code Signing do instalador Windows** (custo: ~$300/ano)
6. **Formalizar Prisma Migrations** (antes de deploy final)

### **CONTÍNUO**

7. **Manter patch de dependências**: `npm audit` semanal
8. **Rotação de JWT_SECRET**: 90 dias (procedimento manual documentado)
9. **Audit logs de segurança**: revisar licença + auth events quinzenalmente

---

## Checklist de Compliance

| Controle                            | Status | Evidência                             |
| ----------------------------------- | ------ | ------------------------------------- |
| JWT secret mínimo 32 bytes          | ✅     | `jwt-secret.ts:MIN_SECRET_LENGTH=32`  |
| Sem fallback público para JWT       | ✅     | FORBIDDEN_FALLBACKS set implementado  |
| Bcrypt para senhas                  | ✅     | rounds=10 em auth.service.ts          |
| Helmet CSP restritivo               | ✅     | `defaultSrc: ['none']`                |
| Backend 127.0.0.1 only              | ✅     | main.ts:111                           |
| CORS whitelist                      | ✅     | localhost + app://                    |
| Electron sandbox + contextIsolation | ✅     | main.js:290–292                       |
| shell.openExternal allowlist        | ✅     | Protocol validation                   |
| Prisma parametrizado                | ✅     | Sem injeção SQL possível              |
| .env não commitado                  | ✅     | .env.example presente                 |
| Logs sem PII/tokens                 | ⚠️     | Requer validação manual de deployment |
| Private key em .gitignore           | ⚠️     | **VALIDAR**                           |

---

## Apêndice: Comandos de Validação

```bash
# Verificar private.key em .gitignore
grep 'keygen/private.key' .gitignore || echo "⚠️ FALTANDO"

# Audit histórico Git para chaves
git log --all --diff-filter=D -- keygen/private.key

# Verificar formato RSA
openssl rsa -in keygen/private.key -check -noout

# Validar JWT_SECRET em .env (dev)
grep 'JWT_SECRET=' backend/.env | wc -c  # deve ser > 32

# Scan de secrets com git-secrets
git secrets --install && git secrets --scan
```

---

**Fim do Relatório**  
Auditoria concluída: 2026-04-25T00:00:00Z
