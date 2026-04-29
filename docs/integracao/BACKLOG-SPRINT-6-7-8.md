# Backlog Detalhado — Sprints 6, 7, 8 (Fase 1 — Piloto Bling)

**Sprints**: 6, 7, 8 — Fase 1 — semanas 13–18 (mês 4)
**Objetivo da Fase 1**: implementar conector Bling como piloto sólido + iniciar PME

**Pré-requisitos**: Fase 0 concluída (chassi + Mock + genéricos)

> **DoR e DoD por history**: ver `BACKLOG-SPRINT-0-1.md` (blocos no topo). Aplicam-se a todas as histórias destes 3 sprints.
> **Estratégia de testes**: ver `ESTRATEGIA-TESTES.md`. Suite TCK obrigatória conforme `TCK-SPEC.md`.
> **Drill DR**: a partir do Sprint 6 (entrada em produção piloto), DoD por sprint exige drill DR registrado.

---

## Visão dos 3 sprints

| Sprint | Foco                              | Demo final                              |
| ------ | --------------------------------- | --------------------------------------- |
| **6**  | Discovery + Implementação Bling   | Push de ticket teste para Bling sandbox |
| **7**  | H1 + H2 + Webhook via relay       | Mock cliente piloto recebe/envia tudo   |
| **8**  | H3 + H4 + Produção piloto inicial | Cliente piloto em pré-produção          |

---

## Sprint 6 — Discovery + Implementação Bling (semanas 13–14)

### Objetivo

Conector `BlingConnector` funcional em sandbox, com mapping default e testes unitários.

### User Stories

#### S6-01 — Discovery completo do Bling

**Como** Analista ERP
**Quero** documentar tudo sobre Bling antes de codar
**Para** evitar retrabalho

**Critérios de aceite**:

- [ ] `docs/integracao/contratos/bling.md` seções 1–2 atualizadas
- [ ] Validação via Context7 (docs oficiais Bling)
- [ ] Sandbox configurado (conta de teste real)
- [ ] Massa de teste cadastrada (5 clientes, 10 produtos, 3 vendedores)
- [ ] Cliente piloto confirmou regras de negócio

**Estimativa**: 5 pontos
**Responsável**: Analista ERP + Tech Lead

---

#### S6-02 — Implementação `BlingConnector`

**Como** Dev Sênior
**Quero** conector implementando `IErpConnector` completa
**Para** entregar push/pull/cancel funcionais

**Critérios de aceite**:

- [ ] Estrutura conforme `connectors/bling/`
- [ ] `bling.connector.ts` implementa interface
- [ ] `bling.auth.ts` com OAuth 2.0 Authorization Code + refresh automático
- [ ] `bling.client.ts` com **token bucket de 3 req/s**
- [ ] `bling.errors.ts` classifica técnico vs negócio
- [ ] `capabilities()` retorna entidades, auth, transport
- [ ] Cobertura ≥ 80%

**Estimativa**: 13 pontos
**Responsável**: Dev Sênior

---

#### S6-03 — Mapping `bling-default.yaml`

**Como** Dev Pleno
**Quero** mapping default para push de ticket
**Para** que cliente novo herde mapping pronto

**Critérios de aceite**:

- [ ] YAML conforme template (seção 3.3 do contrato)
- [ ] Validado via `POST /mapping/validate`
- [ ] Preview testado com payload real
- [ ] Tabelas de equivalência criadas (4 tabelas)
- [ ] Versionado em `connectors/bling/mapping/bling-default.yaml`

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

#### S6-04 — Pull de produtos e contatos

**Como** Sistema
**Quero** sincronizar cadastros do Bling para o ST
**Para** que ticket tenha referência válida

**Critérios de aceite**:

- [ ] `pullChanges('Product', checkpoint)` funciona com paginação
- [ ] `pullChanges('Partner', checkpoint)` idem
- [ ] Checkpoint atualizado a cada batch
- [ ] Mapping reverso (Bling → canônico) implementado em `bling.mapper.ts`
- [ ] Persiste em entidades locais com flag "vindo do ERP"
- [ ] Externa link gravado em `integracao_external_link`

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior

---

#### S6-05 — Push de ticket fechado

**Como** Operador
**Quero** que ticket fechado vire pedido no Bling automaticamente
**Para** parar de digitar manualmente

**Critérios de aceite**:

- [ ] Listener captura `weighing.ticket.closed`
- [ ] Outbox grava evento canônico
- [ ] Worker processa: mapping → push → external_link
- [ ] Pedido criado no Bling com produto correto e quantidade em kg
- [ ] Idempotency key respeitada (envio duplicado = 1 pedido)
- [ ] Teste e2e com sandbox Bling

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior + Dev Pleno

---

#### S6-06 — Cancelamento de pedido

**Como** Operador
**Quero** cancelar ticket e reflexo automático no Bling
**Para** manter sincronia

**Critérios de aceite**:

- [ ] `cancelOperation()` implementado
- [ ] Chama `PUT /pedidos/vendas/<id>/situacoes/<idCancelado>`
- [ ] Atualiza status local
- [ ] Auditoria registra justificativa

**Estimativa**: 3 pontos
**Responsável**: Dev Pleno

---

### DoD Sprint 6

- [ ] DoD por history cumprida em todas as histórias
- [ ] Demo gravada: configurar conector → testar conexão → pull cadastros → fechar ticket → ver pedido no Bling sandbox
- [ ] Cobertura ≥ 70% linhas novas (95% em auth OAuth Bling)
- [ ] **TCK Bling ≥ 60%** (Interface + Idempotency + Error classification iniciais)
- [ ] **Contract test verde** Hub↔Bling consumer-side
- [ ] **Smoke E2E** Playwright contra Bling sandbox
- [ ] Mapping validado contra ADR-011 (JSONata, sem Mustache)
- [ ] **Drill DR registrado**: simulação de queda do relay cloud + recuperação documentada em `docs/runbooks/integracao/`
- [ ] CI verde
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-6/`**

**Story points**: 30 (recalibrado — capacity Sprint 6+ com Dev Pleno #2 entrando)

> ⚠️ **REPLANEJAMENTO Sprint 6 (Rodada 4)**: Sprint 5 entregou 28 pts e empurrou ~15 pts de carry-over (SFTP, Tela Mapeamento, Reconciliação, parte de XML). Sprint 6 absorve carry-over reduzindo Bling para Discovery + Estrutura inicial:
>
> - **Carry-over Sprint 5**: SFTP (3), XML do CSV/XML connector (2), Tela Mapeamento básica (5), Reconciliação básica (5) = 15 pts
> - **Bling neste sprint**: S6-01 Discovery (3) + S6-02 estrutura conector + auth OAuth Loopback (8) + S6-03 mapping default (4) = 15 pts (vs 26 originais)
> - **Total**: 30 pts. S6-04 (pull) + S6-05 (push) + S6-06 (cancel) movidos para Sprint 7.

---

## Sprint 7 — H1 + H2 + Webhook (semanas 15–16)

### Objetivo

Validar conector tecnicamente (H1, H2) + integrar webhook entrante via relay cloud.

### User Stories

#### S7-01 — Executar Fase H1 (16 cenários)

**Como** QA
**Quero** validar todos os cenários técnicos em sandbox
**Para** liberar para H2

**Critérios de aceite**:

- [ ] 16 cenários de `PLANO-HOMOLOGACAO-CONECTOR.md` seção 5 passando
- [ ] Relatório H1 preenchido
- [ ] Bugs encontrados corrigidos no sprint

**Estimativa**: 8 pontos
**Responsável**: QA + Dev

---

#### S7-02 — Executar Fase H2 (16 cenários de erro)

**Como** QA
**Quero** validar tratamento de erro
**Para** garantir robustez

**Critérios de aceite**:

- [ ] 8 erros técnicos validados (retry funciona)
- [ ] 8 erros de negócio validados (não retenta)
- [ ] Classificação correta em `bling.errors.ts`
- [ ] Relatório H2 preenchido

**Estimativa**: 8 pontos
**Responsável**: QA + Dev

---

#### S7-03 — Relay Cloud — Webhook Receiver inicial

**Como** SRE
**Quero** Cloudflare Worker recebendo webhook do Bling
**Para** habilitar eventos entrantes

**Critérios de aceite**:

- [ ] Repo `solution-ticket-relay` criado
- [ ] Worker básico em `wrangler` deploy
- [ ] Endpoint `POST /webhook/bling/<tenant-id>`
- [ ] Validação HMAC do Bling
- [ ] Persiste em Cloudflare KV
- [ ] Deploy em staging

**Estimativa**: 13 pontos
**Responsável**: SRE + Dev Sênior

---

#### S7-04 — Polling Endpoint do Relay

**Como** Sistema
**Quero** endpoint long-polling para agent local consumir
**Para** entregar eventos sem expor backend

**Critérios de aceite**:

- [ ] `GET /poll?since=<eventId>` com long-polling 30s
- [ ] Auth Bearer com token rotativo
- [ ] `POST /ack` remove eventos da fila
- [ ] Testes com 100 eventos enfileirados

**Estimativa**: 5 pontos
**Responsável**: SRE

---

#### S7-05 — Inbound Agent local

**Como** Sistema
**Quero** agent que faz long-polling no relay
**Para** receber eventos do Bling

**Critérios de aceite**:

- [ ] `relay/inbound-agent.service.ts` no backend
- [ ] Inicia no boot
- [ ] Reconecta automaticamente se cair
- [ ] Grava em `integracao_inbox` com idempotency
- [ ] Tabela `integracao_relay_subscription` cadastrada
- [ ] Métricas: `inbox_received_total`

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior

---

#### S7-06 — Inbox Processor para webhooks Bling

**Como** Sistema
**Quero** processar eventos `pedido.alterado`, `contato.alterado`
**Para** manter sincronia automática

**Critérios de aceite**:

- [ ] Lê eventos `PENDING` da inbox
- [ ] Roteia por `eventType` para handler do conector
- [ ] Atualiza estado local correspondente
- [ ] Status `CONFIRMED` ou `FAILED`
- [ ] Testes e2e com webhook simulado

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

### DoD Sprint 7

- [ ] DoD por history cumprida em todas as histórias
- [ ] H1 e H2 validados (32 cenários) com relatório em `docs/integracao/relatorios-homologacao/`
- [ ] **TCK Bling ≥ 90%** (apenas PE-05/PE-06 podem ser pós-GA)
- [ ] **Contract test verde** Hub↔Bling com matriz erros
- [ ] **Drill DR mensal registrado** (failover Cloudflare→AWS conforme runbook)
- [ ] **DAST baseline** rodado contra relay cloud — sem high abertos
- [ ] Webhook Bling chega ao backend local via relay
- [ ] Mudança no Bling reflete no ST automaticamente
- [ ] Demo gravada
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-7/`**

**Story points**: 32 (recalibrado — absorve carry-over de Sprint 6 + H1/H2 + Webhook)

> ⚠️ **REPLANEJAMENTO Sprint 7 (Rodada 4)**:
>
> - **Carry-over Sprint 6**: S6-04 pull (8), S6-05 push (8), S6-06 cancel (3) = 19 pts
> - **Sprint 7 original (manter)**: S7-01 H1 (8), S7-02 H2 reduzido (5) = 13 pts
> - **Total**: 32 pts. S7-03/04/05/06 (Webhook + Inbound Agent) movidos para Sprint 8.

---

## Sprint 8 — H3 + H4 + Produção piloto (semanas 17–18)

### Objetivo

Validar carga + homologar com cliente piloto + iniciar produção sombra.

### User Stories

#### S8-01 — Fase H3 (carga e resiliência)

**Como** SRE
**Quero** validar comportamento sob carga
**Para** garantir estabilidade

**Critérios de aceite**:

- [ ] 8 cenários de carga executados
- [ ] 1000 tickets em < 10 min
- [ ] Latência p95 < 2s
- [ ] Memória estável em 24h
- [ ] Relatório H3

**Estimativa**: 5 pontos
**Responsável**: SRE + Dev

---

#### S8-02 — Setup do cliente piloto em pré-produção

**Como** PM
**Quero** Solution Ticket instalado no cliente piloto
**Para** iniciar H4

**Critérios de aceite**:

- [ ] Instalação em ambiente isolado do cliente
- [ ] Conectado ao **sandbox Bling do cliente**
- [ ] Massa de teste real (anonimizada se necessário)
- [ ] Equipe do cliente convocada (técnico + operador)

**Estimativa**: 3 pontos
**Responsável**: PM + Dev

---

#### S8-03 — Fase H4 com cliente (10 cenários)

**Como** QA + Cliente
**Quero** cliente executar todos os cenários sob observação
**Para** validar usabilidade

**Critérios de aceite**:

- [ ] 10 cenários do plano H4 executados pelo cliente
- [ ] **100 pesagens reais** sem perda
- [ ] Treinamento de 4h aplicado
- [ ] Evidence pack de pré-produção anexado; termo real, se existir, registrado como dependência externa
- [ ] Relatório H4

**Estimativa**: 8 pontos
**Responsável**: QA + PM + Cliente

---

#### S8-04 — Modo Sombra (Fase H5 semana 1)

**Como** Sistema
**Quero** ST enviar para Bling produção em paralelo ao processo antigo
**Para** comparar antes de virar única fonte

**Critérios de aceite**:

- [ ] ST envia para Bling produção
- [ ] Cliente continua processo antigo
- [ ] Comparação diária ao vivo
- [ ] 0 divergência detectada
- [ ] 0 perda

**Estimativa**: 5 pontos
**Responsável**: Dev + PM

---

#### S8-05 — Documentação final do conector

**Como** Cliente / Suporte
**Quero** documentação completa
**Para** operar autonomamente

**Critérios de aceite**:

- [ ] Runbook `docs/runbooks/integracao/bling.md` (top 10 erros)
- [ ] Vídeo de configuração (5 min)
- [ ] Vídeo de troubleshooting (10 min)
- [ ] Página no portal de conectores

**Estimativa**: 5 pontos
**Responsável**: PM + Dev

---

#### S8-06 — Treinamento do suporte L1 ST

**Como** Suporte
**Quero** treinamento sobre Bling
**Para** atender cliente em produção

**Critérios de aceite**:

- [ ] 2h de treinamento aplicado
- [ ] Top 10 erros conhecidos
- [ ] Acesso a sandbox para reprodução
- [ ] Documentação acessível

**Estimativa**: 2 pontos
**Responsável**: Tech Lead + PM

---

### DoD Sprint 8 (e da Fase 1 inicial)

- [ ] DoD por history cumprida em todas as histórias
- [ ] H3 validado por evidence pack (carga + chaos CH-01..CH-06 — ver `ESTRATEGIA-TESTES.md` §7)
- [ ] H4 validado com cliente piloto ou fixture/sandbox equivalente registrada em `EXTERNAL-DEPENDENCIES.md`
- [ ] **Pentest DAST sem high** (OWASP ZAP contra `:3002` + relay cloud) — exigido a partir do Sprint 8
- [ ] **Drill DR mensal registrado** (DPAPI key recovery executado, não apenas runbook narrativo)
- [ ] **TCK Bling 100%** (incluindo PE-05/PE-06)
- [ ] **Contract test verde** com tag `prod` no Pact Broker
- [ ] Modo Sombra rodando estável (5 dias úteis com 0 divergência)
- [ ] Documentação publicada (runbook + vídeo onboarding)
- [ ] `Agent-Orchestrator` publica decision record para continuar para Sprint 9 (Modo Ativo + Omie)
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-8/`**

**Story points**: 28

---

## Capacity (média dos 3 sprints)

| Recurso      | Disponibilidade                      |
| ------------ | ------------------------------------ |
| Tech Lead    | 40%                                  |
| Dev Sênior   | 100%                                 |
| Dev Pleno    | 100%                                 |
| SRE          | 50% (relay cloud)                    |
| QA           | 100%                                 |
| PM           | 50% (cliente piloto)                 |
| Analista ERP | 30% (Discovery + suporte ao cliente) |

---

## Riscos da Fase 1 inicial

| Risco                                       | Mitigação                            |
| ------------------------------------------- | ------------------------------------ |
| Bling muda API durante implementação        | Testes de contrato em CI diário      |
| Cliente piloto desiste em H4                | Backup identificado em Sprint 0      |
| Relay cloud demora para estabilizar         | Polling como fallback temporário     |
| Rate limit 3 req/s gera fila grande em pico | Token bucket + priorização de fiscal |
| OAuth refresh falha silenciosamente         | Alertas + healthcheck periódico      |

---

## Próximos sprints (preview)

### Sprint 9 (mês 5, semanas 19–20)

- S9-01: Modo Ativo (H5 semana 2)
- S9-02: Início implementação Omie
- S9-03: GA do Bling

### Sprint 10–11 (mês 5)

- ContaAzul + Tiny + segundo conector PME (Sankhya/Bling restante)
- 5 conectores PME publicados ao fim do mês 5
