# Contrato Técnico — Conector Bling

**Status**: Rascunho v1.0 — 2026-04-26
**Conector**: `bling` (categoria: PME cloud)
**ERP destino**: Bling ERP — versão API v3
**Owner**: Analista Integração ERP + Tech Lead
**Cliente piloto**: a definir no Sprint 0

> ⚠️ **Validar via Context7/docs oficiais antes do Sprint 6**: endpoints, scopes OAuth, rate limits e formato de erro podem ter mudado. Este contrato é base de Discovery (Etapa 1 do Playbook).

---

## 1. Discovery

### 1.1 Identificação do produto

| Item                  | Valor                   |
| --------------------- | ----------------------- |
| Produto               | Bling ERP               |
| Versão da API         | v3 (REST)               |
| Cloud ou on-premise   | Cloud (SaaS)            |
| Documentação oficial  | developer.bling.com.br  |
| Suporte do fornecedor | E-mail + portal de devs |

### 1.2 Métodos de integração disponíveis

- **REST API v3** (padrão escolhido)
- Webhooks (eventos de cliente, produto, pedido, NF)
- API v2 (deprecada — não usar)

> 🔴 **Header `X-Bling-Token` (v2) está DEPRECADO.** NÃO usar em conector novo.
> O conector deve enviar `Authorization: Bearer <access_token>` (OAuth 2.0
> Authorization Code, fluxo da v3). Qualquer documentação ou exemplo legado
> citando `X-Bling-Token` deve ser ignorada.

### 1.3 Autenticação

- **OAuth 2.0 Authorization Code** (com refresh token)
- Não suporta Client Credentials puro
- Token expira em ~6h; refresh token até 30 dias

### 1.4 Rate limits

- **3 requisições por segundo** por aplicação (rígido)
- 422 / 429 indicam excesso
- Necessário token bucket no conector

### 1.5 Ambiente de homologação

- Bling não tem sandbox separado oficial
- Estratégia: usar conta de teste real com prefixo `[TESTE]` em cadastros
- **Spike obrigatório no Sprint 6**: validar isolamento de dados de teste

---

## 2. Contrato — quem é dono de quê

### 2.1 Direção da integração

| Entidade              | Direção                 | Dono   | Observação                               |
| --------------------- | ----------------------- | ------ | ---------------------------------------- |
| Cliente               | Bling → ST (pull)       | Bling  | ST não cria cliente novo no Bling        |
| Fornecedor            | Bling → ST              | Bling  | Idem                                     |
| Produto               | Bling → ST              | Bling  | ST nunca altera código fiscal            |
| Veículo               | Local                   | ST     | Bling não tem entidade veículo nativa    |
| Motorista             | Local                   | ST     | Idem                                     |
| Pedido de venda       | Bling → ST              | Bling  | ST referencia, nunca cria                |
| NF-e                  | Bling → ST (referência) | Bling  | ST consulta para conferência             |
| **Ticket de pesagem** | **ST → Bling (push)**   | **ST** | **Vira "pedido" ou "ordem de produção"** |
| Cancelamento          | ST → Bling              | ST     | Vira cancelamento de pedido              |

### 2.2 Estratégia de mapeamento ticket → Bling

Bling não tem entidade nativa "ticket de pesagem". Opções avaliadas:

1. **Pedido de venda/compra** com produto = "Serviço de pesagem" + quantidade = peso líquido — **escolhido**
2. Ordem de produção — rejeitado (limitação de campos)
3. Anotação livre — rejeitado (sem rastro fiscal)

**Decisão**: ticket de pesagem vira **pedido** no Bling, com:

- Cliente/fornecedor mapeado por CNPJ
- Produto = código do produto pesado (já cadastrado no Bling)
- Quantidade = peso líquido em **kg** (ou ton, conforme produto)
- Observações = número do ticket + placa + dados auxiliares
- Status = "em aberto" inicialmente; "encerrado" após confirmação

### 2.3 Tratamento de eventos de exceção

| Evento                           | Comportamento                                     |
| -------------------------------- | ------------------------------------------------- |
| Cliente não encontrado por CNPJ  | `FAILED_BUSINESS` — operador resolve no Bling     |
| Produto não encontrado           | `FAILED_BUSINESS` — operador resolve              |
| Cliente bloqueado no Bling       | `FAILED_BUSINESS`                                 |
| Pedido referenciado já encerrado | `FAILED_BUSINESS`                                 |
| Quantidade > saldo do contrato   | `FAILED_BUSINESS`                                 |
| Token OAuth expirado             | Refresh automático; se falhar, `FAILED_TECHNICAL` |
| Rate limit (429)                 | Pausa + retoma; `WAITING_RETRY`                   |
| 5xx                              | Retry com backoff até N tentativas; depois DLQ    |

### 2.4 Cancelamento

Bling permite cancelamento via `PUT /pedidos/vendas/<id>/situacoes/<idCancelado>`. Conector implementa este fluxo no `cancelOperation()` da interface `IErpConnector`.

---

## 3. Mapeamento de campos

### 3.1 Pull: produto Bling → `CanonicalProduct`

| Campo Bling | Campo canônico | Transformação               |
| ----------- | -------------- | --------------------------- |
| `id`        | `externalId`   | direct                      |
| `codigo`    | `code`         | direct                      |
| `nome`      | `description`  | direct                      |
| `unidade`   | `unit`         | lookup (UN→un, KG→kg, etc.) |
| `formato`   | (interno)      | apenas filtra "S" (simples) |

### 3.2 Pull: cliente Bling → `CanonicalPartner`

| Campo Bling         | Campo canônico      | Transformação                    |
| ------------------- | ------------------- | -------------------------------- |
| `id`                | `externalId`        | direct                           |
| `numeroDocumento`   | `taxId`             | normalize (só dígitos)           |
| `nome`              | `name`              | direct                           |
| `tipo`              | `type`              | lookup (`F`→PERSON, `J`→COMPANY) |
| `inscricaoEstadual` | `stateRegistration` | direct                           |
| `endereco.*`        | `address.*`         | direct                           |

### 3.3 Push: `CanonicalWeighingTicket` → pedido Bling

```yaml
version: 1
entity: WeighingTicket
target: bling
endpoint: POST /Api/v3/pedidos/vendas
fields:
  - local: ticket.partner.externalId
    remote: contato.id
    type: direct
    required: true

  - local: ticket.timestamps.closedAt
    remote: data
    type: date-format
    format: YYYY-MM-DD

  - remote: numero
    local: ticket.ticketNumber
    type: direct

  - remote: numeroLoja
    local: ticket.unitId
    type: lookup
    table: unit-bling-loja

  - remote: itens
    type: array
    template:
      - codigo: '{{ticket.product.code}}'
        descricao: 'Pesagem {{ticket.ticketNumber}} - placa {{ticket.vehicle.plate}}'
        quantidade: '{{ticket.weights.netKg}}'
        unidade: kg
        valor: 0

  - remote: observacoes
    type: expression
    expression: |
      "Ticket: {{ticket.ticketNumber}} | Placa: {{ticket.vehicle.plate}} |
       Bruto: {{ticket.weights.grossKg}}kg | Tara: {{ticket.weights.tareKg}}kg |
       Líquido: {{ticket.weights.netKg}}kg"

  - remote: vendedor.id
    type: lookup
    table: user-bling-vendedor
    local: ticket.audit.closedBy
```

### 3.4 Tabelas de equivalência necessárias

| Tabela                | Origem                  | Destino           | Quem mantém |
| --------------------- | ----------------------- | ----------------- | ----------- |
| `unit-bling-loja`     | unidade ST              | numeroLoja Bling  | Cliente     |
| `user-bling-vendedor` | usuário ST              | vendedor.id Bling | Cliente     |
| `product-bling`       | produto local opcional  | codigo Bling      | Cliente     |
| `partner-bling`       | parceiro local opcional | contato.id Bling  | Cliente     |

---

## 4. Endpoints utilizados

| Operação             | Método | Endpoint                                        | Frequência     |
| -------------------- | ------ | ----------------------------------------------- | -------------- |
| OAuth token exchange | POST   | `/Api/v3/oauth/token` (ver §4.1)                | Boot + refresh |
| Pull produtos        | GET    | `/Api/v3/produtos?pagina=N&limite=100`          | Polling 1h     |
| Pull contatos        | GET    | `/Api/v3/contatos?pagina=N&limite=100`          | Polling 1h     |
| Pull pedidos         | GET    | `/Api/v3/pedidos/vendas?pagina=N&dataInicial=X` | Polling 15min  |
| Push pedido          | POST   | `/Api/v3/pedidos/vendas`                        | Sob evento     |
| Get pedido           | GET    | `/Api/v3/pedidos/vendas/<id>`                   | Reconciliação  |
| Cancelar pedido      | PUT    | `/Api/v3/pedidos/vendas/<id>/situacoes/<id>`    | Sob evento     |

### 4.1 Detalhe do endpoint OAuth token

```
POST /Api/v3/oauth/token  HTTP/1.1
Host: bling.com.br
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

**Body — troca inicial (Authorization Code clássico)**:

```
grant_type=authorization_code
&code=<code recebido no callback>
&redirect_uri=<exato igual ao cadastrado no painel Bling>
```

**Body — refresh**:

```
grant_type=refresh_token
&refresh_token=<refresh_token armazenado no cofre>
```

> ⚠️ **Bling v3 NÃO suporta PKCE.** Apenas Authorization Code clássico.
> O `client_secret` é OBRIGATÓRIO no header Basic. Não tentar enviar
> `code_verifier` — Bling ignora ou rejeita.

**Resposta (200)**:

```json
{
  "access_token": "...",
  "expires_in": 21600,
  "token_type": "Bearer",
  "scope": "...",
  "refresh_token": "..."
}
```

### 4.2 Ciclo de vida OAuth

| Situação                                                                   | Ação do conector                                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Access token expirado (401 `invalid_token`)                                | Disparar refresh; reexecutar request original 1×                                                                                |
| Refresh token válido, refresh OK                                           | Atualizar par no cofre (rotacionar — Bling pode emitir refresh novo)                                                            |
| Refresh retorna `invalid_grant` **transitório** (5xx ou rede instável)     | Retry com backoff exponencial (até 3×)                                                                                          |
| Refresh retorna `invalid_grant` **permanente** (refresh revogado/expirado) | Marcar conector como `NEEDS_REAUTH`; UI exibe botão "Reconectar Bling"; operador refaz fluxo Authorization Code interativamente |
| Conector desativado pelo cliente                                           | Chamar `POST /Api/v3/oauth/revoke` com `token=<access ou refresh>` antes de apagar credencial; auditar                          |
| Cliente desinstala app no painel Bling                                     | Bling revoga remotamente; próximo refresh retorna `invalid_grant` permanente — tratar como acima                                |

> Refresh token tem validade ~30 dias e é **rotacionado a cada uso** — o
> conector deve sempre persistir o `refresh_token` mais novo retornado pela
> resposta. Perder essa rotação obriga re-autorização interativa.

---

## 5. Webhooks consumidos (via relay cloud)

Bling envia webhooks para eventos:

- `pedido.criado`
- `pedido.alterado`
- `pedido.cancelado`
- `produto.alterado`
- `contato.alterado`

Configuração:

- URL do relay: `https://relay.solution-ticket.com/webhook/bling/<tenant-id>`
- Assinatura: HMAC-SHA1 no header `x-bling-signature` (validado no relay)
- Segredo configurado no painel Bling do cliente

---

## 6. Erros conhecidos

### 6.1 Erros técnicos (retry)

| Código          | Descrição      | Ação              |
| --------------- | -------------- | ----------------- |
| 401             | Token inválido | Refresh + retry   |
| 429             | Rate limit     | Pausa + retoma    |
| 500 / 502 / 503 | Erro Bling     | Retry com backoff |
| 504             | Timeout Bling  | Retry             |

### 6.2 Erros de negócio (NÃO retry)

| Código | Descrição              | Ação                                           |
| ------ | ---------------------- | ---------------------------------------------- |
| 400    | Validação              | Operador corrige                               |
| 404    | Recurso não encontrado | Operador verifica cadastro                     |
| 422    | Regra de negócio       | Operador resolve                               |
| 403    | Permissão insuficiente | Cliente reconfigura permissões da app no Bling |

### 6.3 Formato de erro Bling

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "...",
    "description": "...",
    "fields": [{ "code": "...", "msg": "...", "element": "..." }]
  }
}
```

Conector deve fazer parse e propagar `description` + `fields` no `lastError` do outbox.

---

## 7. Dados de teste para homologação

Massa mínima a cadastrar no Bling do cliente piloto:

- 5 contatos clientes ativos com CNPJ válido
- 2 contatos bloqueados
- 10 produtos ativos (variar unidade)
- 3 vendedores
- 2 lojas (numeroLoja diferente)

---

## 8. Estrutura do conector

```
backend/src/integracao/connectors/bling/
  bling.connector.ts         implementa IErpConnector
  bling.auth.ts              OAuth 2.0 + refresh + cofre
  bling.client.ts            HTTP client + token bucket (3 req/s)
  bling.mapper.ts            canônico ↔ Bling
  bling.errors.ts            classificação de erro
  bling.fixtures.ts          payloads para testes
  bling.connector.spec.ts    testes unitários
  bling.contract.spec.ts     testes de contrato
  mapping/bling-default.yaml template de mapping
```

---

## 9. Testes obrigatórios (Etapa 5 / H1)

Ver `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md` seção 5–9. Especificidades Bling:

- Validar **rate limit 3 req/s** com burst de 100 requests
- Validar **refresh token automático** (forçar expiração de access token)
- Validar **idempotência** (enviar mesmo ticket 5x → 1 pedido no Bling)
- Validar **cancelamento** (criar + cancelar; Bling preserva histórico)
- Validar **webhook** via relay (alterar contato no Bling → ST atualiza)

---

## 10. Riscos específicos do Bling

| Risco                                              | Mitigação                                             |
| -------------------------------------------------- | ----------------------------------------------------- |
| Rate limit 3 req/s muito baixo para cliente grande | Token bucket + priorização de tickets fiscais         |
| Sem sandbox oficial                                | Prefixo `[TESTE]` + isolamento por loja de teste      |
| API v3 ainda em evolução                           | Subscrever changelog; testes de contrato em CI diário |
| Webhook sem retry nativo do Bling                  | Relay com retry próprio + reconciliação periódica     |

---

## 11. Aprovação do contrato

Antes do Sprint 6 começar implementação:

- [ ] Tech Lead revisou (técnico)
- [ ] Analista Integração ERP revisou (funcional)
- [ ] Cliente piloto confirmou regras de negócio
- [ ] PM aprovou escopo
- [ ] Spike de sandbox/isolamento Bling executado

**Data alvo de aprovação**: fim do Sprint 5 (Fase 0)
