# ADR-011: Engine de Expressão e Template do Mapping = JSONata

**Status**: Aprovada (resolve achado HIGH H3 da auditoria 10-agentes)
**Data**: 2026-04-26

## Contexto

Auditoria identificou que `006-mapping-engine.md` mistura **3 sintaxes incompatíveis** para o mesmo conceito:

- `{{ticket.product.code}}` (Mustache em §4.9, §7)
- `"$.data.id"` (JSONPath em §6 response)
- `expression: |` com `expr-eval`/`jsonata` (§4.3)

Sem decidir uma única engine, o validador (`POST /mapping/validate`) não pode ser determinístico, e cada conector pode interpretar mapping de forma diferente.

## Decisão

Adotar **JSONata** como engine única para:

- Expressões (`expression`)
- Templates de string (`array-template`, valores compostos)
- JSONPath (`response.externalIdPath`)

Pacote NPM: `jsonata` (https://jsonata.org/)

### Por que JSONata

- **Cobre os 3 casos** com sintaxe única
- Sandbox built-in (sem `eval`/`require`)
- Path navigation (`ticket.product.code` vira `$.ticket.product.code`)
- Filtros, joins, transformações funcionais
- Performance adequada (< 50ms para payloads típicos)
- Largamente usado (IBM API Connect, Stedi, Microsoft Power Platform)
- TypeScript types disponíveis

### Migração das sintaxes documentadas

#### Antes (mistura)

```yaml
- local: ticket.product.code        # path implícito
  remote: documentNumber
  type: direct

- remote: description
  type: expression
  expression: "ticket.numero + ' kg=' + ticket.peso"  # expr-eval

- remote: items
  type: array-template
  template:
    - sku: "{{ticket.product.code}}"   # Mustache

response:
  externalIdPath: "$.data.id"          # JSONPath
```

#### Depois (JSONata único)

```yaml
- local: $.ticket.product.code
  remote: documentNumber
  type: direct

- remote: description
  type: expression
  expression: "ticket.ticketNumber & ' kg=' & ticket.weights.netKg"

- remote: items
  type: expression
  expression: |
    [{
      "sku": ticket.product.code,
      "quantity": ticket.weights.netKg,
      "unit": "kg"
    }]

response:
  externalIdPath: "data.id"
```

### Whitelist

JSONata default permite acesso a globais do contexto. Configurar:

- `bindings`: apenas `ticket`, `event`, `now`, `secrets`, `lookup`
- Sem `require`, `process`, `eval`
- Timeout 100ms por expressão (via `Promise.race`)

### Compatibilidade retroativa

Mapping engine durante a migração aceita **dual-syntax**:

- Detectar `{{...}}` → converter para `& 'literal' &` JSONata
- Detectar `$.path` → manter (JSONata aceita)
- Documentar warning quando legacy syntax detectado

Após Sprint 6, remover suporte legacy.

## Consequências

### Positivas

- Validador determinístico
- Documentação coerente
- Sandbox real (vs whitelist manual frágil)
- Manter SDK público estável (parceiros aprendem 1 sintaxe)

### Negativas

- Necessário reescrever exemplos em todos os contratos ERP
- Curva de aprendizado JSONata para devs novos (~2 dias)
- Migração de mappings v1 já criados (script automatizado pode ajudar)

## Alternativas consideradas

| Alternativa                     | Por que rejeitada                                                   |
| ------------------------------- | ------------------------------------------------------------------- |
| Mustache puro                   | Sem expressões/condições — mata casos do `condition` e `expression` |
| `expr-eval`                     | Sem sandbox real; sem template; sem JSONPath                        |
| Liquid                          | Mais voltado a HTML; sintaxe mais verbosa                           |
| Handlebars + JSONPath separados | 2 engines em vez de 1 — pior                                        |
| Custom DSL                      | Custo de implementação alto, pouco ganho                            |

## Implementação

### Tarefas (Sprint -2 da remediação)

1. Atualizar `006-mapping-engine.md` para refletir JSONata único
2. Atualizar `templates/erp-mapping.yaml` com sintaxe nova
3. Reescrever exemplos nos 6 contratos ERP (`bling.md`, `omie.md`, etc.)
4. Implementar `MappingEngineService` com `jsonata`
5. Suite de testes com 30+ casos
6. Validar no endpoint `/mapping/validate`

### Estimativa

- Documentação: 3 pontos
- Implementação: 8 pontos
- Migração contratos: 5 pontos
- Total: 16 pontos (Sprint 4 do plano original — suficiente)

## Referências

- JSONata: https://jsonata.org/
- ADR-007 — Mapping declarativo YAML (substituída em parte)
- `006-mapping-engine.md` — atualizar conforme esta ADR
- Auditoria 10-agentes — finding H3
