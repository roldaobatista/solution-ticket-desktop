# Auditoria 6 Agentes - 2026-04-29

Projeto: `solution-ticket-desktop`

Base auditada:

- Branch: `main`
- Commit: `ab503ba fix: resolver achados de auditoria`
- Modo: read-only, exceto este relatorio
- Agentes: Backend/Dominio, Seguranca, Frontend/UX, Hardware/Balanca, Integracao ERP, Build/QA/Release

## Sumario executivo

A auditoria encontrou bloqueadores reais para producao em quatro frentes:

1. Segregacao multi-tenant/unidade ainda tem buracos em perfis, usuarios, balancas, tabelas comerciais e integracao ERP.
2. Fluxos operacionais centrais de pesagem, saida, romaneio, fatura e captura de peso tem inconsistencias que podem gerar peso/valor/status errado.
3. O modulo de integracao ERP esta com documentacao/ADR mais avancada que a implementacao: falta escopo por unidade/empresa, mapping real, inbox, anti-replay e API publica separada.
4. CI/release e empacotamento ainda nao validam o artefato desktop de ponta a ponta.

## Verificacoes executadas

Comandos executados pelo coordenador:

- `pnpm typecheck:all`: passou.
- `pnpm security:audit`: passou, silenciando 10 falsos positivos de Electron sem `Paths`.
- `pnpm lint:check`: retornou codigo 0, mas o backend emitiu 142 warnings.
- `pnpm --filter ./backend exec jest --runInBand`: 64 suites / 373 testes passaram.
- `pnpm --filter ./frontend exec jest --runInBand --watchAll=false`: 1 suite / 2 testes passaram.

Comandos reportados pelos agentes:

- Integracao: `pnpm --filter ./backend test -- integracao -- --runInBand`: 9 suites / 24 testes passaram.
- Balanca: `pnpm --filter ./backend exec jest src/balanca --runInBand`: 23 suites / 111 testes passaram.
- Balanca smoke: `backend/scripts/smoke-balanca.ts`: falhou em 3/13 parsers.
- Frontend: `pnpm exec tsc --noEmit --incremental false --pretty false` em `frontend`: passou.

## P0 - bloqueadores criticos

### 1. Bypass RBAC cross-tenant por perfis

Evidencia:

- `backend/src/perfis/perfis.controller.ts:30`: `findAll` aceita `tenantId` via query.
- `backend/src/users/users.service.ts:46`: `perfilIds` sao vinculados sem validar tenant do perfil.
- `backend/src/users/users.service.ts:139`: update substitui perfis sem validar tenant.
- `backend/src/auth/strategies/jwt.strategy.ts:56`: JWT agrega permissoes de todos os perfis vinculados.

Impacto: usuario de um tenant pode receber perfil/permissao de outro tenant se conhecer ou inferir IDs.

Recomendacao: remover `tenantId` de query publica, sempre usar o tenant do JWT, validar todos os `perfilIds` contra o tenant atual e reforcar filtro tambem na estrategia JWT.

### 2. Passagem aceita balanca de outro tenant/unidade

Evidencia:

- `backend/src/ticket/ticket.service.ts:325`: cria passagem com `balancaId: dto.balancaId`.
- Antes do create, o ticket e carregado por tenant, mas a balanca nao e validada contra `tenantId` e `ticket.unidadeId`.

Impacto: peso de uma balanca de outra unidade/tenant pode entrar no ticket errado, quebrando rastreabilidade metrologica.

Recomendacao: dentro da transacao, validar a balanca por `{ id, tenantId, unidadeId: ticket.unidadeId }` antes de criar a passagem.

### 3. Captura de peso estavel pode retornar leitura velha ou instavel

Evidencia:

- `backend/src/balanca/balanca-connection.service.ts:215`: retorna imediatamente `ultimaLeitura` se ela estiver marcada como estavel.
- `backend/src/balanca/balanca-connection.service.ts:218`: no timeout resolve `c.status.ultimaLeitura`, mesmo sem estabilidade.

Impacto: pode registrar peso de veiculo anterior ou peso ainda em movimento.

Recomendacao: exigir leitura nova apos inicio da captura, validar TTL de `ultimaLeituraEm` e retornar erro no timeout se nao houver estabilidade.

### 4. Saida nao encontra ticket gerado pela entrada

Evidencia:

- `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:41`: lista tickets com status `AGUARDANDO_PASSAGEM`.
- `backend/src/ticket/ticket.service.ts:321`: primeira passagem muda `ABERTO` para `EM_PESAGEM`.

Impacto: fluxo entrada -> saida fica travado para tickets recem-criados.

Recomendacao: alinhar UI com a state machine real ou ajustar a transicao backend para o status esperado pela tela.

### 5. Integracao ERP envia ticket para perfis errados

Evidencia:

- `backend/src/ticket/ticket.service.ts:592`: busca perfis por `{ tenantId, enabled: true }`.
- Ignora `empresaId`, `unidadeId`, `syncDirection` e entidades suportadas.

Impacto: ticket de uma unidade/empresa pode ser enviado ao ERP de outra, com PII e dados fiscais.

Recomendacao: filtrar perfil por empresa/unidade do ticket, direcao outbound/bidirectional e suporte a `weighing_ticket`.

### 6. CI E2E frontend/real esta estruturalmente quebrado

Evidencia:

- `.github/workflows/ci.yml:160`: job Playwright mock depende de build, mas nao baixa `frontend/.next`.
- `.github/workflows/ci.yml:206`: job real chama `backend start:prod`, mas nao baixa `backend/dist`.
- `frontend/playwright.config.ts:35`: usa `pnpm start`, que exige build previo.

Impacto: E2E tende a falhar por infraestrutura ou nao validar PRs de forma confiavel.

Recomendacao: baixar artefatos `build-outputs` nos jobs E2E ou buildar em cada job; falhar explicitamente se health nao subir.

## P1 - altas prioridades

### Seguranca e tenancy

- Senha criada/alterada por admin nao aplica politica e nao incrementa `tokenVersion`: `backend/src/users/users.service.ts:23`, `backend/src/users/users.service.ts:122`.
- Licenca usada pelo guard de ticket ignora fingerprint/tenant e valida principalmente por unidade: `backend/src/ticket/ticket-license-guard.ts:17`.
- Frontend faz logout apenas limpando storage, sem chamar `/auth/logout`: `frontend/src/stores/auth.store.ts:37`.
- `/licenca/status` e publico e retorna fingerprint/hashes/metadados sensiveis: `backend/src/licenca/licenca.controller.ts:39`.
- Mensagens de login distinguem estados de conta e ajudam enumeracao: `backend/src/auth/auth.service.ts:46`, `backend/src/auth/auth.service.ts:51`, `backend/src/auth/auth.service.ts:59`.
- `JWT_SECRET` fica em arquivo local e tambem deriva chave de criptografia: `electron/main.js:129`, `backend/src/common/crypto.util.ts:8`.

### Dominio operacional

- Desconto pode ser lancado depois de fechamento/romaneio/fatura sem recalcular ticket: `backend/src/ticket/passagem.service.ts:64`.
- `modoComercial=OBRIGATORIO` ainda fecha sem preco: `backend/src/ticket/ticket.service.ts:533`, `backend/src/ticket/ticket.service.ts:565`.
- Romaneio permite concorrencia/duplicidade e recalcula total apenas do lote atual: `backend/src/romaneio/romaneio.service.ts:117`, `backend/src/romaneio/romaneio.service.ts:120`.
- Fatura considera pagamentos pendentes para baixar e nao propaga status para romaneio/tickets: `backend/src/fatura/fatura.service.ts:113`, `backend/src/fatura/fatura.service.ts:136`.
- PF1 manual pode ser criado sem tara manual persistida e depois fica impossivel fechar: `backend/src/ticket/ticket.service.ts:71`, `backend/src/ticket/ticket-calculator.ts:31`.
- Tabelas comerciais aceitam FKs de outro tenant e snapshot busca preco sem `tenantId`: `backend/src/comercial/comercial.service.ts:30`, `backend/src/ticket/ticket.service.ts:534`.

### Frontend e contratos

- Unidade ativa nao existe de fato no login/me; header usa "Unidade Principal" hardcoded: `frontend/src/lib/api/auth.ts:17`, `backend/src/auth/auth.service.ts:106`, `frontend/src/components/layout/Header.tsx:19`.
- Preview/impressao via `iframe` nao autentica no backend protegido por JWT: `frontend/src/components/ticket/TicketPreview.tsx:66`, `backend/src/impressao/impressao.controller.ts:14`.
- Cadastros enviam payload `snake_case` para DTOs `camelCase` com `forbidNonWhitelisted`: `frontend/src/lib/api/cadastros.ts:55`, `backend/src/cadastros/dto/create-cliente.dto.ts:5`.
- Financeiro e romaneios usam contratos divergentes: `frontend/src/lib/api/financeiro.ts:30`, `frontend/src/lib/api/romaneios.ts:26`, `backend/src/fatura/dto/create-fatura.dto.ts:13`, `backend/src/romaneio/dto/create-romaneio.dto.ts:4`.
- Fluxo de entrada faz `createTicket` e depois `registrarPassagem` sem compensacao/erro operacional claro: `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:117`.

### Balanca, hardware e automacao

- Ajuste de leitura calcula fator decimal, mas schema guarda `Int` e parser usa divisor `> 1`; UI chama rota divergente: `frontend/src/components/balanca/AjusteLeituraSection.tsx:44`, `backend/src/prisma/schema.prisma:367`.
- Modbus TCP/RTU esta incompleto: normalizacao, porta serial exigida e parametros de registrador/unit/scale nao chegam ao adapter: `backend/src/balanca/balanca.service.ts:32`, `backend/src/balanca/balanca-connection.service.ts:81`.
- Conexao realtime tem janela para chamadas concorrentes antes de registrar no Map: `backend/src/balanca/balanca-connection.service.ts:76`.
- Parser AFTS aceita `kg|g|t|lb`, mas nao converte para kg: `backend/src/balanca/parsers/afts.parser.ts:21`.
- Automacao Modbus escreve uma coil por cor sem intertravamento/readback: `backend/src/automacao/modbus-automacao.adapter.ts:25`.

### Integracao ERP

- API publica separada e anti-replay prometidos em ADR nao existem na implementacao atual.
- Existe `IntegracaoInbox` no schema, mas falta service/processor/controller/relay: `backend/src/prisma/schema.prisma:1465`, `backend/src/integracao/integracao.module.ts:19`.
- Payload enviado ao ERP e objeto Prisma completo; mapping/payload remoto nao sao aplicados: `backend/src/ticket/ticket.service.ts:598`, `backend/src/integracao/connectors/generic-rest/generic-rest.connector.ts:75`.
- `outbox.service` faz `upsert` por idempotency key e pode mutar payload/correlation de evento existente: `backend/src/integracao/outbox/outbox.service.ts:57`.
- Erros de integracao persistem `errorMessage/lastError` sem scrub PII: `backend/src/integracao/logging/integration-log.service.ts:34`, `backend/src/integracao/outbox/outbox.service.ts:205`.

### Build, release e operacao

- Electron empacota `node_modules` pnpm com junctions/symlinks: `electron/package.json:53`, `electron/package.json:194`.
- Gate de code signing esta mal conectado; `sign.js` valida env, mas nao assina: `electron/package.json:287`, `electron/sign.js:48`.
- Release por tag nao roda lint/testes/E2E antes do instalador: `.github/workflows/release.yml:24`.
- ADR/DR promete RPO 1h, mas backup automatico e diario as 23h: `backend/src/backup/backup.service.ts:49`, `docs/adr/ADR-019-sqlite-backup-restore.md:37`.
- Overrides pnpm divergentes entre `pnpm-workspace.yaml`, `package.json` e lockfile.
- Driver CH340 empacotado com origem/data pendente e binarios sem cadeia de confianca fechada: `resources/drivers/CH340/manifest.json:6`.

## P2 - medias prioridades e lacunas

- `lint:check` backend permite warnings e o CI nao usa `--max-warnings 0` no backend.
- Frontend nao filtra menus/acoes por permissao, apesar do backend usar `@Roles`.
- Estado autenticado persiste e pode renderizar UI antes de validar `/auth/me`.
- `serial-terminal.service.ts` faz `require('serialport')` no topo e pode quebrar boot se binding nativo falhar.
- Smoke de balanca esta desalinhado com parsers atuais.
- `window.open` no Electron permite qualquer `http/https/mailto` sem allowlist.
- Script `scripts/security/revoke-all-tokens.ps1` nao revoga conectores reais com `-Execute`.
- E2E frontend atual engole falha de login e aponta rota `/dashboard` inexistente.
- Nao ha smoke do app empacotado validando backend, frontend, migrations, native modules e assinatura.

## Testes faltantes recomendados

1. Tenant/perfil: criar usuario com `perfilIds` de outro tenant deve falhar.
2. Ticket/passagem: `balancaId` de outra unidade/tenant deve falhar.
3. Pesagem: captura deve rejeitar leitura velha/instavel.
4. Fluxo entrada -> saida: ticket criado na entrada precisa aparecer corretamente na saida.
5. Comercial: `modoComercial=OBRIGATORIO` sem tabela vigente deve falhar.
6. Romaneio/fatura: concorrencia, pagamento pendente, baixa real e propagacao de status.
7. Integracao: enqueue por unidade/empresa, idempotencia com payload divergente, error scrubbing e mapping.
8. Frontend/API: contratos de cadastros, fatura, romaneio, impressao e unidade ativa.
9. CI/release: E2E com artefatos reais e smoke do `win-unpacked`.

## Ordem sugerida de correcao

1. Fechar tenancy/RBAC: perfis, usuarios, balanca da passagem, tabelas comerciais e integracao por unidade/empresa.
2. Fechar fluxo operacional minimo: captura de peso, entrada->saida, desconto, comercial obrigatorio, romaneio e fatura.
3. Alinhar contratos frontend/backend e unidade ativa.
4. Endurecer integracao ERP: idempotencia, mapping, masking, escopo, inbox/API publica se realmente entram no escopo comercial.
5. Corrigir CI/release para validar E2E e artefato desktop antes de publicar.
