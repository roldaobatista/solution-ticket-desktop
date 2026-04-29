# Contrato Técnico — Conector ContaAzul

**Status**: Rascunho v1.0 — 2026-04-26
**Conector**: `conta-azul` (categoria: PME cloud)
**ERP**: ContaAzul (cloud)
**Owner**: Analista Integração ERP

---

## 1. Discovery

| Item         | Valor                                     |
| ------------ | ----------------------------------------- |
| Produto      | ContaAzul                                 |
| Documentação | developers.contaazul.com                  |
| Métodos      | REST/JSON com OpenAPI                     |
| Auth         | OAuth 2.0 Authorization Code + PKCE       |
| Rate limit   | ~100 req/min (varia por endpoint)         |
| Sandbox      | Não oficial; usar conta dedicada de teste |

---

## 2. Contrato

### 2.1 Direção

| Entidade              | Direção                   | Dono                |
| --------------------- | ------------------------- | ------------------- |
| Cliente               | ContaAzul → ST            | ContaAzul           |
| Fornecedor            | ContaAzul → ST            | ContaAzul           |
| Produto/serviço       | ContaAzul → ST            | ContaAzul           |
| Categoria financeira  | ContaAzul → ST            | ContaAzul           |
| Veículo / Motorista   | Local                     | ST                  |
| **Ticket de pesagem** | **ST → ContaAzul**        | **ST** (vira venda) |
| Conta a receber       | ST → ContaAzul (opcional) | ST                  |
| Cancelamento          | ST → ContaAzul            | ST                  |

### 2.2 Estratégia

ContaAzul é fortemente focado em financeiro/contábil para PME. Estratégia:

- **Vendas (Sales)** — escolhido para ticket de pesagem
- Itens da venda: produto pesado + quantidade
- Conta a receber gerada automaticamente (se configurado)

### 2.3 Tratamento de exceções

| Evento                          | Comportamento      |
| ------------------------------- | ------------------ |
| Cliente não encontrado          | `FAILED_BUSINESS`  |
| Produto não encontrado          | `FAILED_BUSINESS`  |
| Categoria/conta não configurada | `FAILED_BUSINESS`  |
| Token expirado                  | Refresh automático |
| 429                             | `WAITING_RETRY`    |
| 5xx                             | Retry com backoff  |

---

## 3. Mapeamento

### 3.1 Pull cliente ContaAzul → CanonicalPartner

| Campo CA         | Canônico           | Transformação                            |
| ---------------- | ------------------ | ---------------------------------------- |
| `id`             | `externalId`       | direct                                   |
| `documentNumber` | `taxId`            | normalize digits-only                    |
| `name`           | `name`             | direct                                   |
| `personType`     | `type`             | lookup PERSONAL→PERSON, BUSINESS→COMPANY |
| `email`          | `contacts[].value` | direct                                   |

### 3.2 Push ticket → ContaAzul Venda

```yaml
version: 1
connector: conta-azul
entity: WeighingTicket
operation: push
endpoint:
  method: POST
  # ⚠️ PROVISÓRIO — VALIDAR DISCOVERY OFICIAL antes de implementar.
  # `/v1/sales` é da API v1 antiga e pode estar deprecada/movida.
  # API atual de ContaAzul pode usar `/v1/services/sales` ou `/v2/sales`,
  # dependendo da versão habilitada para o cliente. Conferir em
  # developers.contaazul.com (Discovery oficial) no Sprint que implementar
  # o conector. Esta entrada existe apenas como rascunho contratual.
  path: /v1/sales

fields:
  - remote: customerId
    local: ticket.partner.externalId
    type: direct

  - remote: number
    local: ticket.ticketNumber
    type: direct

  - remote: emission
    local: ticket.timestamps.closedAt
    type: date-format
    format: YYYY-MM-DD

  - remote: status
    type: fixed
    value: COMMITTED

  - remote: products
    type: array-template
    template:
      - id: '{{ticket.product.externalId}}'
        description: 'Pesagem {{ticket.ticketNumber}} - placa {{ticket.vehicle.plate}}'
        quantity: '{{ticket.weights.netKg}}'
        value: 0

response:
  externalIdPath: '$.id'
  successCondition: '$.id != null'
```

### 3.3 Tabelas de equivalência

| Tabela                | Quem mantém                      |
| --------------------- | -------------------------------- |
| `product-conta-azul`  | Cliente                          |
| `category-conta-azul` | Cliente (categorias financeiras) |

---

## 4. Endpoints

| Operação            | Método | Endpoint                               |
| ------------------- | ------ | -------------------------------------- |
| OAuth token         | POST   | `/oauth2/token`                        |
| OAuth revoke        | POST   | `/oauth2/revoke` (verificar Discovery) |
| Vendas — criar      | POST   | `/v1/sales` ⚠️ provisório (ver §4.1)   |
| Vendas — cancelar   | POST   | `/v1/sales/{id}/cancel` ⚠️ provisório  |
| Clientes — listar   | GET    | `/v1/customers?page=N`                 |
| Produtos — listar   | GET    | `/v1/products?page=N`                  |
| Categorias — listar | GET    | `/v1/categories`                       |

### 4.1 Endpoint de vendas — pendência de Discovery

> 🔴 **PROVISÓRIO**: a entrada `/v1/sales` é da API v1 antiga.
> A API atual da ContaAzul pode estar usando `/v1/services/sales` ou
> `/v2/sales`, ou ainda outro path conforme o tier do cliente.
> **Esta tabela é provisória e exige validação no Discovery oficial em
> developers.contaazul.com no Sprint que implementar o conector.**
> Implementação não pode iniciar antes dessa confirmação.

### 4.2 Ciclo de vida OAuth

ContaAzul usa **OAuth 2.0 Authorization Code com PKCE obrigatório**
(`code_challenge_method=S256`).

| Situação                                       | Ação do conector                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Access token expirado (401)                    | Refresh com `grant_type=refresh_token`; reexecutar request 1×                          |
| Refresh OK                                     | Persistir par novo no cofre (refresh é rotacionado)                                    |
| Refresh `invalid_grant` transitório (rede/5xx) | Retry com backoff (até 3×)                                                             |
| Refresh `invalid_grant` permanente             | Marcar conector `NEEDS_REAUTH`; UI dispara fluxo Authorization Code + PKCE interativo  |
| Conector desativado pelo cliente               | Chamar `POST /oauth2/revoke` antes de apagar credencial do cofre; auditar              |
| Cliente revoga app no painel ContaAzul         | Próximo request retorna 401 com refresh `invalid_grant` permanente — tratar como acima |

---

## 5. Webhooks

ContaAzul oferece webhooks limitados (depende do plano do cliente). Estratégia:

- **Polling** padrão para mudanças de cadastro (cada 30 min)
- Webhook quando disponível: via relay cloud

---

## 6. Erros conhecidos

| Categoria | Padrão                  | Ação                 |
| --------- | ----------------------- | -------------------- |
| Técnico   | 401 token expirado      | Refresh automático   |
| Técnico   | 429                     | Backoff              |
| Técnico   | 502/503                 | Retry                |
| Negócio   | 400 validação           | DLQ                  |
| Negócio   | 404 cliente/produto     | DLQ                  |
| Negócio   | 422 categoria sem conta | DLQ + alertar config |

Formato:

```json
{
  "errors": [{ "field": "...", "message": "...", "code": "..." }]
}
```

ContaAzul também retorna formato alternativo em alguns endpoints (em
particular nos legados v1):

```json
{ "message": "...", "code": "..." }
```

Conector deve aceitar **ambos os formatos** ao parsear `lastError`:

1. Se `errors[]` existe → usar primeiro elemento (campo + mensagem + código).
2. Caso contrário, se `message` existe → usar `{message, code}` direto.
3. Fallback: HTTP status + body cru no `lastError`.

---

## 7. Massa de teste

- 3 clientes pessoa física + 3 jurídica
- 8 produtos
- 2 categorias financeiras configuradas
- 1 cliente inativo

---

## 8. Estrutura

```
backend/src/integracao/connectors/conta-azul/
  conta-azul.connector.ts
  conta-azul.auth.ts          # OAuth Code + PKCE + refresh
  conta-azul.client.ts
  conta-azul.mapper.ts
  conta-azul.errors.ts
  conta-azul.fixtures.ts
  conta-azul.connector.spec.ts
  mapping/conta-azul-default.yaml
```

---

## 9. Riscos

| Risco                                       | Mitigação                      |
| ------------------------------------------- | ------------------------------ |
| OAuth Code + PKCE exige fluxo interativo    | UI guia cliente passo a passo  |
| Webhook limitado                            | Polling como padrão            |
| API evolui sem versionamento estrito        | Testes de contrato em CI       |
| Limites de plano do cliente afetam features | Detectar e degradar gracefully |

---

## 10. Aprovação

- [ ] Tech Lead
- [ ] Analista ERP
- [ ] Cliente piloto
- [ ] PM
