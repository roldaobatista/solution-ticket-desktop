# 006 — Mapping Engine

> Owner: Eng | Última revisão: 2026-04-27 | Versão: 5

**Versão**: 1.1 — 2026-04-27
**ADR base**: ADR-007 (mapping YAML, parcialmente superseded) + **ADR-011 (JSONata como engine única)**
**Implementação**: `backend/src/integracao/mapping/`

> ⚠️ **Engine padronizada**: ADR-011 decidiu **JSONata** como única engine para expressões, templates e JSONPath. Substitui mistura anterior de `{{mustache}}`, `expr-eval` e JSONPath bruto. Exemplos abaixo seguem JSONata.

---

## 1. O que é

O Mapping Engine traduz **payload canônico** ↔ **payload do ERP** usando regras declarativas em YAML. Permite que cada cliente tenha mapping próprio sem release do conector.

---

## 2. Por que YAML

- Legível por não-devs (suporte e analista de integração editam)
- Versionável no Git
- Schema validável
- Facilita revisão antes de salvar (diff visual)

---

## 3. Estrutura

Ver template completo em `docs/integracao/templates/erp-mapping.yaml`.

```yaml
version: 1
connector: bling
entity: WeighingTicket
operation: push
fields:
  - local: ticket.ticketNumber
    remote: documentNumber
    type: direct
```

---

## 4. Transformações suportadas (v1)

### 4.1 `direct`

Copia valor canônico → campo remoto.

```yaml
- local: ticket.ticketNumber
  remote: documentNumber
  type: direct
```

### 4.2 `fixed`

Valor constante.

```yaml
- remote: sourceSystem
  type: fixed
  value: SOLUTION_TICKET
```

### 4.3 `expression`

Sintaxe **JSONata** (decisão ADR-011). Sandbox via bindings explícitos. **Sem** acesso a `eval`, `require`, filesystem, network.

```yaml
- remote: description
  type: expression
  expression: |
    "Pesagem " + ticket.ticketNumber + " kg=" + ticket.weights.netKg
```

Variáveis disponíveis: `ticket`, `event`, `now`, `env` (whitelisted).

### 4.4 `lookup`

Tabela de equivalência (ver `EquivalenceTableService`).

```yaml
- local: ticket.product.code
  remote: itemCode
  type: lookup
  table: product-erp-mapping
  onMissing: fail # fail | use-local | use-default | skip
  default: null
```

### 4.5 `unit-convert`

Conversão entre unidades de peso.

```yaml
- local: ticket.weights.netKg
  remote: quantity
  type: unit-convert
  from: kg
  to: ton
  decimals: 3
```

Suporte: kg ↔ ton (1000), kg ↔ saca (configurável por produto).

### 4.6 `date-format`

Formatação de data com timezone explícito.

```yaml
- local: ticket.timestamps.closedAt
  remote: postingDate
  type: date-format
  format: YYYY-MM-DD
  timezone: local # local | utc | "America/Sao_Paulo"
```

### 4.7 `normalize`

Normalização de string.

```yaml
- local: ticket.partner.taxId
  remote: customerTaxId
  type: normalize
  rule: digits-only # uppercase | lowercase | digits-only | trim
```

### 4.8 `condition`

If/else simples por valor.

```yaml
- remote: orderType
  type: condition
  cases:
    - when: "ticket.operationType == 'PURCHASE'"
      value: PURCHASE_ORDER
    - when: "ticket.operationType == 'SALE'"
      value: SALES_ORDER
  default: OTHER
```

### 4.9 `expression` para arrays (substitui `array-template` Mustache)

JSONata gera arrays nativamente. Não há mais sintaxe Mustache.

```yaml
- remote: items
  type: expression
  expression: |
    [{
      "sku": ticket.product.code,
      "quantity": ticket.weights.netKg,
      "unit": "kg"
    }]
```

Para múltiplos itens (loop):

```yaml
- remote: items
  type: expression
  expression: |
    ticket.lineItems.{
      "sku": code,
      "quantity": netKg,
      "unit": "kg"
    }
```

### 4.10 Whitelist JSONata (sandbox de execução)

A engine executa expressões JSONata dentro de um sandbox que **só permite a
lista abaixo de funções**. Qualquer outra função é rejeitada na compilação
com `EXPRESSION_INSECURE`.

#### Funções permitidas

**Numéricas / agregadas**
`$sum`, `$count`, `$avg`, `$min`, `$max`, `$number`, `$round`, `$floor`,
`$ceil`, `$abs`, `$power`, `$sqrt`

**String**
`$string`, `$substring`, `$substringBefore`, `$substringAfter`,
`$uppercase`, `$lowercase`, `$trim`, `$contains`, `$split`, `$join`,
`$replace`, `$pad`, `$length`

**Booleano / lógico**
`$boolean`, `$not`, `$exists`

**Data / tempo**
`$now`, `$millis`, `$fromMillis`, `$dateFormat`

**Lookup / customizadas (registradas pela engine)**
`$lookup` (consulta `equivalenceTables`), `$type`

**Arrays / coleções**
`$sort`, `$reverse`, `$distinct`, `$each`, `$map`, `$filter`, `$reduce`,
`$sift`, `$merge`, `$append`, `$keys`, `$spread`

#### Funções proibidas (sandbox)

| Função / construto                                           | Motivo                                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `$eval`                                                      | Execução dinâmica de expressão — vetor de injeção                                                                              |
| `$single`, `$assert`, `$error`                               | Permitiriam controlar fluxo de erro do host                                                                                    |
| Acesso a `globalThis`, `process`, `require`, `Function`      | Vetor de RCE                                                                                                                   |
| Funções definidas pelo usuário com binding a host            | Não há fonte segura de bindings externos                                                                                       |
| Regex em `$replace` / `$match` com complexidade catastrófica | Mitigado por timeout de 100ms; rejeitar ainda na compilação se padrão exibir backtracking exponencial conhecido (ex: `(a+)+$`) |

#### Limites adicionais (defesa em profundidade)

| Limite                                    | Valor                                       | Comportamento ao exceder                          |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| Timeout de execução por expressão         | **100 ms**                                  | Aborta com `EXPRESSION_TIMEOUT`                   |
| Profundidade máxima da AST compilada      | **32**                                      | Rejeita na compilação (`EXPRESSION_TOO_COMPLEX`)  |
| Tamanho máximo do output de uma expressão | **1 MB**                                    | Aborta com `EXPRESSION_OUTPUT_TOO_LARGE`          |
| Recursão `$$` (root context)              | **permitida apenas em contextos `$lookup`** | Em qualquer outro contexto, rejeita na compilação |
| Tamanho máximo da expressão fonte         | **8 KB**                                    | Rejeita ao salvar mapping                         |

> ⚠️ Mudanças nesta whitelist exigem ADR atualizando ADR-011 e revisão de
> segurança. Não adicionar funções novas sem auditoria.

---

## 5. Validação pré-envio

```yaml
validation:
  - field: customerTaxId
    rule: cnpj-or-cpf
    message: 'CNPJ/CPF inválido'

  - field: itemCode
    rule: required
    message: 'Produto não mapeado'

  - field: quantity
    rule: greater-than-zero
    message: 'Quantidade líquida deve ser positiva'
```

Regras built-in:

- `required`
- `cnpj`, `cpf`, `cnpj-or-cpf`
- `email`
- `iso-date`
- `greater-than-zero`
- `positive-number`
- `regex:<pattern>`
- `max-length:N`
- `min-length:N`
- `enum:A,B,C`

Falha de validação → `FAILED_BUSINESS` (não retenta).

---

## 6. Mapeamento da resposta do ERP

JSONata também é usado para extrair valores da resposta:

```yaml
response:
  externalIdPath: 'data.id' # JSONata path
  externalCodePath: 'data.code'
  successCondition: 'success = true' # JSONata expression
```

> Note: JSONata aceita paths sem prefixo `$.` (raiz implícita). Equivalente ao JSONPath `$.data.id` antigo.

---

## 7. Cancelamento

```yaml
cancel:
  endpoint:
    method: PUT
    path: /api/v1/orders/{externalId}/cancel
  body:
    reason: event.cancelReason # JSONata: referência direta
    cancelledBy: event.cancelledBy
    cancelledAt: $now() # JSONata function
```

---

## 8. Webhooks consumidos

```yaml
webhooks:
  - event: customer.blocked
    canonical: PartnerStatusChanged
    fields:
      - local: tcliente.bloqueado
        remote: data.blocked # JSONata path (sem prefixo $.)
        type: direct
```

---

## 9. API de validação e preview

### 9.1 Validar mapping antes de salvar

```
POST /api/v1/integration/mapping/validate
Content-Type: application/yaml

<conteúdo YAML>
```

Resposta:

```json
{
  "valid": true,
  "warnings": [],
  "errors": []
}
```

### 9.2 Preview com payload real

```
POST /api/v1/integration/mapping/preview
{
  "mappingYaml": "...",
  "samplePayload": { /* CanonicalWeighingTicket */ }
}
```

Resposta:

```json
{
  "remotePayload": { ... },
  "validationResults": [...],
  "warnings": []
}
```

A UI usa esse endpoint no botão "Testar com payload real".

---

## 10. Versionamento

- Mapping é versionado por perfil (`integracao_mapping`)
- Cada save cria nova versão; histórico preservado
- Rollback simples: ativar versão anterior

---

## 11. Performance

- Engine compilado em memória após primeiro uso
- Cache de mapping por perfil (TTL 5min)
- Lookup tables com cache em memória
- Target: < 50ms para payload de 10KB com 30 transformações

---

## 12. Segurança da expressão

Expressões usam **JSONata** (ADR-011) em sandbox:

- Sem acesso a `process`, `require`, `Function`, `eval`
- Sem network, filesystem
- Whitelist de funções: aritméticas, string, data
- Timeout de 100ms por expressão

Auditoria: toda mudança de mapping é registrada com diff.

---

## 13. Erros comuns

| Erro                      | Causa                                | Solução                                         |
| ------------------------- | ------------------------------------ | ----------------------------------------------- |
| `MAPPING_FIELD_NOT_FOUND` | Campo `local` não existe no canônico | Verificar path                                  |
| `LOOKUP_KEY_MISSING`      | `onMissing: fail` e key não existe   | Cadastrar na tabela ou mudar para `use-default` |
| `EXPRESSION_TIMEOUT`      | Expressão demorou > 100ms            | Simplificar                                     |
| `EXPRESSION_INSECURE`     | Usou função fora da whitelist        | Reescrever                                      |
| `VALIDATION_FAILED`       | Regra de validação falhou            | Corrigir cadastro ou ajustar regra              |

---

## 14. Roadmap

- v1: 9 transformações (escopo Sprint 4)
- v2 (Fase 4): visual editor drag-and-drop + transformações customizadas via parceiro

---

## 15. Referências

- ADR-007 — Mapping declarativo YAML
- `docs/integracao/templates/erp-mapping.yaml` — template
- `backend/src/integracao/mapping/`
