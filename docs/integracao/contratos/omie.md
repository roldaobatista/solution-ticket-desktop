# Contrato Técnico — Conector Omie

**Status**: Rascunho v1.0 — 2026-04-26
**Conector**: `omie` (categoria: PME cloud)
**ERP**: Omie ERP (cloud)
**Owner**: Analista Integração ERP

> ⚠️ Validar via developer.omie.com.br antes do Sprint 9.

---

## 1. Discovery

| Item         | Valor                                               |
| ------------ | --------------------------------------------------- |
| Produto      | Omie ERP                                            |
| Documentação | developer.omie.com.br                               |
| Métodos      | API JSON (preferida) + SOAP legado + Webhooks       |
| Auth         | App Key + App Secret (configurados no painel Omie)  |
| Rate limit   | 60 requisições/min por chave                        |
| Sandbox      | Conta de teste real (sem ambiente separado oficial) |

---

## 2. Contrato

### 2.1 Direção

| Entidade              | Direção                | Dono                                |
| --------------------- | ---------------------- | ----------------------------------- |
| Cliente               | Omie → ST              | Omie                                |
| Fornecedor            | Omie → ST              | Omie                                |
| Produto/serviço       | Omie → ST              | Omie                                |
| Veículo / Motorista   | Local                  | ST                                  |
| Pedido de venda       | Omie → ST              | Omie                                |
| **Ticket de pesagem** | **ST → Omie**          | **ST** (vira pedido de venda ou OS) |
| NF-e                  | Omie → ST (referência) | Omie                                |
| Cancelamento          | ST → Omie              | ST                                  |

### 2.2 Estratégia

Omie tem entidades:

- **Pedido de venda** (`PedidoVendaProduto`) — escolhido para ticket
- **Ordem de serviço** (`OrdemServico`) — alternativa para serviços de pesagem
- **Conta a receber** — para faturamento

Decisão: ticket vira **pedido de venda** com produto = código pesado, quantidade = peso líquido.

### 2.3 Tratamento de exceções

| Evento                 | Comportamento     |
| ---------------------- | ----------------- |
| Cliente não encontrado | `FAILED_BUSINESS` |
| Produto não encontrado | `FAILED_BUSINESS` |
| Cliente bloqueado      | `FAILED_BUSINESS` |
| Pedido encerrado       | `FAILED_BUSINESS` |
| Rate limit (60/min)    | `WAITING_RETRY`   |
| 5xx                    | Retry com backoff |

---

## 3. Mapeamento

### 3.1 Pull cliente Omie → CanonicalPartner

| Campo Omie            | Canônico            | Transformação            |
| --------------------- | ------------------- | ------------------------ |
| `codigo_cliente_omie` | `externalId`        | direct                   |
| `cnpj_cpf`            | `taxId`             | normalize digits-only    |
| `razao_social`        | `name`              | direct                   |
| `nome_fantasia`       | `fantasyName`       | direct                   |
| `inscricao_estadual`  | `stateRegistration` | direct                   |
| `bloqueado`           | `status`            | condition: `S` → BLOCKED |

### 3.2 Push ticket → Omie pedido

```yaml
version: 1
connector: omie
entity: WeighingTicket
operation: push
endpoint:
  method: POST
  path: /api/v1/produtos/pedido/

fields:
  - remote: call
    type: fixed
    value: IncluirPedido

  - remote: app_key
    type: fixed
    value: '{{secret:omie.appKey}}'

  - remote: app_secret
    type: fixed
    value: '{{secret:omie.appSecret}}'

  - remote: param[0].cabecalho.codigo_cliente
    local: ticket.partner.externalId
    type: direct

  # Chave de idempotência cliente — UUID estável do ticket.
  # Em retry, MESMO codigo_pedido_integracao garante anti-duplicidade nativa
  # do Omie: se já existe pedido com este código, Omie retorna o mesmo
  # codigo_pedido (não cria duplicado). É a forma OFICIAL recomendada por Omie.
  - remote: param[0].cabecalho.codigo_pedido_integracao
    local: ticket.ticketId
    type: direct
    required: true

  - remote: param[0].cabecalho.data_previsao
    local: ticket.timestamps.closedAt
    type: date-format
    format: DD/MM/YYYY

  - remote: param[0].det[0].produto.codigo_produto
    local: ticket.product.externalId
    type: direct

  - remote: param[0].det[0].produto.quantidade
    local: ticket.weights.netKg
    type: direct

  - remote: param[0].det[0].produto.unidade
    type: fixed
    value: kg

response:
  externalIdPath: '$.codigo_pedido'
  successCondition: '$.codigo_pedido_integracao != null'
```

### 3.2.1 Idempotência nativa do Omie

Regra obrigatória no conector:

- O conector envia `codigo_pedido_integracao = ticket.ticketId` (UUID estável
  do ticket canônico) em **todo** push, incluindo retries.
- Em retry após timeout/5xx, **manter o mesmo `codigo_pedido_integracao`**.
  O Omie reconhece e retorna o mesmo `codigo_pedido` da chamada anterior
  (não duplica o pedido). Isto substitui a necessidade de ETag/If-Match.
- Nunca regenerar UUID no conector — usar o `ticketId` canônico fim-a-fim.
- Ao receber resposta com `codigo_pedido` já existente, o conector deve
  tratar como sucesso (não como erro de duplicidade).

### 3.3 Tabelas de equivalência

| Tabela         | Quem mantém                                |
| -------------- | ------------------------------------------ |
| `product-omie` | Cliente                                    |
| `partner-omie` | Cliente (opcional, normalmente CNPJ basta) |

---

## 4. Endpoints

| Operação          | Método | Endpoint                                        |
| ----------------- | ------ | ----------------------------------------------- |
| Pedido — incluir  | POST   | `/api/v1/produtos/pedido/` (call=IncluirPedido) |
| Pedido — alterar  | POST   | mesma URL (call=AlterarPedido)                  |
| Pedido — cancelar | POST   | mesma URL (call=CancelarPedido)                 |
| Cliente — listar  | POST   | `/api/v1/geral/clientes/` (call=ListarClientes) |
| Produto — listar  | POST   | `/api/v1/geral/produtos/` (call=ListarProdutos) |

---

## 5. Webhooks

Omie suporta webhooks configuráveis no painel. Eventos relevantes:

- `VendaProduto.Cancelada`
- `VendaProduto.PedidoAlterado`
- `Cliente.Alterado`
- `Produto.Alterado`

URL: `https://relay.solution-ticket.com/webhook/omie/<tenant-id>`

---

## 6. Erros conhecidos

| Categoria | Padrão                             | Ação    |
| --------- | ---------------------------------- | ------- |
| Técnico   | `SOAP-ENV:Server` 5xx              | Retry   |
| Técnico   | "Limite de requisições"            | Backoff |
| Negócio   | `ERR-001` "Cliente não encontrado" | DLQ     |
| Negócio   | `ERR-002` "Produto inativo"        | DLQ     |
| Negócio   | `SOAP-FAULT-005` validação         | DLQ     |

Formato Omie:

```json
{
  "faultstring": "ERROR-XXX: descrição",
  "faultcode": "SOAP-ENV:..."
}
```

---

## 7. Massa de teste

- 5 clientes (CNPJ válidos)
- 10 produtos com unidade kg
- 1 cliente bloqueado
- 1 produto inativo

---

## 8. Estrutura

```
backend/src/integracao/connectors/omie/
  omie.connector.ts
  omie.auth.ts        # app_key + app_secret no payload
  omie.client.ts      # token bucket 60/min
  omie.mapper.ts
  omie.errors.ts
  omie.fixtures.ts
  omie.connector.spec.ts
  mapping/omie-default.yaml
```

---

## 9. Riscos

| Risco                                            | Mitigação                          |
| ------------------------------------------------ | ---------------------------------- |
| Auth via payload (não header) — exposição em log | Mascaramento extra de `app_secret` |
| Sem sandbox oficial                              | Conta teste com prefixo `[TESTE]`  |
| Rate limit 60/min pode estourar em pico          | Token bucket + agendamento         |
| API Omie evoluindo (v1 vs v2)                    | Subscrever changelog               |

---

## 10. Aprovação

- [ ] Tech Lead
- [ ] Analista ERP
- [ ] Cliente piloto
- [ ] PM
