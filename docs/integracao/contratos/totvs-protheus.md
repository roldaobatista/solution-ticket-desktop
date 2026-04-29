# Contrato Técnico — Conector TOTVS Protheus

**Status**: Rascunho v1.0 — 2026-04-26
**Conector**: `totvs-protheus` (categoria: Tier-1 BR)
**ERP**: TOTVS Protheus (várias versões + customizações)
**Owner**: Analista Integração ERP + Tech Lead

> ⚠️ **Particularidade crítica**: Protheus é altamente customizado por cliente. Este contrato define **base** — cada cliente exige Discovery próprio.
>
> 🔴 **Auditoria 2026-04-26 identificou erros factuais (CRITICAL C4)**:
>
> 1. Endpoint `/rest/integracao/movimento` na seção 3.2/4 é **inventado** — Protheus REST Harpia usa namespace `/rest/<servico>` configurado caso a caso pelo cliente. `MATA241` historicamente NÃO tem endpoint REST padrão; exige adapter ADVPL/TLPP escrito pelo cliente.
> 2. Mapping com `expression: ticket.partner.externalId.split('/')[0]` usa função fora da whitelist do mapping engine (006-mapping-engine §4.3). Aguardar adição de `split` declarativo OU reescrever campo.
>
> **Corrigir antes do Sprint 12**: substituir endpoint por placeholder `{cliente.adapterPath}` e documentar que adapter ADVPL é responsabilidade da consultoria Protheus do cliente.

---

## 1. Discovery (genérico)

| Item              | Valor                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Produto           | TOTVS Protheus (Microsiga)                                                                                             |
| Versões comuns    | 12.1.x (LTS), Harpia (2023+)                                                                                           |
| Documentação      | api.totvs.com.br + portal Protheus                                                                                     |
| Métodos           | REST API (Harpia 2023+), SOAP WS clássico, ADVPL TLPP, integração via TOTVS Carol/iPaaS, banco direto (último recurso) |
| Auth              | Token via login Protheus + escopos por usuário                                                                         |
| Rate limit        | Não documentado oficialmente; depende do dimensionamento do cliente                                                    |
| Sandbox           | Cliente provê (sempre) — Protheus não é cloud puro                                                                     |
| Programa parceria | **Obrigatório** — TOTVS Partner Program                                                                                |

---

## 2. Contrato

### 2.1 Direção

| Entidade              | Direção           | Dono           | Tabela Protheus padrão          |
| --------------------- | ----------------- | -------------- | ------------------------------- |
| Cliente               | Protheus → ST     | Protheus       | SA1                             |
| Fornecedor            | Protheus → ST     | Protheus       | SA2                             |
| Transportadora        | Protheus → ST     | Protheus       | SA4                             |
| Produto               | Protheus → ST     | Protheus       | SB1                             |
| Veículo               | Configurável      | Cliente decide | DA3 (frota) ou local            |
| Motorista             | Configurável      | Cliente decide | DA4 ou local                    |
| Pedido de venda       | Protheus → ST     | Protheus       | SC5/SC6                         |
| Pedido de compra      | Protheus → ST     | Protheus       | SC7                             |
| Romaneio agro         | Bidirecional      | Negociar       | NN5/NN6 (Agro)                  |
| **Ticket de pesagem** | **ST → Protheus** | **ST**         | Vira documento de entrada/saída |
| Movimento de estoque  | ST → Protheus     | ST             | SD1 (entrada) / SD2 (saída)     |
| Cancelamento          | ST → Protheus     | ST             | Reversão SD1/SD2                |

### 2.2 Estratégia (varia muito por cliente)

Opções típicas:

1. **Documento de entrada (SD1)** — para recebimento (compra)
2. **Documento de saída (SD2)** — para expedição (venda)
3. **Romaneio NN5/NN6** — para agro (recebimento de produtor)
4. **Ordem de produção** — para indústria
5. **Tabela customizada (Z\*)** — quando cliente tem schema próprio

**Decisão**: definida em Discovery por cliente, documentada em mapping específico.

### 2.3 Tratamento de exceções

| Evento                             | Comportamento            |
| ---------------------------------- | ------------------------ |
| Cliente bloqueado (SA1->A1_MSBLQL) | `FAILED_BUSINESS`        |
| Produto bloqueado (SB1->B1_MSBLQL) | `FAILED_BUSINESS`        |
| Pedido encerrado                   | `FAILED_BUSINESS`        |
| Saldo de pedido excedido           | `FAILED_BUSINESS`        |
| Período contábil fechado           | `FAILED_BUSINESS`        |
| Token expirado                     | Re-login automático      |
| 401                                | Re-login + retry uma vez |
| 5xx                                | Retry com backoff        |

---

## 3. Mapeamento (template — customizar por cliente)

### 3.1 Pull cliente Protheus → CanonicalPartner

| Campo SA1            | Canônico            | Transformação            |
| -------------------- | ------------------- | ------------------------ |
| `A1_COD` + `A1_LOJA` | `externalId`        | concat com `/`           |
| `A1_CGC`             | `taxId`             | normalize digits-only    |
| `A1_NOME`            | `name`              | direct                   |
| `A1_NREDUZ`          | `fantasyName`       | direct                   |
| `A1_INSCR`           | `stateRegistration` | direct                   |
| `A1_MSBLQL`          | `status`            | condition: `1` → BLOCKED |

### 3.2 Push ticket → SD1 (entrada — compra/recebimento)

> ⚠️ **Endpoint provido pelo cliente**: Protheus REST Harpia usa namespace customizável `/rest/<servico>`. Não há endpoint REST padrão para movimento de estoque (`MATA241`) — exige adapter ADVPL/TLPP escrito pela consultoria Protheus do cliente OU uso de SOAP WS clássico.
>
> Configurar `path` no profile do cliente em Discovery. Exemplo abaixo usa placeholder `<adapterPath>` que será substituído.

```yaml
version: 1
connector: totvs-protheus
entity: WeighingTicket
operation: push
endpoint:
  method: POST
  path: /rest/<adapterPath> # ex: /rest/INTEG_PESAGEM/v1/movimento
  # Configurado no integracao_profile do cliente

fields:
  - remote: D1_FILIAL
    local: ticket.unitId
    type: lookup
    table: unit-protheus-filial

  - remote: D1_DOC
    local: ticket.ticketNumber
    type: direct

  - remote: D1_SERIE
    type: fixed
    value: '1'

  # JSONata: $split() é função built-in disponível no whitelist (ADR-011)
  - remote: D1_FORNECE
    type: expression
    expression: "$split(ticket.partner.externalId, '/')[0]"

  - remote: D1_LOJA
    type: expression
    expression: "$split(ticket.partner.externalId, '/')[1]"

  - remote: D1_COD
    local: ticket.product.externalId
    type: direct

  - remote: D1_QUANT
    local: ticket.weights.netKg
    type: unit-convert
    from: kg
    to: kg
    decimals: 3

  - remote: D1_UM
    type: fixed
    value: 'KG'

  - remote: D1_DTDIGIT
    local: ticket.timestamps.closedAt
    type: date-format
    format: YYYYMMDD

  # Campos customizados típicos (cliente customiza)
  - remote: D1_AD_TICKETNUM
    local: ticket.ticketNumber
    type: direct

  - remote: D1_AD_PLACA
    local: ticket.vehicle.plate
    type: normalize
    rule: uppercase

response:
  externalIdPath: '$.recno'
  successCondition: '$.success == true'
```

### 3.3 Tabelas de equivalência (quase sempre necessárias)

| Tabela                   | Origem       | Destino               | Quem mantém |
| ------------------------ | ------------ | --------------------- | ----------- |
| `unit-protheus-filial`   | unidade ST   | D1_FILIAL             | Cliente     |
| `product-protheus`       | código local | B1_COD                | Cliente     |
| `tipo-operacao-protheus` | tipo ST      | tipo movimento        | Cliente     |
| `armazem-protheus`       | unidade ST   | local de estoque (LE) | Cliente     |

---

## 4. Endpoints (depende da versão e do cliente)

> ⚠️ **Endpoints REST do Protheus NÃO são padronizados** — cada cliente publica seu próprio namespace conforme adapter ADVPL/TLPP customizado. Endpoints abaixo são **exemplos típicos**, não contratos oficiais TOTVS.

### Harpia (2023+) — exemplos de cliente

| Operação       | Método | Endpoint exemplo                                          |
| -------------- | ------ | --------------------------------------------------------- |
| Login          | POST   | `/api/oauth2/v1/token` (padrão Harpia)                    |
| Pull cliente   | GET    | `/rest/<adapterPath>/sa1?page=N` (configurar por cliente) |
| Push movimento | POST   | `/rest/<adapterPath>/movimento` (configurar por cliente)  |

### Protheus clássico (12.1) — SOAP WS

SOAP WS publicado pelo cliente conforme transação. Funções clássicas relacionadas:

- `MATA103` (entrada de mercadoria — recebimento)
- `MATA200` (recebimento de compras)
- `MATA241` (movimento de estoque interno — sem REST nativo, exige adapter ADVPL)
- `MATA410` (pedidos de venda)
- `MATA241` (movimento de estoque)

ADVPL/TLPP customizado também é comum.

---

## 5. Webhooks

Protheus **não tem webhook nativo**. Estratégia:

- **Polling** com checkpoint em campos `*_DATA`/`*_USERLGI`
- TBC (TOTVS Business Connect) para mensageria — opcional
- ADVPL trigger publicando em fila externa — quando cliente aceitar customização

---

## 6. Erros conhecidos

| Categoria | Padrão                      | Ação             |
| --------- | --------------------------- | ---------------- |
| Técnico   | "Erro de Lock"              | Retry            |
| Técnico   | Timeout SQL                 | Retry            |
| Técnico   | Sessão expirada             | Re-login + retry |
| Negócio   | "Cliente bloqueado"         | DLQ              |
| Negócio   | "Saldo insuficiente"        | DLQ              |
| Negócio   | "Período fechado"           | DLQ + alerta     |
| Negócio   | Validação ADVPL customizada | DLQ              |

Formato (varia por implementação):

```json
{
  "code": "...",
  "message": "Mensagem do Protheus",
  "stackTrace": "..."
}
```

Conector parsa mensagem para `lastError`.

---

## 7. Massa de teste

- 5 clientes SA1 ativos + 2 bloqueados
- 5 fornecedores SA2
- 3 transportadoras SA4
- 10 produtos SB1 (variar TS/TES)
- 2 filiais
- 3 armazéns (LE)

---

## 8. Estrutura

```
backend/src/integracao/connectors/totvs-protheus/
  totvs-protheus.connector.ts
  totvs-protheus.auth.ts       # token + re-login
  totvs-protheus.client.ts     # REST + SOAP fallback
  totvs-protheus.mapper.ts
  totvs-protheus.errors.ts
  totvs-protheus.fixtures.ts
  totvs-protheus.connector.spec.ts
  mapping/totvs-protheus-default.yaml      # template
  mapping/totvs-protheus-agro.yaml         # vertical agro
  mapping/totvs-protheus-industria.yaml    # vertical indústria
```

---

## 9. Riscos específicos

| Risco                                                            | Mitigação                                       |
| ---------------------------------------------------------------- | ----------------------------------------------- |
| **Cada cliente tem schema diferente** (campos AD\__, tabelas Z_) | Mapping editável via UI; templates por vertical |
| Programa parceria TOTVS demora (3–6 meses)                       | Iniciar mês 1 da Fase 0                         |
| Sandbox é responsabilidade do cliente                            | PoC só com cliente que tem ambiente             |
| Versões diferentes (12.1 vs Harpia)                              | 2 implementações separadas no client            |
| Customização ADVPL pode mudar comportamento                      | Discovery profundo + validação por cliente      |
| Performance varia muito (cliente com servidor pequeno)           | Testes de carga no ambiente real                |
| TOTVS migrando para nuvem (Carol)                                | Manter atual + planejar migração futura         |

---

## 10. Onboarding técnico (serviço pago obrigatório)

Para Protheus, **setup fee não cobre** mapping customizado. Onboarding técnico é serviço à parte:

| Item                                | Valor           |
| ----------------------------------- | --------------- |
| Discovery + análise de customização | R$ 8.000        |
| Mapping inicial customizado         | R$ 12.000       |
| Templates por filial adicional      | R$ 2.000/filial |
| Treinamento técnico cliente (8h)    | R$ 4.500        |

Margem-alvo: 60% em onboarding técnico.

---

## 11. Aprovação

- [ ] Tech Lead (revisão técnica)
- [ ] Analista ERP (cobertura funcional)
- [ ] TOTVS Partner Program (homologação parcial)
- [ ] Cliente piloto (regras específicas)
- [ ] PM (escopo)
- [ ] Diretoria comercial (pricing customizado)
