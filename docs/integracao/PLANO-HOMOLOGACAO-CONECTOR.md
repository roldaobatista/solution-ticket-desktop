# Plano de Homologação por Conector

**Aplicável a**: todo conector ERP nativo antes de ir para "GA" (general availability)
**Referência**: `docs/PLANO-MODULO-INTEGRACAO.md` seção 13 (Playbook Universal — Etapa 5)
**Versão**: 1.1 — 2026-04-29 (agent-first)

> **Regra agentic:** homologação técnica fecha em `TECH_READY` ou `PILOT_READY` com evidências do `EVIDENCE-MANIFEST.md`. Assinatura de cliente, DPO, CISO, jurídico ou diretoria é dependência externa para `COMMERCIAL_GA_READY`, não gate interno de engenharia.

---

## 1. Quando aplicar

Este plano é executado na **Etapa 5 do Playbook Universal**, após:

- Discovery completo (Etapa 1)
- Contrato técnico revisado por `ERP-Specialist-Agent` (Etapa 2)
- Mapping definido (Etapa 3)
- Implementação concluída em sandbox (Etapa 4)

Sem completar este plano, o conector **não pode** ser ofertado a clientes finais.

---

## 2. Pré-requisitos

### 2.1 Ambiente

- [ ] Sandbox do ERP disponível e estável
- [ ] Credenciais de homologação criadas e armazenadas no cofre
- [ ] Massa de teste cadastrada no sandbox (lista mínima na seção 4)
- [ ] Solution Ticket instalado em ambiente isolado (não produção do cliente)
- [ ] Versão do conector congelada (tag git)
- [ ] Mapping YAML do conector finalizado

### 2.2 Subagentes

- `Architecture-Agent` (responsável por arquitetura)
- `Backend-Agent` que implementou o conector
- `ERP-Specialist-Agent` (responsável pelo Discovery)
- `QA-Automation-Agent`
- `SRE-Agent`
- `Security-Agent`
- Cliente piloto/consultor ERP real, quando existir, entra como fonte externa de evidência, não como assinatura obrigatória

### 2.3 Documentação obrigatória

- Contrato técnico (`docs/integracao/contratos/<erp>.md`)
- Mapping default (`mapping/<erp>-default.yaml`)
- Runbook operacional (`docs/runbooks/integracao/<erp>.md`)
- Vídeo de configuração (5 min)

---

## 3. Estrutura do plano

A homologação tem **5 fases sequenciais**:

| Fase | Objetivo                                                             | Duração   |
| ---- | -------------------------------------------------------------------- | --------- |
| H1   | Validação técnica em sandbox                                         | 3–5 dias  |
| H2   | Testes de cenários de erro                                           | 2–3 dias  |
| H3   | Testes de carga e resiliência                                        | 2 dias    |
| H4   | Homologação assistida/sombra com cliente real ou fixture equivalente | 2 semanas |
| H5   | Produção piloto (sombra → ativo)                                     | 2 semanas |

**Total**: ~5 semanas por conector. Conector só é "GA" ao fim de H5 sem incidentes P0/P1.

---

## 4. Massa de teste mínima

Cadastrar no sandbox do ERP:

### 4.1 Parceiros (clientes/fornecedores/transportadoras)

- 5 clientes ativos com CNPJ válido
- 2 clientes bloqueados (testar rejeição)
- 3 fornecedores
- 2 transportadoras

### 4.2 Produtos

- 10 produtos ativos (variar unidade: kg, ton, saca)
- 2 produtos com código fiscal NCM diferente
- 1 produto bloqueado

### 4.3 Veículos / Motoristas

- 5 veículos com placa válida (formatos antigo e Mercosul)
- 5 motoristas com CPF válido

### 4.4 Pedidos / Ordens

- 3 pedidos de venda em aberto
- 3 pedidos de compra em aberto
- 1 pedido encerrado (testar rejeição)
- 1 pedido cancelado

### 4.5 Documentos fiscais

- 2 NF-e válidas (XML disponível)
- 1 NF-e cancelada
- 1 CT-e

---

## 5. Fase H1 — Validação técnica em sandbox

### Cenários obrigatórios (16 testes)

| #     | Cenário                                | Esperado                             | Status |
| ----- | -------------------------------------- | ------------------------------------ | ------ |
| H1.01 | Teste de conexão                       | OK 200                               | ☐      |
| H1.02 | Pull de parceiros (página 1)           | Lista correta                        | ☐      |
| H1.03 | Pull de parceiros (paginação completa) | Sem perda, sem duplicação            | ☐      |
| H1.04 | Pull de produtos                       | Lista correta com unidade            | ☐      |
| H1.05 | Pull incremental (checkpoint)          | Apenas alterados desde último        | ☐      |
| H1.06 | Push de ticket simples (compra)        | Aceito + ID externo retornado        | ☐      |
| H1.07 | Push de ticket com desconto de umidade | Quantidade ajustada correta          | ☐      |
| H1.08 | Push de ticket com tara conhecida      | Tara não recalculada                 | ☐      |
| H1.09 | Push de ticket vinculado a pedido      | Pedido baixado/movimentado           | ☐      |
| H1.10 | Push de ticket vinculado a NF-e        | Conferência registrada               | ☐      |
| H1.11 | Push de cancelamento                   | Documento cancelado/estornado no ERP | ☐      |
| H1.12 | Push de correção (revision +1)         | Documento corretivo gerado           | ☐      |
| H1.13 | Push duplicado (mesma idempotency key) | NÃO duplica no ERP                   | ☐      |
| H1.14 | Pull de status de envio                | Status atualizado corretamente       | ☐      |
| H1.15 | Reconciliação básica                   | Identifica divergência intencional   | ☐      |
| H1.16 | Ler external_link após sucesso         | Vínculo persistido corretamente      | ☐      |

### Critério de fechamento H1

- 100% dos testes passando
- Cobertura de testes do conector ≥ 80%
- Sem `console.log` ou logs com payload sensível
- Review agentico de especificação e qualidade aprovado

---

## 6. Fase H2 — Cenários de erro

### Erros técnicos (devem entrar em retry)

| #     | Cenário                         | Esperado                           | Status |
| ----- | ------------------------------- | ---------------------------------- | ------ |
| H2.01 | ERP fora do ar (timeout)        | Retry automático com backoff       | ☐      |
| H2.02 | ERP retorna 500                 | Retry até N tentativas, depois DLQ | ☐      |
| H2.03 | ERP retorna 503 com Retry-After | Respeita header                    | ☐      |
| H2.04 | Token OAuth expirado            | Renovação automática               | ☐      |
| H2.05 | Rate limit excedido (429)       | Pausa e retoma                     | ☐      |
| H2.06 | Certificado TLS inválido        | Falha imediata sem retry           | ☐      |
| H2.07 | DNS não resolve                 | Retry com backoff                  | ☐      |
| H2.08 | Conexão TCP recusada            | Retry com backoff                  | ☐      |

### Erros de negócio (NÃO retentam, exigem ação humana)

| #     | Cenário                    | Esperado                               | Status |
| ----- | -------------------------- | -------------------------------------- | ------ |
| H2.09 | Produto inexistente no ERP | Falha imediata, status FAILED_BUSINESS | ☐      |
| H2.10 | Cliente bloqueado          | Falha imediata, status FAILED_BUSINESS | ☐      |
| H2.11 | Pedido encerrado           | Falha imediata, status FAILED_BUSINESS | ☐      |
| H2.12 | Quantidade excedida        | Falha imediata, status FAILED_BUSINESS | ☐      |
| H2.13 | Período contábil fechado   | Falha imediata, status FAILED_BUSINESS | ☐      |
| H2.14 | CNPJ inválido              | Validação local pré-envio              | ☐      |
| H2.15 | Campo obrigatório ausente  | Validação local pré-envio              | ☐      |
| H2.16 | NF-e com chave inválida    | Validação local pré-envio              | ☐      |

### Critério de fechamento H2

- Classificação técnico/negócio correta em **todos** os cenários
- Mensagem de erro clara para o operador (não stack trace)
- Erros técnicos resolvem sozinhos quando ERP volta
- Erros de negócio aparecem na UI com ação sugerida

---

## 7. Fase H3 — Carga e resiliência

### Definição de baseline e throughput-alvo (recalibrada)

- **Baseline = volume médio do cliente piloto** medido nos primeiros **30 dias** de operação real (média móvel diária de pesagens × eventos derivados). Sem 30 dias medidos, usar estimativa do cliente × 1.3 como conservador.
- **Throughput-alvo mínimo por tier** (sustentado, não pico):

| Tier do plano          | Throughput sustentado | Pico (curta janela ≤ 5min) |
| ---------------------- | --------------------- | -------------------------- |
| **Pro**                | 50 ev/min             | 150 ev/min                 |
| **Enterprise**         | 200 ev/min            | 600 ev/min                 |
| **Tier-1 (SAP/TOTVS)** | 500 ev/min            | 1500 ev/min (negociado)    |

H3 deve provar que o conector atinge **mínimo do tier** + **10× volume baseline do cliente piloto** sem degradação > 20% na latência p95.

### Testes

| #     | Cenário                                                  | Meta                                                | Status |
| ----- | -------------------------------------------------------- | --------------------------------------------------- | ------ |
| H3.01 | 1.000 tickets em fila, processar tudo                    | < 10 min                                            | ☐      |
| H3.02 | 10x volume médio do cliente piloto                       | Sem degradação > 20%                                | ☐      |
| H3.03 | ERP fica fora 1h, tickets se acumulam                    | Retoma sem perda quando volta                       | ☐      |
| H3.04 | Solution Ticket reinicia durante processamento           | Eventos em "processing" voltam para "pending"       | ☐      |
| H3.05 | Worker concorrente (**2 + 4 + 8 instâncias** — escalada) | Lock pessimista evita duplicação em todos os níveis | ☐      |
| H3.06 | DLQ chega a 100 itens                                    | Alerta dispara                                      | ☐      |
| H3.07 | Reprocessamento em lote (50 itens)                       | Sem corrupção, sem duplicidade                      | ☐      |
| H3.08 | Pull de 10.000 produtos com paginação                    | Memória estável                                     | ☐      |

### Critério de fechamento H3

- 100% dos testes passando
- Latência p95 < 2s para push
- Memória do backend não cresce > 200MB durante 24h de carga
- CPU média < 30%

---

## 8. Fase H4 — Homologação assistida/sombra

### Setup

- Solution Ticket instalado em **ambiente de pré-produção do cliente**
- Conectado ao **sandbox do ERP do cliente** (não produção ainda)
- Massa de teste real do cliente (anonimizada se necessário)
- Cliente piloto real, se existir; sem cliente real, usar persona/fixture operacional e registrar `BLOCKED_EXTERNAL` comercial em `EXTERNAL-DEPENDENCIES.md`

### Cenários (executados por cliente real ou `QA-Automation-Agent`)

| #     | Cenário                                             | Executor agentic/default                    | Status |
| ----- | --------------------------------------------------- | ------------------------------------------- | ------ |
| H4.01 | Configurar perfil de integração via UI              | `QA-Automation-Agent` ou técnico do cliente | ☐      |
| H4.02 | Testar conexão                                      | `QA-Automation-Agent` ou técnico do cliente | ☐      |
| H4.03 | Importar cadastros                                  | `QA-Automation-Agent` ou técnico do cliente | ☐      |
| H4.04 | Editar mapping pela UI                              | `QA-Automation-Agent` ou técnico do cliente | ☐      |
| H4.05 | Operador faz pesagem real/simulada e envia          | `QA-Automation-Agent` ou operador           | ☐      |
| H4.06 | Operador cancela ticket enviado                     | `QA-Automation-Agent` ou operador           | ☐      |
| H4.07 | Erro intencional + reprocessamento                  | `QA-Automation-Agent` ou técnico do cliente | ☐      |
| H4.08 | Reconciliação + relatório de divergência            | `QA-Automation-Agent` ou técnico do cliente | ☐      |
| H4.09 | Material de suporte L1 validado                     | `Support-Agent`                             | ☐      |
| H4.10 | Relatório de aceite agentico de pré-produção gerado | `Agent-Orchestrator`                        | ☐      |

### Pesagens reais

- Mínimo **100 pesagens reais** processadas com sucesso
- 0 perda
- 0 duplicidade
- 100% rastreáveis via correlation ID

### Critério de fechamento H4

- Fluxos self-service executam sem intervenção do implementador
- 100 pesagens sem incidente
- Relatório de evidências H4 gerado
- Runbook revisado com base no feedback
- **Pentest executado e sem high abertos** (ver §"Pentest em H4" abaixo)

### Pentest em H4 (obrigatório)

Antes de liberar H5 (produção piloto), executar **pentest gated** focado no conector:

- **DAST automatizado** com OWASP ZAP contra a superfície exposta:
  - API pública `:3002` (se aplicável ao conector — webhooks recebidos)
  - Relay cloud (se conector usa webhook inbound)
  - Endpoint do ERP em sandbox via proxy man-in-the-middle controlado (apenas para validar TLS pinning, headers, ausência de credenciais em URL)
- **Revisão de chaves**:
  - Rotação testada (refresh token + chave de webhook)
  - Sem credencial em log (gitleaks no histórico)
  - DPAPI escopo correto (CurrentUser conforme ADR)
  - HMAC + timestamp em webhooks recebidos (replay window ≤ 5min)
- **Critério de aprovação**: zero `high` ou `critical`. Findings `medium` documentados com prazo. `low` aceitos com waiver curto.
- Relatório arquivado em `docs/integracao/relatorios-homologacao/<erp>-<data>-pentest.md`.

---

## 9. Fase H5 — Produção piloto (sombra → ativo)

### Modo Sombra (semana 1)

Solution Ticket envia para **produção do ERP** mas:

- Cliente continua com processo antigo (manual ou ferramenta anterior)
- `SRE-Agent`/`QA-Automation-Agent` compara resultados diariamente por relatório
- Divergências corrigidas imediatamente

| #     | Verificação diária                      | Status |
| ----- | --------------------------------------- | ------ |
| H5.01 | Todos os tickets do dia chegaram ao ERP | ☐      |
| H5.02 | 0 divergência de quantidade             | ☐      |
| H5.03 | 0 cliente/produto não-encontrado        | ☐      |
| H5.04 | Latência média < 2s                     | ☐      |
| H5.05 | DLQ vazia                               | ☐      |

### Modo Ativo (semana 2)

- Cliente real desliga processo antigo quando existir; em execução agentic, o cenário é simulado e marcado como evidência técnica
- Solution Ticket é única fonte de envio ao ERP
- Acompanhamento intensivo por telemetria e relatório diário

### Critério de fechamento H5 (`PILOT_READY`) — recalibrado pós-auditoria

**Critérios de tempo + volume + diversidade** (todos obrigatórios):

- **Tempo**: 14 dias consecutivos sem incidente P0/P1
- **Volume**: ≥ 50 pesagens/dia em pelo menos 10 dos 14 dias
- **Pico**: pelo menos 1 dia com ≥ 80% do volume estimado de pico do cliente (não passar GA sem testar pico real)
- **Diversidade de cenários**: pelo menos 3 dos top-10 erros do runbook efetivamente observados-e-resolvidos no período
- **Métricas operacionais**:
  - 0 perda
  - 0 duplicidade
  - DLQ < 5 itens em qualquer momento
  - Latência p95 < 2s
- Relatório de produção piloto emitido. Termo externo, se existir, fica em `BLOCKED_EXTERNAL` para `COMMERCIAL_GA_READY`.
- Runbook final publicado
- Vídeo de onboarding atualizado com aprendizados

> ⚠️ Critério "14 dias sem P0" sozinho era falsificável (cliente passar 2 semanas com 2 pesagens/dia). Recalibração obriga volume real + diversidade.

---

## 10. Pós-homologação

### Após GA

- Conector publicado no portal
- Adicionado à página de pricing
- Sales liberado para vender
- Inside sales treinado (1h)
- Marketing publica case (com permissão do cliente)

### Monitoramento contínuo

- Alerta P0 → time on-call
- Review semanal das métricas do conector por 90 dias
- Após 90 dias estável, conector entra em monitoramento padrão

### Plano de rollback

Se conector apresentar incidente P0 após GA:

1. Cliente afetado é colocado em modo "manual" (export CSV)
2. Time investiga em < 4h
3. Hotfix em < 24h
4. Re-homologação parcial antes de reativar

---

## 11. Documentação final

Ao fim da homologação, garantir que existem:

- [ ] `docs/integracao/contratos/<erp>.md` — Discovery + Contrato
- [ ] `docs/integracao/templates/<erp>-mapping.yaml` — Mapping default
- [ ] `docs/runbooks/integracao/<erp>.md` — Top 10 erros + solução
- [ ] `docs/integracao/relatorios-homologacao/<erp>-<data>.md` — Resultados de cada fase H1–H5
- [ ] Vídeo de configuração (5 min) publicado
- [ ] Vídeo de troubleshooting (10 min) publicado
- [ ] Página no portal de conectores

---

## 12. Evidências finais

Para conector chegar a `TECH_READY`, exigir evidências:

- [ ] `Architecture-Agent` — qualidade técnica
- [ ] `ERP-Specialist-Agent` — cobertura funcional
- [ ] `QA-Automation-Agent` — cobertura de testes H1-H5
- [ ] `SRE-Agent` — SLO, rollback e observabilidade
- [ ] `Security-Agent` — SAST/DAST/secret scan e threat model
- [ ] `LGPD-Legal-Agent` — DPIA/ROPA/matriz e riscos externos

Para `COMMERCIAL_GA_READY`, anexar também os artefatos externos resolvidos em `EXTERNAL-DEPENDENCIES.md`.

---

## Anexos

- Template de relatório por fase: `docs/integracao/templates/relatorio-homologacao.md`
- Template de termo de aceite: `docs/integracao/templates/termo-aceite-cliente.md`
- Checklist consolidado: `docs/integracao/checklists/homologacao-conector.md`
