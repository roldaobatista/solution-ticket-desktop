# Backlog Detalhado — Sprint 5 (Conectores Genéricos + API + UI)

**Sprint**: 5 — Fase 0 — semanas 11–12 — **Sprint final da Fase 0**
**Total story points (recalibrado)**: 28 pts (era 58 — REDUÇÃO DE 30 pts)
**Objetivo**: entregar **2 conectores genéricos essenciais** (REST + CSV) + **API pública v1 essencial** + **UI básica** + **demo end-to-end**.

> ⚠️ **Replanejamento crítico**:
>
> - S5-03 (SFTP) movido para Sprint 6
> - S5-07 (Tela Mapeamento) movida para Sprint 6
> - S5-08 (Reconciliação) movida para Sprint 6
> - S5-02 reduzido a CSV apenas (XML em Sprint 6)
> - S5-04 reduzido a endpoints essenciais
> - S5-05/S5-06 reduzidas a list+create (edição completa em Sprint 6)
>
> ⚠️ **Sprint 6 carry-over alto** (~23 pts) — ver `BACKLOG-SPRINT-6-7-8.md` recalibrado.

**Pré-requisitos**: Sprint 4 (modelo + mapping).

> **DoR e DoD por history**: ver `BACKLOG-SPRINT-0-1.md` (blocos no topo). Aplicam-se a todas as histórias.
> **Estratégia de testes**: ver `ESTRATEGIA-TESTES.md`.

---

## User Stories

### S5-01 — `GenericRestConnector`

**Como** Cliente
**Quero** conector configurável que envia ticket para qualquer endpoint REST
**Para** integrar com sistemas sem precisar de conector dedicado

**Critérios de aceite**:

- [ ] Implementa `IErpConnector`
- [ ] Configuração: URL base, headers, método HTTP, auth (Bearer/Basic/API Key/None)
- [ ] Template de payload via mapping YAML
- [ ] Mapeamento de resposta para extração de external ID
- [ ] Healthcheck via endpoint configurável
- [ ] Cobertura ≥ 85%

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior

---

### S5-02 — `GenericCsvXmlConnector`

**Como** Cliente
**Quero** conector que exporta tickets para arquivo CSV/XML
**Para** integrar com ERPs legados via arquivo

**Critérios de aceite**:

- [ ] CSV: separador, encoding, header configuráveis
- [ ] XML: template Mustache-like configurável
- [ ] Pasta de saída configurável (caminho local ou rede)
- [ ] Nome de arquivo via template (`ticket_{{numero}}_{{data}}.csv`)
- [ ] Append vs novo arquivo configurável
- [ ] Watcher de pasta de retorno (opcional)
- [ ] Testes com 5 layouts diferentes

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

### S5-03 — `GenericSftpConnector`

**Como** Cliente
**Quero** conector SFTP para envio/recebimento de arquivos
**Para** integrar com ERPs que só aceitam SFTP

**Critérios de aceite**:

- [ ] Auth: senha ou chave SSH
- [ ] Upload de arquivo gerado pelo CSV/XML connector
- [ ] Download de arquivos de retorno
- [ ] Retentativa em caso de falha de rede
- [ ] Validação de checksum opcional
- [ ] Testes com servidor SFTP mock

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

### S5-04 — `PublicIntegrationController` v1

**Como** Sistema externo
**Quero** API REST pública para consultar e disparar integrações
**Para** que clientes integrem via iPaaS ou scripts

**Critérios de aceite**:

- [ ] Endpoints conforme PLANO seção 12.3 (16 endpoints mínimos)
- [ ] OpenAPI/Swagger gerado
- [ ] Autenticação via API Key (do plano Pro)
- [ ] Rate limit por tenant
- [ ] Header `Idempotency-Key` aceito em POSTs
- [ ] Testes e2e para cada endpoint
- [ ] Documentação publicada em `/api/v1/integration/docs`

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior

---

### S5-05 — Tela de Conectores (frontend)

**Como** Administrador
**Quero** UI para configurar conectores
**Para** usar sem editar JSON ou YAML manualmente

**Critérios de aceite**:

- [ ] Lista de conectores ativos com status (verde/amarelo/vermelho)
- [ ] Wizard "criar conector": tipo → ambiente → URL → auth → entidades → teste
- [ ] Botão "testar conexão"
- [ ] Edição de credenciais (com mascaramento)
- [ ] Ativar/desativar
- [ ] Clonar perfil
- [ ] Exportar configuração sem credenciais
- [ ] Permissões respeitadas (botões habilitados conforme `INTEGRACAO_*`)

**Estimativa**: 8 pontos
**Responsável**: Dev Frontend

---

### S5-06 — Tela de Eventos (frontend)

**Como** Suporte
**Quero** lista de eventos com filtros e ações
**Para** diagnosticar problemas em < 10 min

**Critérios de aceite**:

- [ ] Filtros: data, ERP, unidade, ticket, placa, status, tipo de erro
- [ ] Colunas: timestamp, ticket, ERP, status, tentativas, último erro
- [ ] Detalhe do evento: payload canônico, payload enviado, resposta do ERP
- [ ] Ações: reprocessar, cancelar, ignorar, exportar diagnóstico
- [ ] Permissão `INTEGRACAO_VER_PAYLOAD` esconde payload se ausente
- [ ] Tempo de carregamento < 1s para 1000 eventos

**Estimativa**: 8 pontos
**Responsável**: Dev Frontend

---

### S5-07 — Tela de Mapeamento (editor visual)

**Como** Integrador
**Quero** editor visual de mapping
**Para** configurar sem editar YAML diretamente

**Critérios de aceite**:

- [ ] Interface de campos local ↔ remoto
- [ ] Dropdown de tipo de transformação
- [ ] Pré-visualização do YAML gerado
- [ ] **Botão "testar com payload real"** — pega último ticket e mostra payload final
- [ ] Validação inline (campos obrigatórios, expressão válida)
- [ ] Save com versionamento (preserva histórico)

**Estimativa**: 5 pontos
**Responsável**: Dev Frontend

---

### S5-08 — Reconciliação básica

**Como** Suporte
**Quero** relatório de pendências e divergências
**Para** identificar tickets não chegados ao ERP

**Critérios de aceite**:

- [ ] Job manual + agendado (configurável)
- [ ] Compara: tickets fechados localmente × confirmados no ERP
- [ ] Categorias: enviados-confirmados, enviados-pendentes, rejeitados, divergentes (quantidade), não-enviados
- [ ] Relatório exportável (CSV/PDF)
- [ ] Tela com filtros e drilldown

**Estimativa**: 8 pontos
**Responsável**: Dev Sênior + Dev Frontend

---

### S5-09 — Demo end-to-end com cliente piloto técnico

**Como** PM
**Quero** demo presencial/remota com cliente piloto
**Para** validar Fase 0 e capturar feedback

**Critérios de aceite**:

- [ ] Cliente piloto identificado (S0-04) confirmado
- [ ] Cenário acordado: configura perfil → testa → envia 10 tickets via REST genérico → vê dashboard → reprocessa erro
- [ ] Demo executada com sucesso
- [ ] Feedback documentado em retrospectiva da Fase 0
- [ ] Relatório de aceite agentico Fase 0 gerado em `docs/auditoria/agentic/`

**Estimativa**: 3 pontos
**Responsável**: PM + Tech Lead

---

## Definition of Done do Sprint 5 (e da Fase 0)

- [ ] Todos os critérios das histórias S5-\* validados
- [ ] DoD por history cumprida em todas as S5-\*
- [ ] CI verde, cobertura ≥ 70% linhas novas (95% em API pública e GenericRest)
- [ ] **TCK ≥ 90%** em GenericRest e Mock
- [ ] **Contract test verde** (Pact) Hub↔GenericRest + API pública contra OpenAPI (Schemathesis)
- [ ] **DAST (OWASP ZAP) baseline** rodado contra `:3002` — sem high abertos
- [ ] **Smoke E2E** Playwright cobrindo fluxo Tela Conectores → criar perfil → enviar ticket → ver evento
- [ ] **Demo Fase 0 gravada com cliente piloto técnico — sucesso**
- [ ] `Agent-Orchestrator` publica **GO/PIVOT/NO-GO para Fase 1**
- [ ] Retrospectiva da Fase 0 documentada
- [ ] Decisão final do conector piloto Fase 1 (Bling vs Sankhya) confirmada
- [ ] Cliente piloto comercial Fase 1 identificado
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-5/`**

## Capacity

| Recurso      | Disponibilidade              |
| ------------ | ---------------------------- |
| Tech Lead    | 50% (review + reconciliação) |
| Dev Sênior   | 100%                         |
| Dev Pleno    | 100%                         |
| Dev Frontend | 100%                         |
| QA           | 70% (e2e da Fase 0)          |
| PM           | 50% (demo + planning Fase 1) |

**Total story points**: 28 (recalibrado — S5-03/S5-07/S5-08 movidos para Sprint 6; S5-02/S5-04/S5-05/S5-06 reduzidos a essenciais)

## Riscos

| Risco                                      | Mitigação                                             |
| ------------------------------------------ | ----------------------------------------------------- |
| Cliente piloto desiste antes da demo       | Backup identificado em Sprint 0                       |
| Frontend não acompanha velocity do backend | Stories de UI priorizadas; backend entrega API antes  |
| Demo expõe bug crítico                     | Bug bash interno na semana 11; correção até semana 12 |
| Tela de mapeamento muito complexa para v1  | Cortar features avançadas; manter editor básico       |
