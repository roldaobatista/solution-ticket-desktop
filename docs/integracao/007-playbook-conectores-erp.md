# 007 — Playbook Universal para Criar Conector ERP

**Versão**: 1.0 — 2026-04-26
**Status**: processo padrão obrigatório para todo conector nativo
**Referência rápida**: `docs/PLANO-MODULO-INTEGRACAO.md` seção 13

---

## 1. Princípio

Todo conector ERP nativo passa pelas **mesmas 6 etapas**, na mesma ordem. Essa repetibilidade é o que torna o módulo escalável de 1 para 20 conectores.

```
1. Discovery        ← analista ERP
2. Contrato         ← analista + tech lead
3. Mapeamento       ← integrador + dev
4. Implementação    ← dev sênior + dev pleno
5. Homologação      ← QA + dev + cliente piloto
6. Produção assistida ← dev + suporte + cliente
```

**Tempo médio por conector**:

- PME cloud: 2–3 sprints
- Médio BR: 3–4 sprints
- Tier-1 BR: 4–6 sprints
- Global Tier-1: 5–8 sprints

---

## 2. Etapa 1 — Discovery

### 2.1 Objetivo

Entender o ERP-alvo a fundo antes de escrever uma linha de código.

### 2.2 Quem participa

- **Responsável**: Analista de Integração ERP
- **Apoio**: Tech Lead, PM, consultor ERP do cliente

### 2.3 O que coletar

#### Identificação técnica

- Produto exato + versão
- Cloud / on-premise / híbrido
- URL base de API
- Documentação oficial (link)
- Suporte do fornecedor (canal)

#### Métodos de integração

- REST? OData? SOAP? Webhooks?
- Mensageria? Banco staging?
- Limites e cota de cada método

#### Autenticação

- OAuth? API Key? Certificado?
- Como obter credenciais?
- TTL de token? Refresh?

#### Operação

- Ambiente de homologação disponível?
- Prefixo de teste necessário?
- Como criar massa de teste?
- Limite de chamadas em sandbox?

#### Regras de negócio

- Campos obrigatórios por entidade
- Validações que o ERP faz
- Comportamentos especiais (ex: pedido encerrado não aceita movimento)

#### Erros

- Layout de erro padrão
- Códigos comuns
- Como diferenciar técnico vs negócio

### 2.4 Saída

Documento `docs/integracao/contratos/<erp>.md` seção 1 preenchida.

### 2.5 Critério de aprovação

Tech Lead revisou e validou. Se faltar informação, voltar para Discovery.

---

## 3. Etapa 2 — Contrato

### 3.1 Objetivo

Definir formalmente o que vai/vem entre ST e ERP.

### 3.2 Quem participa

- **Responsável**: Analista ERP + Tech Lead
- **Apoio**: PM, cliente piloto (técnico)

### 3.3 O que definir

#### Direção dos dados

Para cada entidade canônica, quem é dono?

- Cliente, fornecedor, transportadora
- Produto
- Veículo, motorista
- Pedido, contrato
- NF-e
- Ticket de pesagem
- Movimento de estoque

#### Estratégia de mapeamento

- Em que entidade do ERP o ticket de pesagem se traduz?
- Como vincular ao pedido/contrato/NF?
- Como tratar quantidade vs peso?

#### Tratamento de exceções

- Cliente bloqueado: o que fazer?
- Produto inexistente: criar local? falhar?
- Pedido encerrado: rejeitar? converter em outro doc?
- Quantidade > saldo: aceitar parcial? rejeitar tudo?

#### Cancelamento

- Como o ERP suporta? (cancelamento, estorno, reversão, doc corretivo)
- Janela de tempo permitida?

#### Webhooks

- Quais eventos consumir?
- Frequência esperada?
- Latência aceitável?

### 3.4 Saída

`docs/integracao/contratos/<erp>.md` seções 2–3 preenchidas e **assinadas pelo cliente piloto**.

### 3.5 Critério de aprovação

- Cliente piloto confirmou todas as regras
- Tech Lead validou viabilidade técnica
- PM aprovou escopo

---

## 4. Etapa 3 — Mapeamento

### 4.1 Objetivo

Traduzir contrato em mapping YAML executável.

### 4.2 Quem participa

- **Responsável**: Dev Pleno
- **Apoio**: Analista ERP, Dev Sênior

### 4.3 O que produzir

- `mapping/<erp>-default.yaml` — template principal
- Tabelas de equivalência necessárias (lista)
- Regras de validação pré-envio
- Exemplo de payload aceito (fixture)
- Exemplo de payload rejeitado (fixture)

### 4.4 Padrão

Usar `docs/integracao/templates/erp-mapping.yaml` como base.

### 4.5 Saída

- YAML versionado em `connectors/<erp>/mapping/<erp>-default.yaml`
- Documento `docs/integracao/contratos/<erp>.md` seção 3 preenchida

### 4.6 Critério de aprovação

- Validação automática (`POST /api/v1/integration/mapping/validate`) passa
- Preview com payload real (`POST /mapping/preview`) bate com expectativa
- Code review aprovou

---

## 5. Etapa 4 — Implementação

### 5.1 Objetivo

Código do conector pronto para testes.

### 5.2 Quem participa

- **Responsável**: Dev Sênior
- **Apoio**: Dev Pleno

### 5.3 Estrutura padrão

```
backend/src/integracao/connectors/<erp>/
  <erp>.connector.ts        ← implementa IErpConnector
  <erp>.auth.ts             ← estratégia de autenticação
  <erp>.mapper.ts           ← canônico ↔ ERP (orquestra mapping engine)
  <erp>.client.ts           ← HTTP client + retry específico
  <erp>.errors.ts           ← classify(err): 'technical'|'business'
  <erp>.fixtures.ts         ← payloads de teste
  <erp>.connector.spec.ts   ← testes unitários
  <erp>.contract.spec.ts    ← testes de contrato (Pact opcional)
  mapping/<erp>-default.yaml
```

### 5.4 Itens obrigatórios

- [ ] Implementação completa de `IErpConnector`
- [ ] `capabilities()` declara entidades, auth, transport
- [ ] Erro técnico vs negócio classificado em `errors.ts`
- [ ] Rate limit respeitando ERP-alvo
- [ ] Cobertura de testes ≥ 80%
- [ ] Sem `console.log`, sem credencial em log
- [ ] Documentado JSDoc

### 5.5 Critério de aprovação

- CI verde
- Cobertura ≥ 80%
- Code review aprovado
- Testes contra Mock funcionando

---

## 6. Etapa 5 — Homologação

### 6.1 Objetivo

Validar conector em sandbox e em ambiente de pré-produção do cliente.

### 6.2 Quem participa

- **Responsável**: QA + Dev
- **Apoio**: Analista ERP, cliente piloto

### 6.3 O que executar

Plano completo: `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md`.

5 fases (H1 a H5):

- **H1** — validação técnica em sandbox (16 cenários)
- **H2** — cenários de erro (16 cenários técnico + negócio)
- **H3** — carga e resiliência (8 cenários)
- **H4** — homologação assistida com cliente (10 cenários)
- **H5** — produção piloto (sombra → ativo)

### 6.4 Saída

- Relatório de homologação preenchido (`docs/integracao/templates/relatorio-homologacao.md`)
- 100 pesagens reais sem incidente
- Termo de aceite do cliente assinado

### 6.5 Critério de aprovação

- 14 dias em produção sem P0/P1
- Métricas dentro da meta (zero perda, zero duplicidade, latência p95 < 2s)
- Aprovação formal das 6 partes (Tech Lead, Analista ERP, QA, PM, cliente piloto, comercial)

---

## 7. Etapa 6 — Produção assistida

### 7.1 Objetivo

Acompanhar primeiros 30 dias após GA e ajustar.

### 7.2 Quem participa

- **Responsável**: Dev (que implementou) + Suporte
- **Apoio**: Analista ERP

### 7.3 Atividades

- Daily nos 7 primeiros dias com cliente
- Weekly nos próximos 21 dias
- Análise de log + métricas
- Ajuste de mapping se necessário
- Atualização de runbook com aprendizados
- Treinamento do suporte L1 do cliente

### 7.4 Saída

- Runbook atualizado (`docs/runbooks/integracao/<erp>.md`)
- Vídeo de troubleshooting (10 min)
- Conector marcado como **GA estável**

### 7.5 Critério para fechar Produção Assistida

- 30 dias sem incidente P0/P1
- Cliente operando autonomamente
- Suporte L1 do cliente treinado e capaz de resolver top 10 erros

---

## 8. Tabela-resumo

| Etapa                 | Quem lidera   | Tempo       | Saída               |
| --------------------- | ------------- | ----------- | ------------------- |
| 1. Discovery          | Analista ERP  | 1–2 sprints | Contrato seção 1    |
| 2. Contrato           | Analista + TL | 1 sprint    | Contrato seções 2–3 |
| 3. Mapeamento         | Dev Pleno     | 1 sprint    | YAML versionado     |
| 4. Implementação      | Dev Sênior    | 2–4 sprints | Código + testes     |
| 5. Homologação        | QA + Dev      | 5 semanas   | Relatório + aceite  |
| 6. Produção assistida | Dev + Suporte | 4 semanas   | Runbook final + GA  |

---

## 8.1 Versionamento de mapping em produção

Mapping é versionado em banco (`integracao_mapping`), mas promover versão
nova para produção exige fluxo controlado — não basta "ativar versão N+1".

### Promoção via canary

1. Versão N+1 do mapping é salva como `staged` (não ativa).
2. Operador escolhe um **cliente piloto** (geralmente o que solicitou a
   mudança).
3. Conector roteia **10% dos tickets** desse cliente para mapping `staged`;
   90% restantes seguem mapping `active` da versão N.
4. Métricas comparadas após 24h:
   - Taxa de FAILED_TECHNICAL no caminho canary
   - Taxa de FAILED_BUSINESS no caminho canary
   - Diff de latência p95
5. Se canary saudável (≤ baseline + 10%), promove para 100% do cliente
   piloto; depois, gradualmente, aos demais clientes do mesmo conector.

### Shadow run

Antes do canary, recomenda-se 24h de **shadow**:

- Mapping `staged` executa em paralelo ao `active` para os MESMOS tickets.
- O resultado do `staged` é **descartado** (não envia ao ERP).
- Engine compara payloads `active` vs `staged` e registra diff.
- Diff esperado: zero (mudança não-comportamental) ou contido nos campos
  alterados explicitamente.

### Rollback

- Reativar versão N anterior é **operação O(1)** — apenas atualiza flag
  `active` no `integracao_mapping`.
- Tickets em voo que já compilaram mapping N+1 terminam com N+1 (não
  recompilamos meio do processamento). Próximos tickets usam N.
- Auditoria registra: versão anterior, versão nova, operador, motivo,
  janela de canary, métricas do delta.

---

## 8.2 Retry específico por ERP — `respectRetryAfter`

O runtime do conector implementa backoff exponencial padrão (`baseDelayMs`
→ `maxDelayMs`), mas alguns ERPs retornam header **`Retry-After`** que
DEVE ser honrado em vez do backoff calculado. O mapping declara isso
explicitamente em `runtime.respectRetryAfter: true`.

| ERP                  | Honra `Retry-After`?                               | Em qual erro                                   |
| -------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Bling                | **Sim**                                            | 429 (rate limit 3 req/s); às vezes 422         |
| ContaAzul            | **Sim**                                            | 429; ocasionalmente 503 (manutenção planejada) |
| SAP S/4HANA Cloud    | **Sim**                                            | 429 / 503 (gateway)                            |
| Omie                 | Não — usa mensagem "Limite de requisições" no body | aplicar backoff fixo de 60s                    |
| Sankhya MGE clássico | Não — sem header padronizado                       | backoff exponencial padrão                     |
| Sankhya Gateway      | A confirmar Discovery                              | a confirmar                                    |
| TOTVS Protheus REST  | Não documentado                                    | backoff padrão                                 |

Comportamento do runtime quando `respectRetryAfter: true`:

- 429 ou 503 com `Retry-After: <segundos>` → aguarda exatamente esse tempo
  (com clamp em `maxDelayMs`).
- 429 ou 503 com `Retry-After: <HTTP-date>` → calcula delta até o instante.
- Sem `Retry-After` → cai no backoff exponencial padrão.
- Caso o ERP retorne valor absurdo (> 1h), clampa em `maxDelayMs` e
  registra aviso na auditoria.

---

## 8.3 Erros — técnico vs negócio (cross-ERP)

Classificar corretamente é o que separa um conector estável de um conector
que enche a DLQ. Tabela referência:

| Sintoma                         | Bling      | Omie                    | ContaAzul                          | Sankhya                              | SAP                        | Categoria                 |
| ------------------------------- | ---------- | ----------------------- | ---------------------------------- | ------------------------------------ | -------------------------- | ------------------------- |
| Token expirado                  | 401        | n/a (key estática)      | 401 `invalid_token`                | "sessão inválida" (200 com status=0) | 401 OAuth                  | Técnico — refresh + retry |
| Rate limit                      | 429 ou 422 | "Limite de requisições" | 429                                | cluster busy                         | 429                        | Técnico — backoff         |
| Erro genérico do ERP            | 5xx        | `SOAP-ENV:Server`       | 502/503                            | 500 timeout                          | 502/503                    | Técnico — retry           |
| Timeout transitório             | 504        | timeout TCP             | 504                                | timeout JCo                          | 504                        | Técnico — retry           |
| Cliente/parceiro não encontrado | 404 / 422  | `ERR-001`               | 404                                | `MGECOM-XXX`                         | `F2 461`                   | Negócio — DLQ             |
| Produto/material inativo        | 422        | `ERR-002`               | 404/422                            | `MGECOM-XXX`                         | `M3 ###`                   | Negócio — DLQ             |
| Cliente bloqueado               | 422        | bloqueado=S             | 422                                | `MGECOM-XXX`                         | BP block                   | Negócio — DLQ             |
| Período fechado / saldo         | 422        | "saldo"                 | 422 categ.                         | "saldo insuficiente"                 | `M7 021`, `M7 162`         | Negócio — DLQ             |
| Validação genérica              | 400        | `SOAP-FAULT-005`        | 400 `errors[]` ou `{message,code}` | status=0 + `MGECOM-`                 | 400 OData                  | Negócio — DLQ             |
| Permissão / app revogado        | 403        | app_secret inválido     | 403 ou refresh `invalid_grant`     | usuário desativado                   | `invalid_grant` permanente | Negócio — `NEEDS_REAUTH`  |

> **Regra de ouro**: técnico = erro do canal/infra que retentar, sozinho,
> tem chance >0 de resolver. Negócio = exige ação humana (corrigir cadastro,
> liberar período, reconectar app). Em dúvida, classificar como negócio —
> retry infinito de erro de negócio é o que estoura a fila.

---

## 9. Anti-padrões a evitar

| Anti-padrão                            | Por que é ruim                                         |
| -------------------------------------- | ------------------------------------------------------ |
| Pular Discovery                        | Implementação retrabalhada por descobrir regra no meio |
| Mapping em código TypeScript           | Cliente novo exige release                             |
| Acoplar com módulo de negócio          | Quebra ADR-001                                         |
| Confiar em sandbox idêntico à produção | Quase nunca é                                          |
| Single piloto frágil                   | Backup obrigatório                                     |
| Pular H3 (carga)                       | Vai quebrar em pico de safra                           |
| Pular Etapa 6                          | Cliente abandona produto                               |

---

## 10. Material de apoio

- ADR-005 — Conectores plugáveis
- `docs/integracao/templates/erp-mapping.yaml`
- `docs/integracao/templates/relatorio-homologacao.md`
- `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md`
- Exemplo completo: `docs/integracao/contratos/bling.md`
