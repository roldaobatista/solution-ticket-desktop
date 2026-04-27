# Plano de Ação — Resolução dos Achados da Auditoria

> **Versão:** 1.0  
> **Data:** 2026-04-25  
> **Baseado em:** Auditoria estática do repositório `solution-ticket-desktop`  
> **Decisões-chave tomadas:**
>
> 1. Licenciamento fail-closed: sem licença/trial válido, operações de ticket são bloqueadas, mas acesso ao sistema é mantido.
> 2. Frontend mantém `snake_case` com mappers; backend mantém `camelCase`; contrato será formalizado via tipos compartilhados/OpenAPI.
> 3. Reset de senha via SMTP configurável (host, porta, usuário, senha, TLS) no backend e na UI de configurações.

---

## Sumário Executivo

Este plano organiza a resolução dos **30 achados (F-001 a F-030)** em **4 ondas de entrega (P0 → P3)**, priorizando bloqueadores de produção primeiro. Cada item contém: ação técnica, arquivos afetados, critérios de aceitação e testes necessários.

**Regra geral:** nenhuma correção de lógica de negócio (cálculo de peso, state machine, parsers de balança) será alterada sem validação humana posterior.

---

## 1. Estratégia Geral

1. **Fechar brechas de segurança/negócio primeiro** (licença, PII, concorrência).
2. **Estabilizar contrato frontend/backend** antes de ajustar telas (dependência lógica).
3. **Criar testes junto com a correção** (TDD para regras de guarda e serviços).
4. **Validar release assinado** antes de declarar P0 concluído.
5. **Migrações de banco:** apenas adições de colunas/índices; nenhuma quebra de schema existente.

---

## 2. Dependências entre Tarefas

```
[P0] F-001 (fail-closed) ──┬──→ [P0] F-002/F-003/F-004 (contrato UI/API) ──→ [P0] e2e licença
                           │
[P0] F-003 (payload) ──────┘

[P0] F-006 (release) não depende de código, apenas de CI/secrets.

[P1] F-013 (decremento atômico) depende de [P0] F-001 (mesmo guarda).
[P1] F-012 (contador ticket) pode rodar em paralelo com F-001.
[P1] F-005 (SMTP) depende de configuração operacional (secrets).
[P1] F-008 (PII) é transversal; pode ser feito em paralelo.

[P2] F-007 (empacotamento) depende de [P0] build estável.
[P2] F-014 (multi-tenant email) requer migração leve de índice.
```

---

## 3. Onda 1 — P0 (Bloqueadores de Produção)

**Objetivo:** resolver falhas que permitem operação sem licença, contratos quebrados e risco de release não-assinado.
**Prazo sugerido:** 1 sprint (5-7 dias de desenvolvimento).

---

### F-001 — Licenciamento fail-open no TicketLicenseGuard

**Severidade:** Crítica | **Tipo:** Confirmado

**Ação:**

1. Alterar `TicketLicenseGuard.canActivate()` para **fail-closed**:
   - Se não existe registro em `licencaInstalacao`: retornar `false` (bloquear operações de ticket/pesagem).
   - Se existe registro, mas status é `SEM_LICENCA` e trial não foi iniciado: `false`.
   - Se trial ativo (dentro de 15 dias e < 100 pesagens): `true`.
   - Se trial expirado (data ou pesagens esgotadas): `false`.
   - Se licença ativa e válida: `true`.
   - Se licença expirada/bloqueada/fingerprint divergente: `false`.
2. Garantir que o guarda **nunca** permita ação sem uma licença ou trial **válidos e explícitos**.
3. O retorno `false` deve levantar exceção `ForbiddenException` com mensagem clara (ex: `"Licença inválida ou trial expirado. Acesse Configurações > Licença para ativar."`).

**Arquivos:**

- `backend/src/ticket/ticket-license-guard.ts`
- `backend/src/licenca/licenca.service.ts` (métodos de verificação de status)

**Critérios de Aceitação:**

- [ ] Teste unitário: `sem licença → bloqueia`.
- [ ] Teste unitário: `trial ativo (15 dias, 50 pesagens restantes) → permite`.
- [ ] Teste unitário: `trial expirado por data → bloqueia`.
- [ ] Teste unitário: `trial esgotado por pesagens (0 restantes) → bloqueia`.
- [ ] Teste unitário: `licença ativa válida → permite`.
- [ ] Teste unitário: `licença expirada → bloqueia`.
- [ ] Teste e2e Playwright: usuário sem licença tenta criar ticket → vê erro na tela.

---

### F-002 — Tela de licença mascara SEM_LICENCA como TRIAL

**Severidade:** Alta | **Tipo:** Confirmado

**Ação:**

1. Remover fallback `|| 'TRIAL'` na leitura do status.
2. Criar estados visuais explícitos na página de licença:
   - `SEM_LICENCA`: mostrar botão "Iniciar Teste Grátis" (15 dias / 100 pesagens).
   - `TRIAL_ATIVO`: mostrar contador de dias e pesagens restantes.
   - `TRIAL_EXPIRADO`: mensagem de expiração + botão "Ativar Licença".
   - `ATIVA`: mostrar dados da licença.
   - `EXPIRADA`/`BLOQUEADA`: mensagem correspondente.
3. Criar `mapLicenca()` que converta resposta do backend (`camelCase`) para objeto tipado usado pela UI (`snake_case` ou tipagem interna).

**Arquivos:**

- `frontend/src/app/(authenticated)/licenca/page.tsx`
- `frontend/src/lib/api/licenca.ts`
- `frontend/src/lib/api/mappers.ts` (novo `mapLicenca`)

**Critérios de Aceitação:**

- [ ] UI reflete exatamente o `status` devolvido pelo backend.
- [ ] Estado `SEM_LICENCA` não mostra mais "TRIAL".
- [ ] Teste e2e: tela de licença mostra estado correto para cada status.

---

### F-003 — Payload incompatível na ativação/trial

**Severidade:** Alta | **Tipo:** Confirmado

**Ação:**

1. **Opção recomendada (menor churn):** no backend, derivar `tenantId` e `unidadeId` do contexto do usuário logado (JWT / tenant ativo na sessão), ao invés de exigir no body.
   - `POST /licenca/ativar` aceita apenas `{ chave }`; backend busca `tenantId` do `req.user.tenantId` e `unidadeId` da unidade selecionada no perfil ativo.
   - `POST /licenca/iniciar-trial` aceita apenas `{ unidadeId }` (ou nada, derivando do perfil ativo).
2. Se for impossível derivar do contexto, ajustar frontend para enviar todos os campos obrigatórios.
3. Documentar contrato em comentário JSDoc no DTO e no serviço frontend.

**Arquivos:**

- `backend/src/licenca/dto/ativar-licenca.dto.ts` (tornar campos opcionais ou remover)
- `backend/src/licenca/dto/iniciar-trial.dto.ts`
- `backend/src/licenca/licenca.controller.ts` (pegar do contexto)
- `frontend/src/lib/api/licenca.ts` (ajustar payload)

**Critérios de Aceitação:**

- [ ] Ativação funciona enviando apenas `{ chave }`.
- [ ] Trial funciona sem enviar `tenantId` manualmente.
- [ ] Teste unitário do controller: ativação com JWT válido e unidade selecionada.
- [ ] Teste e2e: fluxo completo de ativação com chave válida.

---

### F-004 — UI consome campos snake_case inexistentes no backend

**Severidade:** Alta | **Tipo:** Confirmado

**Ação:**

1. Consolidar resposta do backend em `LicencaService.verificarStatus()` para retornar objeto canônico com todos os campos necessários à UI:
   - `status`, `status_licenca` (alias interno se necessário)
   - `trial_expira_em` (mapear de `expira` quando em trial)
   - `pesagens_restantes_trial` (mapear de `pesagensRestantes`)
   - `dias_restantes` (mapear de `diasRestantes`)
   - `chave_validacao_hash` (mapear de `chave` ou hash da chave)
   - `ativado_em`
2. Criar tipo TypeScript `LicencaResponse` compartilhado (ou gerado) para evitar divergência.
3. Aplicar `mapLicenca()` no frontend para garantir consistência.

**Arquivos:**

- `backend/src/licenca/licenca.service.ts`
- `backend/src/licenca/types/licenca-status.type.ts` (criar)
- `frontend/src/lib/api/mappers.ts`
- `frontend/src/lib/api/licenca.ts`

**Critérios de Aceitação:**

- [ ] Todos os campos usados na página de licença existem no contrato.
- [ ] Teste de contrato: snapshot da resposta JSON vs. campos esperados pela UI.

---

### F-006 — Release Windows / Code Signing inconsistente

**Severidade:** Alta | **Tipo:** Risco provável

**Ação:**

1. Verificar se `electron-builder` realmente invoca `sign.js`.
   - Se não invocar: adicionar hook explícito no `electron/package.json`.
2. Criar workflow de **dry-run** de release em tag `test-release/v*`, sem publicar, para validar que:
   - `CI_RELEASE=true` funciona;
   - Secrets `WIN_CSC_LINK` e `WIN_CSC_KEY_PASSWORD` estão configurados;
   - O `.exe` gerado contém assinatura digital (validar via `signtool verify /pa`).
3. Se secrets não estiverem disponíveis: documentar no README que release será unsigned até configuração, e adicionar aviso no instalador.

**Arquivos:**

- `.github/workflows/release.yml`
- `electron/package.json`
- `electron/sign.js` (se existir)
- `docs/release.md` (atualizar)

**Critérios de Aceitação:**

- [ ] Dry-run de release passa em tag de teste.
- [ ] Artefato `.exe` é verificável (assinado ou documentado como unsigned).
- [ ] Documentação atualizada com pré-requisitos de assinatura.

---

## 4. Onda 2 — P1 (Curto Prazo)

**Objetivo:** corrigir observabilidade, auditoria, concorrência e funcionalidades quebradas.
**Prazo sugerido:** 1 sprint.

---

### F-005 — Reset de senha sem entrega (implementar SMTP)

**Severidade:** Alta | **Tipo:** Confirmado

**Ação:**

1. Criar módulo/configuração de SMTP:
   - Variáveis de ambiente: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`.
   - Tela de configurações administrativas para editar esses dados (armazenar criptografados no SQLite, não em plain text).
2. Implementar envio real de e-mail em `AuthService.requestPasswordReset()`.
   - Template HTML simples com link contendo `rawToken`.
   - Link aponta para `http://localhost:3000/resetar-senha?token=<rawToken>`.
   - TTL de 15 minutos para o token.
3. Adicionar validação `@IsEmail()` no DTO.
4. Remover TODOs relacionados.

**Arquivos:**

- `backend/src/auth/auth.service.ts`
- `backend/src/auth/dto/request-password-reset.dto.ts` (novo/renomear)
- `backend/src/config/smtp.config.ts` (novo)
- `frontend/src/app/(public)/esqueci-senha/page.tsx`
- `frontend/src/app/(public)/resetar-senha/page.tsx` (nova tela)

**Critérios de Aceitação:**

- [ ] Usuário solicita reset → recebe e-mail com link.
- [ ] Link expirado após 15 minutos.
- [ ] Token inválido mostra erro.
- [ ] Teste unitário: envio de e-mail mockado.
- [ ] Teste e2e: fluxo completo de reset de senha.

---

### F-008 — Scrubbing de PII incompleto

**Severidade:** Alta | **Tipo:** Confirmado

**Ação:**

1. Consolidar **um único scrubber** em `backend/src/common/pii.scrubber.ts`.
2. Lista denylist completa (case-insensitive, parcial):
   - `cpf`, `cnpj`, `rg`, `documento`, `email`, `telefone`, `celular`, `endereco`, `logradouro`, `bairro`, `cidade`, `cep`, `placa`, `cnh`, `razaoSocial`, `nomeFantasia`, `nomeCompleto`, `responsavel`, `contato`.
3. Substituir valores por `[REDACTED]` ou hash se necessário para auditoria.
4. Usar scrubber em:
   - `AuditInterceptor`
   - `LoggingInterceptor` / `main.ts`
   - Payloads enviados ao Sentry.
5. Adicionar testes com payloads reais de criação de ticket/cliente/motorista.

**Arquivos:**

- `backend/src/common/pii.scrubber.ts` (novo/unificado)
- `backend/src/common/pii.util.ts` (remover/deprecar)
- `backend/src/common/interceptors/audit.interceptor.ts`
- `backend/src/main.ts`
- `backend/src/sentry/sentry.config.ts` (se existir)

**Critérios de Aceitação:**

- [ ] Teste unitário: payload com CPF, e-mail, placa → todos redacted.
- [ ] Nenhuma lista duplicada de campos sensíveis no código.

---

### F-009 — Auditoria grava corpo completo da requisição

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. No `AuditInterceptor`, minimizar `estadoNovo`:
   - Em criações (`POST`): registrar apenas entidade, ID gerado e campos não-sensíveis (lista allowlist).
   - Em atualizações (`PUT/PATCH`): registrar apenas campos alterados (diff).
   - Em exclusões (`DELETE`): registrar ID e entidade.
2. Aplicar scrubber **antes** de persistir no banco.
3. Adicionar retenção/exportação: opção de exportar/deletar logs de auditoria antigos > 1 ano.

**Arquivos:**

- `backend/src/common/interceptors/audit.interceptor.ts`

**Critérios de Aceitação:**

- [ ] Audit não armazena mais `body` completo em `POST`;
- [ ] Apenas diff em `PUT/PATCH`.
- [ ] PII nunca aparece em `estadoNovo`.

---

### F-010 / F-011 — Traceparent inválido (frontend e backend)

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. **Frontend:** corrigir `client.ts`:
   - `generateTraceId()` deve retornar apenas o `trace-id` (32 hex chars).
   - Interceptor monta header como: `00-${traceId}-${parentId}-01` onde `parentId` é 16 hex chars gerado por `crypto.randomUUID().replace(/-/g, '').slice(0,16)`.
2. **Backend:** corrigir `TraceparentInterceptor`:
   - Fallback no formato `00-<32hex>-<16hex>-01`.
   - Validar com regex `/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i`.
3. Usar biblioteca W3C Trace Context se possível (ex: `@opentelemetry/core`).

**Arquivos:**

- `frontend/src/lib/api/client.ts`
- `backend/src/common/interceptors/traceparent.interceptor.ts`

**Critérios de Aceitação:**

- [ ] Teste unitário: header gerado passa em regex W3C.
- [ ] Sentry correlaciona requisições frontend → backend corretamente.

---

### F-012 — Concorrência no número de ticket

**Severidade:** Alta | **Tipo:** Risco provável

**Ação:**

1. Criar tabela/contador atômico `TicketContador` (`unidadeId`, `ano`, `ultimoNumero`).
2. Em `TicketService.create()`, usar transação com `UPDATE ... SET ultimoNumero = ultimoNumero + 1` (ou Prisma `increment`).
3. Formato mantido: `TK-${year}-${numero}`.
4. Implementar retry com backoff em caso de deadlock/conflito (máx. 3 tentativas).

**Arquivos:**

- `backend/src/prisma/schema.prisma` (nova tabela `TicketContador`)
- `backend/src/ticket/ticket.service.ts`
- Nova migration Prisma

**Critérios de Aceitação:**

- [ ] Teste de concorrência: 50 criações simultâneas de tickets → nenhum número duplicado.
- [ ] Teste unitário: rollback em caso de falha.

---

### F-013 — Decremento de trial não atômico

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. No `TicketLicenseGuard`, substituir `licenca.pesagensRestantesTrial - 1` por `LicencaService.decrementarPesagemTrial()`.
2. Método deve usar `prisma.licencaInstalacao.update({ where: { id }, data: { pesagensRestantesTrial: { decrement: 1 } } })`.
3. Executar dentro da mesma transação Prisma da operação de ticket (se possível via `PrismaService.$transaction`).

**Arquivos:**

- `backend/src/ticket/ticket-license-guard.ts`
- `backend/src/licenca/licenca.service.ts`

**Critérios de Aceitação:**

- [ ] Teste de concorrência: 10 fechamentos simultâneos em trial com 5 pesagens restantes → exatamente 5 sucedem, 5 falham com erro de licença.

---

### F-016 — Backup sem `PRAGMA integrity_check`

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. Em `BackupService.verify()`, após validar SHA-256:
   - Copiar arquivo de backup para temporário.
   - Abrir conexão SQLite read-only no temporário.
   - Executar `PRAGMA integrity_check;`
   - Retornar erro se resultado não for `ok`.
2. Remover comentário obsoleto.

**Arquivos:**

- `backend/src/backup/backup.service.ts`

**Critérios de Aceitação:**

- [ ] Teste unitário: backup corrompido (editado manualmente) → `verify()` falha mesmo com SHA correto.
- [ ] Teste unitário: backup válido → passa em SHA e integrity_check.

---

### F-021 — Threshold de cobertura baixo

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. Subir thresholds para backend:
   - statements: 25% → **50%**
   - branches: 27% → **45%**
   - functions: 22% → **45%**
   - lines: 26% → **50%**
2. Garantir que os módulos críticos (auth, licença, ticket, balança, backup) tenham cobertura mínima de **70%** cada.
3. Configurar no `backend/package.json`.

**Arquivos:**

- `backend/package.json` (jest thresholds)

**Critérios de Aceitação:**

- [ ] CI falha se thresholds não forem atingidos.
- [ ] Relatório de cobertura por módulo disponível no CI.

---

### F-022 — `pnpm ci` local incompleto

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. Criar script `ci:full` na raiz que executa:
   - format, lint, typecheck
   - backend tests + e2e
   - frontend unit tests
   - frontend e2e tests (mock + real)
   - `build:all`
   - `dist:win` dry-run (sem publicar)
2. Manter `ci` original para execução rápida.
3. Documentar diferença no README.

**Arquivos:**

- `package.json` (raiz)
- `README.md`

**Critérios de Aceitação:**

- [ ] `pnpm ci:full` passa localmente (ou falha igual ao CI remoto).

---

### F-027 — Seed cria trial com fingerprint fixo

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. No `seed.ts`, **não criar** `licencaInstalacao` com dados fictícios.
2. O onboarding da aplicação deve detectar ausência de licença e guiar usuário para iniciar trial real (que gera fingerprint real da máquina via `keygen` ou serviço de fingerprint).
3. Se necessário para dev, criar seed separado `seed:dev-license.ts` opcional.

**Arquivos:**

- `backend/src/prisma/seed.ts`

**Critérios de Aceitação:**

- [ ] Após `db:seed`, status de licença é `SEM_LICENCA` (não trial falso).
- [ ] Tela de licença oferece iniciar trial com fingerprint real.

---

## 5. Onda 3 — P2 (Médio Prazo)

**Objetivo:** otimização de empacotamento, formalização de contratos e melhorias estruturais.
**Prazo sugerido:** 1-2 sprints.

---

### F-007 — Instalador inclui node_modules inteiros

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. **Backend:** investigar bundling com `esbuild` / `ncc` para gerar `dist/main.js` único (ou com deps externas mínimas).
2. **Frontend:** usar `output: 'standalone'` do Next.js para reduzir dependências necessárias.
3. Copiar apenas `node_modules` necessários para produção (prune com `pnpm deploy --prod` ou similar).
4. Auditar dependências nativas (Prisma, serialport) para garantir que binaries chegam intactos.

**Arquivos:**

- `electron/package.json` (extraResources)
- `frontend/next.config.js`
- `backend/nest-cli.json`

**Critérios de Aceitação:**

- [ ] Tamanho do instalador reduzido em pelo menos 30%.
- [ ] App empacotado inicia corretamente sem `node_modules` completos.

---

### F-014 — Email único global (não por tenant)

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. Em `schema.prisma`, alterar `Usuario`:
   - Remover `@unique` de `email`.
   - Adicionar `@@unique([tenantId, email])`.
2. Criar migration.
3. Ajustar `AuthService` e `UsuarioService` para tratar `email` no escopo do tenant.
4. Normalizar e-mail (lowercase/trim) antes de salvar/consultar.

**Arquivos:**

- `backend/src/prisma/schema.prisma`
- `backend/src/auth/auth.service.ts`
- `backend/src/usuario/usuario.service.ts`
- Nova migration

**Critérios de Aceitação:**

- [ ] Mesmo e-mail pode existir em tenants diferentes.
- [ ] Dentro do mesmo tenant, e-mail continua único.
- [ ] Teste de integração: criação de usuário com e-mail duplicado em tenants distintos funciona.

---

### F-015 — Dados volumosos (fotos/assinaturas) no SQLite

**Severidade:** Média | **Tipo:** Risco provável

**Ação:**

1. Criar diretório de storage versionado: `<userData>/storage/<entity>/<id>.<ext>`.
2. No banco, armazenar apenas: `caminhoArquivo`, `hashSha256`, `tamanhoBytes`, `mimeType`.
3. Migração de dados existentes: exportar blobs para arquivos, popular metadados, remover colunas blob (em migration posterior, após validação).
4. Compressão opcional de imagens no upload.

**Arquivos:**

- `backend/src/prisma/schema.prisma` (novos campos, deprecar blob)
- `backend/src/storage/storage.service.ts` (novo)
- Módulos de ticket/cadastros que armazenam imagens

**Critérios de Aceitação:**

- [ ] Banco não cresce desproporcionalmente com assinaturas/fotos.
- [ ] Backup/restore funcionam com arquivos externos (copiar pasta `storage`).

---

### F-017 — `will-navigate` permite qualquer porta em 127.0.0.1

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. Restringir `will-navigate` para origem exata: `http://127.0.0.1:3000` e, se necessário, `http://localhost:3000`.
2. Rejeitar navegação para outras portas ou protocolos.

**Arquivos:**

- `electron/main.js`

**Critérios de Aceitação:**

- [ ] Navegação para `http://127.0.0.1:3001` é bloqueada.
- [ ] Navegação para `http://127.0.0.1:3000` é permitida.

---

### F-019 — JWT em sessionStorage (XSS)

**Severidade:** Média | **Tipo:** Risco provável

**Ação:**

1. Manter token curto (15 min) e refresh token longo (7 dias) em `localStorage`? **Não**, ainda exposto.
2. **Melhor prática para Electron local:** manter token em memória (Zustand/React state), persistir apenas refresh token em localStorage criptografado com machine-key (usando Electron `safeStorage`).
3. Se for muito complexo para curto prazo:
   - Garantir CSP forte.
   - Eliminar todos `dangerouslySetInnerHTML` e inline scripts.
   - Adicionar header `X-Content-Type-Options: nosniff`.

**Arquivos:**

- `frontend/src/lib/api/client.ts`
- `frontend/src/stores/auth.store.ts`
- `electron/main.js` (safeStorage, IPC seguro)

**Critérios de Aceitação:**

- [ ] Token de acesso não fica em `sessionStorage` (ou está protegido por `safeStorage`).
- [ ] XSS simulado não consegue extrair token válido.

---

### F-028 — Tolerância de estabilidade hardcoded

**Severidade:** Média | **Tipo:** Risco provável

**Ação:**

1. Adicionar campos na entidade `Balanca`/`Indicador`:
   - `toleranciaEstavel` (kg, default 2)
   - `janelaEstavel` (amostras, default 5)
2. Usar esses valores no `BalancaConnectionService` ao invés de constantes.
3. Auditar alteração desses valores (log de configuração).

**Arquivos:**

- `backend/src/prisma/schema.prisma`
- `backend/src/balanca/balanca-connection.service.ts`
- Tela de cadastro de balança (frontend)
- Nova migration

**Critérios de Aceitação:**

- [ ] Valores configuráveis por balança.
- [ ] Default mantém comportamento atual (2kg / 5 amostras).

---

### F-029 — Licença vitalícia e falta de revogação

**Severidade:** Média | **Tipo:** Confirmado

**Ação:**

1. Definir política comercial:
   - Validade mínima obrigatória (ex: 365 dias); licença vitalícia apenas sob exceção documentada.
2. Implementar **Certificate Revocation List (CRL) offline**:
   - Arquivo `revoked.keys.json` assinado digitalmente com chave privada do fabricante.
   - `keygen` e `LicencaService` verificam se `jti` ou fingerprint consta na lista revogada.
3. Rotação periódica de public key (anual).

**Arquivos:**

- `keygen/README.md` (atualizar política)
- `backend/src/licenca/licenca.service.ts` (verificação CRL)
- `keygen/revoke.ts` (novo script)

**Critérios de Aceitação:**

- [ ] Chave revogada é rejeitada mesmo com JWT válido.
- [ ] Documento de política comercial aprovado.

---

## 6. Onda 4 — P3 (Longo Prazo / Melhorias)

**Objetivo:** refinamentos, testes avançados e observabilidade operacional.

---

### F-018 — `window.open` sem allowlist de domínio

**Severidade:** Baixa | **Tipo:** Confirmado

**Ação:**

1. Em `setWindowOpenHandler`, validar hostname contra allowlist:
   - `suporte.solutionticket.com.br`
   - `docs.solutionticket.com.br`
   - `mailto:` permitido sem restrição (já é seguro).
2. Para URLs não listadas, exibir diálogo de confirmação ao usuário.

**Arquivos:**

- `electron/main.js`

---

### F-020 — Token SSE em query parameter

**Severidade:** Baixa | **Tipo:** Risco provável

**Ação:**

1. Manter token SSE curto (60s) — já implementado.
2. Garantir que `access_token` em query seja redigido em todos os logs:
   - Scrubber deve detectar `access_token=<valor>` e substituir por `[REDACTED]`.
3. Documentar que SSE usa query por limitação do `EventSource`; futuramente migrar para `fetch` com streaming se necessário.

**Arquivos:**

- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/common/pii.scrubber.ts`

---

### F-023 / F-024 — Dependências desalinhadas

**Severidade:** Baixa | **Tipo:** Risco provável

**Ação:**

1. Alinhar `jest` e `jest-environment-jsdom` para mesma major version (29 ou 30).
2. Verificar se `multer` 2.x já inclui tipos; se sim, remover `@types/multer`.

**Arquivos:**

- `frontend/package.json`
- `backend/package.json`

---

### F-025 — DTO de reset sem validação de e-mail

**Severidade:** Baixa | **Tipo:** Confirmado

**Ação:**

1. Adicionar `@IsEmail()` e `@NormalizeEmail()` (ou trim/lowercase manual) no DTO.

**Arquivos:**

- `backend/src/auth/dto/request-password-reset.dto.ts`

---

### F-026 — `enableImplicitConversion` global

**Severidade:** Baixa | **Tipo:** Risco provável

**Ação:**

1. Revisar DTOs críticos (tickets, pesagens, licença, pagamentos) para usar `@Type(() => Number)` / `@Transform()` explícitos.
2. Criar testes de entrada inválida para DTOs críticos (ex: string em campo numérico deve falhar, não converter silenciosamente).

**Arquivos:**

- DTOs críticos em `backend/src/*/dto/`
- `backend/src/main.ts` (manter global, mas endurecer DTOs)

---

### F-030 — Health check de disco em `/`

**Severidade:** Baixa | **Tipo:** Hipótese

**Ação:**

1. Usar `app.getPath('userData')` (ou `process.env.DATABASE_PATH`) como `path` do disk check.
2. Validar em Windows real se caminho está correto.

**Arquivos:**

- `backend/src/health/health.controller.ts`

---

## 7. Testes Estratégicos Adicionais

### E2E Mínimos (Playwright)

1. Login → seleção de unidade.
2. **Sem licença:** tentar criar ticket → erro.
3. **Iniciar trial:** contador de dias/pesagens visível.
4. **Criar ticket** durante trial.
5. **Fechar ticket** → trial decrementa.
6. **Ativar licença** com chave válida.
7. **Backup manual** → sucesso.
8. **Tela de licença** mostra status correto em cada etapa.

### Teste de Concorrência (carga local)

- Script `artillery` ou `autocannon` local:
  - 50x `POST /tickets` simultâneos.
  - 10x fechamentos simultâneos com trial esgotado.
- Verificar unicidade de números e consistência de pesagens restantes.

### Smoke do App Empacotado

- [ ] Migrations aplicadas automaticamente.
- [ ] Backend sobe em `127.0.0.1:3001`.
- [ ] Frontend carrega em `127.0.0.1:3000`.
- [ ] Health check responde `200`.
- [ ] Banco criado em `userData`.
- [ ] Logs rotacionados em `userData/logs`.
- [ ] CSP ativa (verificar headers no devtools do Electron).

---

## 8. Checklist de Entrega por Onda

### P0 — Checklist

- [ ] F-001: `TicketLicenseGuard` fail-closed + testes.
- [ ] F-002: UI mostra `SEM_LICENCA` corretamente.
- [ ] F-003: Payload de ativação/trial alinhado.
- [ ] F-004: Mapper `mapLicenca` criado e testado.
- [ ] F-006: Release dry-run validado (assinado ou documentado).
- [ ] e2e mínimo de licença/ticket passando no CI.

### P1 — Checklist

- [ ] F-005: SMTP configurável + reset funcional.
- [ ] F-008: Scrubber único + testes de PII.
- [ ] F-009: Audit sem payload completo.
- [ ] F-010/F-011: Traceparent W3C válido.
- [ ] F-012: Contador atômico de ticket + teste de concorrência.
- [ ] F-013: Decremento atômico de trial.
- [ ] F-016: `integrity_check` no backup.
- [ ] F-021: Thresholds de cobertura ≥ 50%.
- [ ] F-022: `ci:full` criado.
- [ ] F-027: Seed sem trial falso.

### P2 — Checklist

- [ ] F-007: Instalador reduzido (standalone/prune).
- [ ] F-014: Email único por tenant.
- [ ] F-015: Fotos/assinaturas em storage externo.
- [ ] F-017: `will-navigate` restrito à porta 3000.
- [ ] F-019: Token protegido (safeStorage ou memória).
- [ ] F-028: Tolerância configurável por balança.
- [ ] F-029: CRL offline implementada.

### P3 — Checklist

- [ ] F-018: Allowlist `window.open`.
- [ ] F-020: Redaction de `access_token` em logs.
- [ ] F-023/F-024: Dependências alinhadas.
- [ ] F-025: `@IsEmail()` no DTO.
- [ ] F-026: Testes de entradas inválidas nos DTOs críticos.
- [ ] F-030: Health check de disco no path correto.

---

## 9. O que NÃO Alterar sem Validação Humana

Conforme auditoria original, os itens abaixo requerem aprovação de negócio ou especialista de domínio antes de qualquer modificação:

- Semântica de licenciamento e política `SEM_LICENCA` vs trial automático _(resolvido: trial manual com acesso ao sistema)_.
- Regras de cálculo de peso, tara, desconto (`TicketCalculator`).
- Transições da `TicketStateMachine`.
- Parsers e adapters de balança (protocolos de fabricantes).
- Processo completo de backup/restore (estratégia de retenção).
- Chaves públicas/privadas do `keygen` e algoritmo de fingerprint.
- Fluxo de auto-update do Electron.
- Campos obrigatórios de auditoria para compliance fiscal/operacional.

---

## 10. Perguntas Pendentes (para refinamento futuro)

1. ~~SEM_LICENCA deve bloquear ou iniciar trial?~~ **Resolvido: bloqueia ticket, permite acesso ao sistema, oferece trial manual.**
2. ~~`tenantId` de licença: JWT, body ou unidade ativa?~~ **Resolvido: derivar do contexto do usuário logado.**
3. ~~Frontend camelCase ou snake_case?~~ **Resolvido: manter snake_case com mappers + contrato formal.**
4. Licenças vitalícias são aceitáveis? → Decisão comercial necessária para P2.
5. Existe exigência de revogação offline formal? → Decisão comercial/legal para P2.
6. ~~Canal de reset de senha?~~ **Resolvido: SMTP configurável.**
7. O sistema será sempre single-user local ou haverá acesso por rede? → Afeta arquitetura futura.
8. Qual tamanho esperado do banco em produção? → Afeta estratégia de storage (F-015).
9. Assinaturas/fotos devem ficar no SQLite ou em arquivos? → **Recomendado: arquivos (F-015).**
10. O instalador precisa obrigatoriamente ser assinado? → **Sim, mas documentar se secrets não disponíveis (F-006).**

---

## 11. Resumo Visual do Plano

```
Semana 1-2 (P0):
  ├─ TicketLicenseGuard fail-closed [F-001]
  ├─ Contrato licença UI/API [F-002, F-003, F-004]
  ├─ Testes e2e licença/ticket
  └─ Dry-run release assinado [F-006]

Semana 3-4 (P1):
  ├─ SMTP / reset senha [F-005]
  ├─ Traceparent fix [F-010, F-011]
  ├─ PII scrubber único [F-008]
  ├─ Audit minimizado [F-009]
  ├─ Contador ticket atômico [F-012]
  ├─ Decremento trial atômico [F-013]
  ├─ Backup integrity_check [F-016]
  ├─ Cobertura ≥ 50% [F-021]
  └─ ci:full [F-022]

Semana 5-6 (P2):
  ├─ Empacotamento otimizado [F-007]
  ├─ Email por tenant [F-014]
  ├─ Storage de arquivos [F-015]
  ├─ will-navigate restrito [F-017]
  ├─ JWT safeStorage [F-019]
  ├─ Tolerância configurável [F-028]
  └─ CRL offline [F-029]

Semana 7+ (P3):
  └─ Refinamentos menores [F-018, F-020, F-023, F-024, F-025, F-026, F-030]
```

---

> **Próximo passo imediato:** aguardar aprovação deste plano e priorização de recursos para iniciar a execução da Onda P0.
