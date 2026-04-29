# Auditoria Profunda - 5 Auditores - 2026-04-29

Projeto: `solution-ticket-desktop`

Escopo: auditoria somente leitura do projeto atual, exceto a criacao deste relatorio.

Observacao: o worktree ja estava com muitas alteracoes locais antes da auditoria. Nenhum arquivo de codigo foi alterado.

## Auditores

1. Operacao/UX: fluxo do operador, usabilidade, produtividade, erro e recuperacao.
2. Negocio/Produto: proposta de valor, ICP, promessa comercial, roadmap e risco de PMF.
3. Balanca/Hardware: cadastro de balanca, serial, TCP/Ethernet, Modbus, parsers e diagnostico.
4. Arquitetura/Seguranca/Dados: RBAC, tenant, licenca, auditoria, SQLite, Electron e backup.
5. QA/Release/Operacao: testes, CI/CD, empacotamento, observabilidade e suporte.

## Verificacoes executadas

- `pnpm typecheck:all`: passou.
- `pnpm --filter ./backend exec jest --runInBand`: passou, 67 suites / 411 testes.
- `pnpm --filter ./frontend exec jest --runInBand --watchAll=false`: passou, 1 suite / 2 testes.
- `pnpm lint:check`: passou.
- `pnpm security:audit`: passou, com falsos positivos de workspace Electron silenciados pelo script.
- `pnpm --filter ./backend test:e2e`: passou, 6 suites / 37 testes.
- `pnpm build:all`: passou.
- `backend/scripts/smoke-balanca.ts`: falhou em 3/13 parsers (`toledo-2090`, `filizola-at`, `saturno`) por estabilidade esperada `true` e lida `false`.

## Sumario executivo

O projeto compila, passa lint, unitarios, E2E backend e build. O risco atual nao esta em "nao compila"; esta em quatro frentes:

1. O fluxo operacional de pesagem ainda tem quebras de contrato e UX que podem travar operador em campo.
2. O cadastro/configuracao de balanca e o ponto mais critico: a UI nao envia o DTO que o backend exige e TCP/Modbus ainda nao tem configuracao suficiente para instalacao real.
3. A documentacao comercial promete integracoes ERP/fiscais e disponibilidade acima do que o produto implementa hoje.
4. Seguranca, auditoria, release e suporte ja tem boa base, mas ainda ha lacunas de RBAC, prova de auditoria, smoke do app empacotado e testes de hardware real/simulado.

## P0 - Bloqueadores

### P0.1 - Cadastro de balanca pela UI nao bate com o DTO do backend

Evidencias:

- `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx:132` monta payload com `tipoConexao` e `ativa`.
- `backend/src/balanca/dto/create-balanca.dto.ts:5` exige `empresaId`.
- `backend/src/main.ts:115` usa `whitelist` e `forbidNonWhitelisted`.

Impacto: criar/editar balanca pela tela tende a falhar com 400 ou gravar dados incompletos. Sem cadastro confiavel de balanca, o produto nao passa implantacao basica.

Recomendacao: alinhar UI e API: enviar `empresaId`, `protocolo`, `ativo`, `enderecoIp`, `portaTcp` e remover campos nao aceitos. Separar explicitamente SERIAL, TCP, MODBUS_RTU e MODBUS_TCP no contrato.

### P0.2 - Peso em tempo real pode reconectar a cada leitura

Evidencias:

- `frontend/src/components/balanca/PesoRealtime.tsx:34-109` inclui `onPesoChange` nas dependencias do `useEffect`.
- `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:300-307` e `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:195-202` passam callbacks inline.

Impacto: cada leitura atualiza estado, re-renderiza a pagina, recria o callback e pode fechar/reabrir SSE. Em operacao real isso pode causar peso piscando, perda de estabilidade e fila parada.

Recomendacao: estabilizar os callbacks com `useCallback` nas telas ou guardar `onPesoChange` em `ref` dentro de `PesoRealtime` e remover o callback das dependencias de conexao.

### P0.3 - Promessa comercial de integracao ERP e fiscal excede o produto atual

Evidencias:

- `docs/comercial/marketing/ONE-PAGER-EXECUTIVO.md:49-53` cita ERPs como Bling, TOTVS, SAP, Dynamics e Oracle.
- `docs/comercial/marketing/ONE-PAGER-EXECUTIVO.md:83` fala em "20+ ERPs nativos".
- `backend/src/integracao/connectors/connector-registry.service.ts:10-12` registra somente `mock` e `generic-rest`.
- `docs/PLANO-MODULO-INTEGRACAO.md:384-390` deixa integracao fiscal complexa fora do MVP.
- `backend/src/utilitarios/documentos.service.ts:132-145` ainda tem vinculo XML como stub.

Impacto: risco de venda desalinhada, demo quebrada, obrigacao contratual sem base tecnica e perda de confianca em prospects.

Recomendacao: publicar matriz de status: "disponivel hoje", "beta", "planejado". Rebaixar claims fiscais para rastreabilidade de ticket/outbox ate haver conector fiscal validado.

## P1 - Altas prioridades

### P1.1 - Fluxo 1PF com tara nao envia a tara digitada nem fecha o ticket

Evidencias:

- Campo de tara em `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:217-223`.
- Payload nao envia `taraReferenciaTipo` nem `taraManual` em `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:120-132`.
- Backend exige tara valida em `backend/src/ticket/ticket.service.ts:79-85`.
- Tela abre preview apos passagem, sem `fecharTicket`, em `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:134-149`.

Impacto: operador marca 1PF, digita tara, e a operacao pode ser rejeitada ou ficar aberta sem calculo final oficial.

Recomendacao: enviar `taraReferenciaTipo='MANUAL'` e `taraManual`, ou usar tara cadastrada explicitamente. Para 1PF, fechar o ticket apos a passagem ou mostrar que ainda falta etapa.

### P1.2 - Busca de ticket na saida nao busca por numero/placa no backend

Evidencias:

- Saida chama `getTickets(1, 20, busca, 'AGUARDANDO_PASSAGEM')` em `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:39-42`.
- API manda `search` em `frontend/src/lib/api/tickets.ts:68-77`.
- Backend filtra `placa` e `numero`, mas nao `search`, em `backend/src/ticket/dto/ticket-filter.dto.ts:36-54` e `backend/src/ticket/ticket.service.ts:143-157`.

Impacto: operador digita placa/numero e pode continuar vendo apenas os 20 tickets mais recentes, com risco de selecionar ticket errado.

Recomendacao: implementar `search` no backend ou mapear a busca para `numero`/`placa`.

### P1.3 - Acoes criticas de pesagem nao tem erro operacional nem recuperacao guiada

Evidencias:

- Entrada tem `useMutation` sem `onError` em `frontend/src/app/(authenticated)/pesagem/entrada/page.tsx:117-150`.
- Saida registra passagem, adiciona desconto e fecha ticket em sequencia sem tratamento de falha em `frontend/src/app/(authenticated)/pesagem/saida/page.tsx:73-98`.

Impacto: falha parcial pode gerar ticket com passagem duplicada, desconto sem fechamento ou fechamento sem feedback claro.

Recomendacao: adicionar toast/alerta com erro legivel, bloqueio contra duplo clique, idempotencia visual e tela de retomada quando ja houver passagem registrada.

### P1.4 - TCP/Ethernet e cadastrado como string unica, mas backend exige host/porta separados

Evidencias:

- UI pede `192.168.1.100:4001` no campo `porta` em `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx:411`.
- Backend exige `enderecoIp` e `portaTcp` para `tcp` em `backend/src/balanca/balanca.service.ts:75`.
- `docs/HARDWARE-COMPATIBILITY.md:37` tambem orienta `IP:PORTA`.

Impacto: conversor serial-Ethernet pode ser cadastrado de forma que nunca conecta.

Recomendacao: separar campos Host/IP e Porta TCP na UI e persistir nos nomes do DTO.

### P1.5 - Modbus TCP/RTU perde distincao e nao persiste parametros essenciais

Evidencias:

- `modbus-rtu` e `modbus-tcp` sao normalizados para `modbus` em `backend/src/balanca/balanca.service.ts:27`.
- Validacao exige `porta` serial para `modbus` em `backend/src/balanca/balanca.service.ts:57`.
- Adapter suporta parametros em `backend/src/balanca/adapters/adapter.interface.ts:28`, mas `Balanca` nao persiste unit/register/endian/scale em `backend/src/prisma/schema.prisma:397`, e a conexao nao repassa em `backend/src/balanca/balanca-connection.service.ts:96`.

Impacto: Modbus TCP real fica dificil ou impossivel de configurar; leituras podem sair erradas fora dos defaults.

Recomendacao: persistir `modbusTransport`, unit id, register, function, byte/word order, signed, scale e offset.

### P1.6 - Overrides por balanca existem, mas nao sao usados na conexao real

Evidencias:

- Schema tem `ovrDataBits`, `ovrParserTipo`, `ovrFator` etc. em `backend/src/prisma/schema.prisma:415`.
- `backend/src/balanca/config-resolver.ts:67` resolve a configuracao efetiva.
- `backend/src/balanca/balanca-connection.service.ts:96` e `:107` montam adapter/parser direto do indicador.

Impacto: ajustes por equipamento e wizard podem nao afetar a leitura em campo.

Recomendacao: usar `resolveEffectiveConfig()` em `conectar`, `testar` e captura, com testes cobrindo override de parser/fator/serial.

### P1.7 - Protocolos com ENQ/comando nao funcionam no daemon de leitura

Evidencias:

- Presets Toledo C e Filizola @ indicam envio de ENQ.
- `backend/src/balanca/capture-raw.service.ts:125` sabe enviar ENQ.
- `IBalancaAdapter` so expoe `connect/close/isOpen`, e a conexao continua apenas processa `data` recebido.

Impacto: indicadores que nao transmitem em streaming podem "abrir porta" mas nunca produzir peso em tempo real.

Recomendacao: adicionar `write()` nos adapters e modo polling/comando por indicador, com intervalo e timeout configuraveis.

### P1.8 - "Testar conexao" valida transporte, nao leitura/parsing

Evidencias:

- `backend/src/balanca/balanca-connection.service.ts:212` conecta e fecha, sem exigir bytes nem leitura parseada.

Impacto: operador pode receber sucesso com parser errado, baud/paridade incorretos ou indicador sem transmissao.

Recomendacao: no teste, aguardar bytes e pelo menos uma leitura parseada; quando falhar, devolver diagnostico bruto.

### P1.9 - Ajuste de leitura chama endpoint inexistente/incompativel

Evidencias:

- Frontend faz `PATCH /cadastros/indicadores/${id}` em `frontend/src/components/balanca/AjusteLeituraSection.tsx:57`.
- Backend expoe `@Controller('indicadores')` e `PUT /indicadores/:id` em `backend/src/indicador/indicador.controller.ts:11` e `:34`.

Impacto: ajuste/calibracao visual pode falhar e nao corrigir o peso efetivo.

Recomendacao: alinhar rota e metodo (`PATCH` ou `PUT`) e cobrir com teste de componente/API.

### P1.10 - Aprovacoes de manutencao sem RBAC nem isolamento por tenant

Evidencias:

- `backend/src/manutencao/manutencao.controller.ts:11`, `:34`, `:40`.
- `backend/src/manutencao/manutencao.service.ts:21`, `:36`, `:66`.

Impacto: qualquer usuario autenticado pode criar/listar/aprovar/recusar solicitacoes informando `solicitanteId`/`aprovadorId`, o que abre fraude operacional.

Recomendacao: exigir permissoes especificas, usar `CurrentUser` para solicitante/aprovador, filtrar por `tenantId` e validar entidade alvo dentro do tenant.

### P1.11 - Auditoria nao e tamper-evident apesar de ADR aceita

Evidencias:

- `docs/adr/ADR-018-audit-trail-tamper-evident.md:25`, `:29`, `:44`.
- `backend/src/auditoria/auditoria.service.ts:27`.
- `backend/src/integracao/logging/integration-log.service.ts:28`.

Impacto: o SQLite local pode ser alterado manualmente sem deteccao criptografica; trilhas de ticket/integracao perdem forca probatoria.

Recomendacao: implementar `prev_hash`, assinatura, verificador local e export/testemunho WORM, ou rebaixar explicitamente a garantia documental.

### P1.12 - Restore destrutivo pode perder auditoria do proprio restore

Evidencias:

- `backend/src/common/interceptors/audit.interceptor.ts:31`, `:53`.
- `backend/src/backup/backup.service.ts:202`, `:205`, `:208`.

Impacto: a operacao mais destrutiva pode nao ficar registrada de forma duravel se o processo encerrar antes do flush da auditoria.

Recomendacao: registrar auditoria sincrona antes do restore, exigir duplo controle e encerrar somente apos confirmacao.

### P1.13 - Licenca/trial nao valida unidade contra o tenant autenticado

Evidencias:

- `backend/src/licenca/licenca.controller.ts:54`.
- `backend/src/licenca/licenca.service.ts:104`, `:117`, `:151`, `:238`.

Impacto: usuario com permissao de licenca pode ativar/criar registro para unidade de outro tenant.

Recomendacao: validar `unidadeId` com `{ id: unidadeId, empresa: { tenantId } }` antes de iniciar trial ou ativar licenca.

### P1.14 - E2E mock do frontend esta configurado para nao usar mock no build baixado

Evidencias:

- `.github/workflows/ci.yml:149-180`.
- `frontend/src/lib/api/client.ts:21-22`.
- `frontend/playwright.config.ts:32-35`.

Impacto: job "Frontend E2E - mock" usa build criado com mock desabilitado; passar `NEXT_PUBLIC_ENABLE_LOCAL_MOCKS=true` na execucao nao recompila o bundle.

Recomendacao: gerar build separado com mock habilitado, ou remover o job mock e manter somente E2E real.

### P1.15 - Fluxo critico nao testa captura real/simulada de balanca

Evidencias:

- `backend/test/e2e/helpers/test-app.ts:154`.
- `backend/test/e2e/balancas.e2e-spec.ts:41-43`.
- `backend/test/e2e/cenarios-aceite.e2e-spec.ts:156-166`.

Impacto: E2E usa `COM-INEXISTENTE` e pesos manuais; nao valida estabilidade, timeout, reconexao, serial/TCP/Modbus nem frames reais.

Recomendacao: adicionar mock TCP/serial virtual com frames reais, ligar smoke ao CI e manter matriz HIL Windows para modelos homologados.

### P1.16 - Instalador Windows nao tem smoke do app empacotado

Evidencias:

- `.github/workflows/release.yml:57-87`.
- `electron/package.json:43-278`.

Impacto: release verifica assinatura/existencia do `.exe`, mas nao que app instalado sobe backend, frontend, Prisma, native modules e recursos empacotados.

Recomendacao: apos `electron-builder`, iniciar `win-unpacked` em Windows, aguardar `/api/health`, abrir UI e validar migrations/native modules/logs.

### P1.17 - Release dry-run tende a quebrar no code signing

Evidencias:

- `.github/workflows/release-dry-run.yml:37-41`.
- `electron/sign.js:22-29`.

Impacto: dry-run define `CI_RELEASE=true`, mas nao fornece `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD`.

Recomendacao: usar `CI_RELEASE=false` no dry-run ou provisionar certificado de teste.

## P2 - Prioridades medias

- Reimpressao no detalhe tem botao sem acao: `frontend/src/app/(authenticated)/tickets/[id]/page.tsx:392-396`.
- Atalhos documentados (`F1`, `F2`, `Esc`) nao estao integrados nas telas de pesagem: `docs/OPERACAO.md:5-15` e `frontend/src/hooks/useKeyboardShortcuts.ts:17-41`.
- Filtros da lista de tickets sao parcialmente client-side apos paginacao: `frontend/src/app/(authenticated)/tickets/page.tsx:46-74`.
- Dois controladores competem por `/indicadores`: `backend/src/cadastros/cadastros.module.ts:10` e `backend/src/indicador/indicador.controller.ts:11`.
- Status visual da lista de balancas nao usa o campo real `statusOnline`: `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx:197`.
- `debugMode` de balanca promete dump bruto, mas nao ha uso no servico: `backend/src/prisma/schema.prisma:433`.
- Flow control de presets (`RTS_CTS`, `XON_XOFF`) nao e mapeado pelo `SerialAdapter`.
- `/api/metrics` agrega dados sem filtro de tenant: `backend/src/app.controller.ts:46`, `:52`, `:57`, `:58`.
- Segredos caem de DPAPI para chave derivada de `JWT_SECRET`: `backend/src/common/secret-protection.util.ts:41`, `:44`.
- Webhook de notificacoes nao exige permissao especifica: `backend/src/mailer/notificacao.controller.ts:10`, `:29`.
- Upgrade SQLite empacotado ainda nao e coberto por E2E de `migrate deploy`: `electron/main.js:221`, `:227`.
- Frontend Next em producao nao fixa hostname em `127.0.0.1`: `electron/main.js:337`.
- Cobertura backend tem threshold no Jest, mas CI roda `jest`, nao `jest --coverage`.
- Frontend tem cobertura unitaria minima: apenas `frontend/src/components/ui/__tests__/tabs.test.tsx`.
- Electron nao tem lint/typecheck/teste proprio para `main.js`, `updater.js`, `prep-cache.js` e `sign.js`.
- Observabilidade descrita em runbooks nao esta implementada como metricas/alertas executaveis.

## Pontos fortes

- Backend tem boa base de testes: 67 suites unitarias e 6 E2E backend passaram.
- Build backend/frontend passou no estado atual.
- Backend fixa loopback, CORS restrito e Swagger fora de producao.
- Electron usa `contextIsolation`, `sandbox`, CSP e bloqueio de navegacao externa.
- Registro de passagem valida balanca por tenant/unidade antes de aceitar peso.
- Existe arquitetura relevante de hardware: adapters, parsers, reconexao, captura bruta, autodetect e terminal serial.
- Existe chassi de integracao com outbox e conectores `mock`/`generic-rest`, bom como base para evolucao controlada.

## Ordem recomendada de correcao

1. Fechar o cadastro de balanca: contrato UI/backend, empresa/unidade, TCP host/porta, status e endpoint de ajuste.
2. Estabilizar peso em tempo real e fluxo de pesagem: SSE callback, 1PF/tara, busca de saida, erros/retry e cancelamento real.
3. Endurecer hardware: teste de conexao com leitura parseada, ENQ/polling, Modbus completo, overrides efetivos e smoke de parsers no CI.
4. Fechar seguranca operacional: manutencao com RBAC/tenant, licenca por tenant, restore auditavel, webhooks protegidos.
5. Rebaixar materiais comerciais ao que existe hoje e publicar matriz de maturidade de ERPs/hardware/fiscal.
6. Endurecer release: E2E frontend real/mocks corrigidos, smoke do `win-unpacked`, migration upgrade test e dry-run de assinatura consistente.
7. Transformar runbooks de operacao/on-call/DR em checklists executaveis com comandos validados e dono.

## Gates antes de piloto pago

- Cadastrar e testar uma balanca serial e uma TCP pelo fluxo de UI, sem ajuste manual no banco.
- Rodar fluxo entrada -> saida -> fechamento -> impressao/reimpressao com erro simulado no meio.
- Rodar mock TCP/serial com frames reais em CI.
- Ter matriz "homologado/beta/nao suportado" para modelos de balanca.
- Trocar materiais comerciais para status real dos ERPs.
- Validar smoke do app empacotado em Windows.
