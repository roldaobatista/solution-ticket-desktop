# Auditoria profunda consolidada - 5 auditores - 2026-04-29

Projeto: `solution-ticket-desktop`

Modo: auditoria de leitura do codigo, docs e pipeline, com execucao de verificacoes locais. A unica alteracao feita foi a criacao deste relatorio.

Base local:

- Branch: `main`
- Commit: `aecdcea fix: resolver achados da auditoria`
- Data/hora local: 2026-04-29

## Auditores

1. Operacao/UX: fluxo do operador, pesagem, captura de peso, produtividade e recuperacao de erro.
2. Negocio/Produto: aderencia ao mercado, promessa comercial, ERP, fiscal, multiunidade e valor para ICP brasileiro.
3. Balanca/Hardware: cadastro, serial, TCP/Ethernet, Modbus, diagnostico, calibracao e campo.
4. Seguranca/Compliance: RBAC, tenant, LGPD, auditoria, licenca, Electron, API local e supply chain.
5. Arquitetura/Confiabilidade: testes, dados, migrations, backup/restore, deploy desktop e observabilidade.

## Verificacoes executadas

- `pnpm typecheck:all`: passou.
- `pnpm --filter ./backend exec jest --runInBand`: passou, 69 suites / 421 testes.
- `pnpm --filter ./frontend exec jest --runInBand --watchAll=false`: passou, 1 suite / 2 testes.
- `pnpm lint:check`: passou.
- `pnpm security:audit`: passou, com 10 falsos positivos de workspace Electron silenciados pelo script.
- `pnpm --filter ./backend smoke:balanca`: passou, 13/13 parsers OK.
- `pnpm --filter ./backend test:e2e`: passou, 6 suites / 37 testes.

Observacao: os comandos objetivos estao verdes; os riscos abaixo sao de comportamento, produto, seguranca operacional e aderencia de contrato, nao de compilacao.

## Sumario executivo

O projeto esta tecnicamente em estado melhor do que auditorias anteriores: typecheck, lint, testes unitarios, E2E backend, auditoria de seguranca high-level e smoke dos parsers passaram. A base de dominio e hardware e boa.

Os riscos mais importantes agora se concentram em cinco frentes:

1. Operacao de pesagem ainda pode usar leitura velha, contrato de captura quebrado e sequencias parciais de fechamento.
2. Integracao ERP/fiscal e prometida alem do que existe no produto atual.
3. Algumas rotas sensiveis ainda estao abertas para qualquer autenticado ou sem tenant suficiente.
4. Backup/DR e auditoria criptografica ainda nao fecham a promessa de evidencia fiscal.
5. Contratos frontend/backend seguem manuais e ja mostram divergencias em pontos centrais.

## P0 - Bloqueador de negocio/produto

### P0.1 - Promessa comercial de ERP nativo esta a frente do produto

Impacto: risco alto de venda desalinhada, churn e disputa contratual, especialmente com Protheus, SAP, Sankhya e cenarios fiscais.

Evidencias:

- `docs/comercial/EMAIL-TEMPLATES.md:14` promete Protheus em dias e lancamento em segundos.
- `docs/comercial/MATRIZ-MATURIDADE-INTEGRACOES.md:4` ja alerta que conectores nativos sao roadmap e nao devem ser vendidos como prontos.
- `backend/src/integracao/connectors/connector-registry.service.ts:11` registra somente `mock` e `generic-rest`.
- `frontend/src/app/(authenticated)/config/integracoes/page.tsx:23` nao oferece tela real de perfil ERP, credenciais, outbox, teste de conexao ou status.

Recomendacao: travar material comercial em "REST generico + projeto dedicado sob aceite" ate haver conector homologado. Separar docs de roadmap/spec futura de docs GA.

## P1 - Alta prioridade

### P1.1 - Captura F1/endpoint `capturar` tem contrato incompativel e permissao errada

Impacto: operador aperta F1 esperando capturar peso, mas a UI espera `LeituraPeso` enquanto o backend retorna `{ leitura, estavel }`. Alem disso, a captura operacional exige `CONFIG_GERENCIAR`, forçando permissao administrativa para pesar.

Evidencias:

- `frontend/src/lib/api/balanca.ts:122` tipa `capturarPeso` como `Promise<LeituraPeso>`.
- `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:190` le `leitura.peso`.
- `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:123` le `leitura.peso`.
- `backend/src/balanca/balanca.controller.ts:124` usa `@Roles(Permissao.CONFIG_GERENCIAR)`.
- `backend/src/balanca/balanca.controller.ts:132` retorna `{ leitura, estavel: leitura.estavel }`.

Recomendacao: retornar `LeituraPeso` direto ou mapear `res.data.leitura` no client. Criar permissao operacional separada para captura, sem liberar configuracao.

### P1.2 - Leitura estavel antiga pode continuar habilitando salvamento apos queda

Impacto: operador pode registrar peso oficial com leitura antiga se a SSE/status cair depois de uma leitura estavel.

Evidencias:

- `frontend/src/components/balanca/PesoRealtime.tsx:84` marca erro de SSE, mas nao zera a leitura nem chama `onPesoChange(0, false)`.
- `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:176` habilita salvar com `pesoAtual > 0 && estavel`.
- `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:106` usa a mesma logica.

Recomendacao: invalidar leitura ao sair de online, exigir TTL curto de leitura estavel e mostrar "leitura expirada".

### P1.3 - Fechamento operacional e feito por sequencia parcial de chamadas

Impacto: falha entre registrar passagem, adicionar desconto e fechar ticket pode deixar ticket em estado ambiguo; nova tentativa pode duplicar tara/desconto/passagem.

Evidencias:

- `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:123` cria ticket, registra passagem e fecha 1PF em chamadas separadas.
- `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:78` registra passagem, adiciona desconto e fecha em sequencia.

Recomendacao: criar endpoint transacional de "finalizar pesagem" com chave idempotente por terminal/operacao.

### P1.4 - Edicao de balanca pela UI pode falhar por DTO/whitelist

Impacto: PATCH da tela inclui campos nao aceitos pelo DTO de update, e o backend usa `forbidNonWhitelisted`; edicao pode retornar 400.

Evidencias:

- `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx:211` monta payload com `empresaId`, `unidadeId` e `indicadorId`.
- `backend/src/balanca/dto/update-balanca.dto.ts:4` nao declara esses campos.
- `backend/src/main.ts:114` aplica `ValidationPipe` com `forbidNonWhitelisted`.

Recomendacao: incluir campos editaveis no DTO com validacao de posse, ou remover campos imutaveis do PATCH.

### P1.5 - Paridade serial `E/O` se perde nos adapters

Impacto: equipamentos 7E2/7O1 podem abrir como `none`, causando leitura inexistente ou lixo serial em campo.

Evidencias:

- `backend/src/balanca/config-resolver.ts:100` resolve paridade como `E/O/N`.
- `backend/src/balanca/adapters/serial.adapter.ts:37` mapeia apenas `even/odd`.
- `backend/src/balanca/adapters/modbus.adapter.ts:37` repete o problema.

Recomendacao: aceitar `N/E/O` e `none/even/odd`, com testes para 7E2 e 8O1.

### P1.6 - `indicadorId` da balanca nao e validado por tenant

Impacto: uma balanca pode apontar para indicador de outro tenant, herdando parser/configuracao indevida.

Evidencias:

- `backend/src/balanca/balanca.service.ts:18` valida empresa/unidade, mas nao indicador.
- `backend/src/balanca/dto/create-balanca.dto.ts:92` aceita `indicadorId`.

Recomendacao: validar `indicadorPesagem.findFirst({ id, tenantId })` no create/update.

### P1.7 - Relatorio `passagens-por-balanca` ignora tenant

Impacto: sem `unidadeId`, o relatorio pode agregar passagens de todos os tenants.

Evidencias:

- `backend/src/relatorios/relatorios.controller.ts:215` passa `tenantId`.
- `backend/src/relatorios/relatorios.service.ts:696` recebe `_tenantId` e nao usa.
- `backend/src/relatorios/relatorios.service.ts:717` busca balancas sem tenant quando nao ha unidade.

Recomendacao: aplicar tenant no `where`, validar unidade contra tenant e adicionar teste cross-tenant.

### P1.8 - Relatorios com PII nao exigem permissao de relatorio

Impacto: qualquer usuario autenticado pode exportar movimento, canceladas, alteradas e XLSX/PDF com placa, cliente, motorista e dados operacionais.

Evidencias:

- `backend/src/relatorios/relatorios.controller.ts:21` usa apenas `JwtAuthGuard`.
- Nao ha `@Roles(Permissao.RELATORIO_VISUALIZAR)` nos endpoints do controller.

Recomendacao: aplicar permissao de relatorio em todos os endpoints e testar perfil sem acesso.

### P1.9 - APIs de diagnostico de balanca permitem scan/captura para qualquer autenticado

Impacto: usuario comum consegue varrer rede local e abrir conexoes TCP/serial arbitrarias via API.

Evidencias:

- `backend/src/balanca/presets.controller.ts:13` usa apenas `JwtAuthGuard`.
- `backend/src/balanca/presets.controller.ts:59` expoe `discover`.
- `backend/src/balanca/presets.controller.ts:84` expoe `capture-raw`.

Recomendacao: exigir `CONFIG_GERENCIAR`, restringir CIDR/portas, auditar cada scan e bloquear destinos perigosos.

### P1.10 - Diagnostico/logs expoem metadados sensiveis a qualquer autenticado

Impacto: caminhos locais, fingerprint e logs podem vazar dados operacionais e facilitar abuso.

Evidencias:

- `backend/src/utilitarios/utilitarios.controller.ts:18` expoe diagnostico sem roles.
- `backend/src/utilitarios/utilitarios.controller.ts:24` expoe logs recentes sem roles.

Recomendacao: restringir a suporte/configuracao e redigir caminhos, fingerprint e linhas de log antes de retornar.

### P1.11 - Backup/restore nao cobre evidencias fisicas fora do SQLite

Impacto: restore pode devolver tickets sem fotos, anexos e assinaturas, quebrando evidencia fiscal/auditavel.

Evidencias:

- `backend/src/backup/backup.service.ts:91` cria backup apenas do banco SQLite.
- `backend/src/backup/backup.service.ts:222` restaura apenas o `.db`.
- Fotos/anexos/assinaturas sao armazenados como arquivos externos.

Recomendacao: criar pacote versionado com SQLite, fotos, anexos, assinaturas e manifesto SHA-256.

### P1.12 - DR prometido nao bate com a implementacao atual

Impacto: RPO real e diario/manual; posto fechado antes das 23h pode ficar sem backup recente.

Evidencias:

- `docs/adr/ADR-019-sqlite-backup-restore.md:37` fala em backup horario/cloud/drill.
- `backend/src/backup/backup.service.ts:52` agenda somente `0 23 * * *`.
- `docs/DISASTER-RECOVERY.md:60` reconhece risco se o app estiver fechado no horario.

Recomendacao: implementar backup horario, backup no shutdown, metrica de idade do ultimo backup e drill automatizado, ou rebaixar a promessa.

### P1.13 - Auditoria/hash chain nao e atomica com mutacoes criticas

Impacto: mutacao pode ocorrer sem trilha duravel, ou cadeia pode quebrar sob concorrencia.

Evidencias:

- `backend/src/common/interceptors/audit.interceptor.ts:30` audita depois da resposta.
- `backend/src/common/interceptors/audit.interceptor.ts:76` apenas loga falha.
- `backend/src/auditoria/auditoria.service.ts:56` busca ultimo hash e cria o proximo sem lock explicito.
- `backend/src/integracao/logging/integration-log.service.ts:52` repete o padrao.

Recomendacao: auditar dentro das transacoes dos fluxos criticos ou serializar a cadeia por tenant com teste de concorrencia.

### P1.14 - Multiunidade existe no discurso, mas a unidade ativa e automatica

Impacto: cooperativas/filiais podem operar na unidade errada, afetando licenca, numeracao, relatorios e pesagem.

Evidencias:

- `docs/comercial/PLANO-COMERCIAL.md:108` vende multiempresa/multiunidade.
- `backend/src/auth/auth.service.ts:124` escolhe a primeira unidade ativa por `findFirst`.
- `frontend/src/components/layout/Header.tsx:12` apenas exibe a unidade.

Recomendacao: implementar seletor global de unidade pos-login, persistido por sessao e auditado.

### P1.15 - Financeiro/faturas divergem entre frontend e backend

Impacto: usuario pode acreditar que cancelou/baixou fatura enquanto o backend modela outro estado.

Evidencias:

- `backend/src/fatura/fatura.service.ts:11` usa `ABERTA/PARCIAL/BAIXADA`.
- `frontend/src/app/(authenticated)/financeiro/page.tsx:188` filtra `PAGA/PARCIALMENTE_PAGA/CANCELADA`.
- `frontend/src/lib/api/financeiro.ts:62` tenta cancelar via `status: CANCELADA`.
- `backend/src/fatura/dto/update-fatura.dto.ts:4` nao modela cancelamento.

Recomendacao: unificar vocabulario e criar fluxo formal de cancelamento/estorno com motivo e auditoria.

### P1.16 - Rastreabilidade NF-e/CT-e ainda e stub

Impacto: a promessa de conciliacao fiscal de 5 anos nao se sustenta sem vinculo persistente entre XML, ticket, romaneio, fatura e ERP.

Evidencias:

- `docs/comercial/marketing/WHITEPAPER-CONFIABILIDADE-FISCAL.md:183` promete rastreabilidade fiscal.
- `backend/src/utilitarios/documentos.service.ts:132` implementa `vincularTicket` como stub.

Recomendacao: persistir vinculo fiscal com chave, hash, tipo, origem, ticket/romaneio/fatura e relatorio de conciliacao.

## P2 - Medias prioridades

### P2.1 - Pesagem manual vira peso oficial com pouco controle

Evidencias: checkbox simples em `pesagem/entrada/page.tsx` e `pesagem/saida/page.tsx`; `RegistrarPassagemDto` nao exige motivo quando `origemLeitura=MANUAL`.

Recomendacao: exigir motivo, destaque visual, auditoria e possivelmente aprovacao de supervisor.

### P2.2 - Tela de saida usa `abs` e mascara tara maior que bruto

Evidencias: `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:74` usa `Math.abs`, enquanto `backend/src/ticket/ticket-calculator.ts:44` rejeita bruto menor que tara.

Recomendacao: bloquear visualmente a finalizacao antes de registrar nova passagem quando saida > entrada.

### P2.3 - Busca operacional depende de selects truncados

Evidencias: entrada carrega veiculos/clientes/produtos com limite 200 e monta selects estaticos.

Recomendacao: usar autocomplete paginado por placa/documento/nome e cadastro rapido modal.

### P2.4 - Dashboard usa projecoes silenciosas e tem drift de contrato

Evidencias: `frontend/src/app/(authenticated)/page.tsx:117` multiplica hoje por 6/22; `frontend/src/lib/api/mappers.ts` espera nomes que podem divergir de `dashboard.service.ts`.

Recomendacao: remover projecoes silenciosas e alinhar contrato.

### P2.5 - Status online de balanca nasce verdadeiro e nao acompanha memoria de conexao

Evidencias: `schema.prisma` define `statusOnline` default `true`; conexao real atualiza estado em memoria.

Recomendacao: default `false` e sincronizar banco em connect/erro/close/reconnect.

### P2.6 - Protocolo `modbus` generico aceita cadastro impossivel

Evidencias: DTO aceita `modbus`; validacao so trata `modbus-rtu` e `modbus-tcp`; resolver converte `modbus` para RTU.

Recomendacao: exigir escolha explicita RTU/TCP ou validar `modbus` como RTU com porta serial obrigatoria.

### P2.7 - Calibracao registra historico, mas ajuste efetivo altera indicador global

Evidencias: `calibracao.service.ts` diz que nao altera fator; `AjusteLeituraSection` aplica fator no indicador, afetando todas as balancas do modelo.

Recomendacao: aplicar ajuste por balanca via `ovrFator` ou separar claramente "registro metrologico" de "aplicar correcao".

### P2.8 - Balanca padrao por unidade existe no schema, mas nao guia o fluxo

Evidencias: schema tem balanca padrao entrada/saida; configuracao/pesagem nao pre-seleciona nem valida pelo padrao.

Recomendacao: expor configuracao e pre-selecionar por unidade e direcao.

### P2.9 - Ativacao de licenca permite falsificar usuario responsavel

Evidencias: DTO aceita `usuarioId`; controller prefere `dto.usuarioId` em vez do usuario autenticado.

Recomendacao: remover `usuarioId` do body e usar sempre `@CurrentUser('id')`.

### P2.10 - JWT no renderer fica acessivel a JavaScript

Evidencias: `auth.store.ts` usa `sessionStorage`; `client.ts` le e envia Bearer.

Recomendacao: migrar para token em memoria ou cofre via Electron/safeStorage/IPC minimo.

### P2.11 - Segredo SMTP usa chave derivada de `JWT_SECRET`

Evidencias: `crypto.util.ts` usa `requireJwtSecret()`; SMTP cifra senha via essa utilidade.

Recomendacao: usar DPAPI/protectSecret ou chave separada com rotina de rotacao.

### P2.12 - Smoke do instalador valida backend, nao a janela completa

Evidencias: `.github/workflows/release.yml:65` abre o app empacotado, mas valida apenas `/api/health`.

Recomendacao: adicionar smoke Playwright/Electron no `win-unpacked`: login, abertura da tela de pesagem e renderizacao do frontend.

### P2.13 - Health check mistura liveness com thresholds operacionais

Evidencias: `health.controller.ts` pode falhar por memoria/disco; Electron usa o mesmo endpoint para liberar boot.

Recomendacao: separar `/health/live` de `/health/ready/degraded`.

### P2.14 - Contrato frontend/backend ainda e manual

Evidencias: mappers usam `any`, mocks sao importados estaticamente e divergencias de shape apareceram em captura de peso, dashboard, financeiro e balanca.

Recomendacao: gerar tipos por OpenAPI/DTOs compartilhados e validar respostas criticas com Zod.

## P3 - Baixa prioridade / organizacional

- Formulario de entrada pode ser descartado por Escape/botao sem confirmacao.
- Marketplace/SDK/relay cloud aparecem cedo demais para o ICP inicial; manter como upside.
- `pnpm ci` local e mais fraco que `ci:full`/release; renomear para `ci:fast` ou alinhar ao pipeline.
- Documentos legais ainda tem placeholders de CNPJ/endereco/DPO; bloquear GA comercial ate revisao juridica.

## Pontos fortes

- O projeto compila, passa lint, unitarios, E2E backend, security audit high-level e smoke de parsers.
- Electron esta bem endurecido: loopback, `nodeIntegration=false`, `contextIsolation=true`, sandbox, CSP e bloqueio de navegacao externa.
- Guards globais de auth/tenant/roles estao bem encaminhados e corrigem achados antigos de cross-tenant em perfis/usuarios.
- Dominio de ticket tem state machine, calculadora oficial, contador por unidade/ano e outbox no fechamento.
- Hardware tem boa base: adapters serial/TCP/Modbus, parsers variados, captura bruta, auto-detect e testes de parser/adapter.
- PII scrubbing e Sentry/trace-id ja existem, formando boa base de observabilidade.

## Ordem recomendada

1. Corrigir P1.1, P1.2 e P1.3 para estabilizar a operacao de balanca.
2. Fechar tenant/RBAC: relatorios, diagnostico, balanca config e scans.
3. Alinhar contratos frontend/backend de balanca, financeiro, dashboard e captura.
4. Rebaixar promessa comercial de ERP/fiscal ou entregar tela/perfis/outbox/mapping minimos.
5. Endurecer backup/DR/auditoria para sustentar a promessa fiscal.
6. Resolver P2 de UX operacional: manual, busca paginada, balanca padrao, dashboard e impressao.
