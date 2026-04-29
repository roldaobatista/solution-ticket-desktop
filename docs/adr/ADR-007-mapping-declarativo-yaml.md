# ADR-007: Mapping de campos declarativo em YAML

**Status**: SUPERSEDED por ADR-011 (engine de expressão = JSONata)
**Data original**: 2026-04-26
**Superseded**: 2026-04-26 (parcial — decisão de YAML declarativo permanece; sintaxe de expressão substituída por JSONata em ADR-011)

## Contexto

Cada cliente customiza seu ERP de forma única (especialmente Protheus). Mapping de campos não pode ser hardcoded no conector — precisaria de release a cada cliente. Ao mesmo tempo, mapping não pode ser código arbitrário (segurança, manutenção).

## Decisão

Mapping é declarativo em **YAML versionado por perfil de integração**. O `MappingEngineService` interpreta o YAML e aplica transformações.

### Transformações suportadas (v1)

| Tipo           | Exemplo                                 |
| -------------- | --------------------------------------- |
| `direct`       | campo A → campo B                       |
| `fixed`        | valor constante                         |
| `expression`   | expressão simples (subset seguro de JS) |
| `lookup`       | tabela de equivalência                  |
| `unit-convert` | kg → ton, etc.                          |
| `date-format`  | timezone local → UTC                    |
| `normalize`    | CNPJ só dígitos, uppercase, etc.        |
| `condition`    | if/else simples                         |

### Exemplo

```yaml
version: 1
entity: WeighingTicket
target: bling
fields:
  - local: ticket.numero
    remote: documentNumber
    type: direct

  - remote: sourceSystem
    type: fixed
    value: SOLUTION_TICKET

  - local: weights.netKg
    remote: quantity
    type: unit-convert
    from: kg
    to: ton

  - local: vehicle.plate
    remote: vehiclePlate
    type: normalize
    rule: uppercase

  - local: product.code
    remote: itemCode
    type: lookup
    table: product-bling
    required: true
```

### Segurança da expressão

O subset de expressão **não permite**: `eval`, `Function`, `require`, acesso ao filesystem, network, ou globais. Implementação via `expr-eval` ou `jsonata` com sandbox.

## Consequências

### Positivas

- Cliente novo não exige release
- Suporte/integrador edita mapping via UI sem dev
- Templates reusáveis por vertical (agro, indústria)
- Versionamento de mapping permite rollback

### Negativas

- Engine de transformação exige testes extensivos
- Validação de YAML precisa ser estrita (catch typos)
- Expressão arbitrária pode mascarar bugs — UI deve permitir "testar com payload real" antes de salvar

## Alternativas consideradas

- **Mapping em código TypeScript por cliente**: rejeitada (release por cliente)
- **JSON puro**: rejeitada (YAML é mais legível para não-devs)
- **DSL própria**: rejeitada (custo de implementação alto, baixo retorno)

## Referências

- `docs/PLANO-MODULO-INTEGRACAO.md` seção 11 (Épico 5)
- `docs/integracao/006-mapping-engine.md` (a criar)
