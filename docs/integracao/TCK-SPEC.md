# TCK — Test Conformance Kit para `IErpConnector`

**Status**: Especificação (Sprint -2 da remediação)
**Versão**: 1.0 — 2026-04-26
**Resolve**: HIGH H12 da auditoria — TCK ausente

---

## Por que existe

Sem TCK, conector novo (Bling, Omie, Sankhya, parceiros futuros) pode:

- Implementar idempotência incorretamente
- Classificar erro técnico como negócio (loop infinito de retry)
- Vazar credencial em log
- Não respeitar rate limit
- Quebrar contrato `IErpConnector` em update

TCK é **suíte obrigatória** que TODO conector precisa passar antes de:

- H1 (homologação técnica)
- Publicação no marketplace (parceiros)
- Atualização de versão maior

---

## Pacote NPM

```bash
npm install --save-dev @solution-ticket/connector-tck
```

## Como usar

```typescript
// my-erp.tck.spec.ts
import { runTck } from '@solution-ticket/connector-tck';
import { MyErpConnector } from './my-erp.connector';

describe('My ERP Connector — TCK', () => {
  runTck({
    connector: () => new MyErpConnector(),
    config: {
      /* sandbox config */
    },
    skipTests: ['webhook-replay'], // se conector não suporta
  });
});
```

Saída:

```
TCK suite (62 tests)
  ✅ Interface compliance (10/10)
  ✅ Idempotency (8/8)
  ✅ Error classification (16/16)
  ✅ Resilience (12/12)
  ✅ Security (10/10)
  ✅ Performance (6/6)

PASSED — conector pode prosseguir para H1
```

---

## Categorias de teste

### 1. Interface compliance (10 testes)

Verifica que conector implementa interface corretamente.

| #     | Teste                                            |
| ----- | ------------------------------------------------ |
| IF-01 | `id`, `name`, `version`, `vendor` definidos      |
| IF-02 | `capabilities()` retorna shape válido            |
| IF-03 | `capabilities().supportedEntities` ≥ 1           |
| IF-04 | `testConnection(config)` retorna em < 10s        |
| IF-05 | `pushEvent` aceita evento canônico válido        |
| IF-06 | `pullChanges` aceita checkpoint válido           |
| IF-07 | `getRemoteObject` retorna null quando não existe |
| IF-08 | Sem dependências circulares                      |
| IF-09 | Versão SemVer válida                             |
| IF-10 | Não exporta tipos que vazam internals            |

### 2. Idempotency (8 testes — adversariais)

Cobertura crítica.

| #     | Teste                                                   |
| ----- | ------------------------------------------------------- |
| ID-01 | Mesmo `idempotencyKey` 2x → 1 lançamento no ERP         |
| ID-02 | Mesmo key 100x em paralelo → 1 lançamento               |
| ID-03 | Crash entre push e ack → retry não duplica              |
| ID-04 | Race entre worker e recovery job → 1 processamento      |
| ID-05 | Revision++ em retry voo → trata como evento novo        |
| ID-06 | Webhook tardio confirmando push já tentado → reconcilia |
| ID-07 | Idempotency key sempre presente em request ao ERP       |
| ID-08 | Cache local de external_id evita re-criar               |

### 3. Error classification (16 testes)

8 técnicos + 8 negócio.

| #     | Teste técnico                                  |
| ----- | ---------------------------------------------- |
| TE-01 | Timeout → `FAILED_TECHNICAL` + retry           |
| TE-02 | 500 → `FAILED_TECHNICAL` + retry               |
| TE-03 | 502/503 → `FAILED_TECHNICAL`                   |
| TE-04 | 504 → `FAILED_TECHNICAL`                       |
| TE-05 | 408 → `FAILED_TECHNICAL`                       |
| TE-06 | 429 com Retry-After → respeita header          |
| TE-07 | ENOTFOUND/ECONNREFUSED → `FAILED_TECHNICAL`    |
| TE-08 | Token expirado (401) → refresh + retry uma vez |

| #     | Teste negócio                                    |
| ----- | ------------------------------------------------ |
| BE-01 | 400 validação → `FAILED_BUSINESS` (sem retry)    |
| BE-02 | 404 recurso inexistente → `FAILED_BUSINESS`      |
| BE-03 | 409 conflito → `FAILED_BUSINESS`                 |
| BE-04 | 422 regra de negócio → `FAILED_BUSINESS`         |
| BE-05 | 403 permissão → `FAILED_BUSINESS`                |
| BE-06 | Mensagem de erro do ERP propagada em `lastError` |
| BE-07 | Cliente bloqueado → `FAILED_BUSINESS`            |
| BE-08 | Período fechado → `FAILED_BUSINESS`              |

### 4. Resilience (12 + 4 chaos = 16 testes)

Cenários adversariais.

| #     | Teste                                                        |
| ----- | ------------------------------------------------------------ |
| RE-01 | ERP fora 1h → tickets em fila → retoma sem perda             |
| RE-02 | Worker matado durante push → recovery em 10min               |
| RE-03 | 100 eventos paralelos → todos processados                    |
| RE-04 | Latência ERP variável (50ms a 5s) → workers não travam       |
| RE-05 | Rate limit estourado → backoff respeitado                    |
| RE-06 | Response truncada (TCP reset) → trata como técnico           |
| RE-07 | Response com payload corrompido → erro claro                 |
| RE-08 | Clock skew no Retry-After → tolerância                       |
| RE-09 | Certificate revogado → falha imediata                        |
| RE-10 | DNS falha → retry com backoff                                |
| RE-11 | ERP retorna 200 com `success: false` no body → parse correto |
| RE-12 | Timeout > 30s → cancela e retenta                            |

### 4.1 Chaos suite (RE-13..RE-16) — adicionada Rodada 5

Cenários adversariais executados via toxiproxy entre Hub e ERP sandbox.

| #     | Teste                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RE-13 | **Kill mid-flight**: matar processo do conector durante chamada PUT/POST → recovery em ≤ 5min, sem perda, sem duplicação (idempotência valida) |
| RE-14 | **Latency injection 5s** sustentada por 60s → workers não travam; backoff respeitado; throughput-alvo do tier mantém ≥ 50%                     |
| RE-15 | **Drop response do ERP** (ERP processa mas não devolve 200; TCP reset) → retry vê duplicate-key do ERP ou idempotency cache; 0 duplicação      |
| RE-16 | **OAuth refresh paralelo**: 5 workers concorrentes com token expirado → apenas 1 refresh executado; demais aguardam; 0 race condition          |

### 5. Security (10 + 3 gates = 13 testes)

Críticos para LGPD/compliance.

| #     | Teste                                                                                      |
| ----- | ------------------------------------------------------------------------------------------ |
| SE-01 | Credencial nunca aparece em log (regex check)                                              |
| SE-02 | CPF/CNPJ mascarados quando logados                                                         |
| SE-03 | Token nunca em URL (apenas header)                                                         |
| SE-04 | TLS 1.2+ obrigatório (rejeitar TLS 1.0/1.1)                                                |
| SE-05 | Certificate validation ON (sem `rejectUnauthorized: false`)                                |
| SE-06 | Retry não duplica credencial em headers                                                    |
| SE-07 | OAuth refresh não loga refresh_token                                                       |
| SE-08 | Webhook recebido valida HMAC + timestamp                                                   |
| SE-09 | Sem dependência de pacote NPM com vulnerabilidade conhecida (`audit`)                      |
| SE-10 | Sem hardcoded credentials no código                                                        |
| SE-11 | **SAST verde** (Semgrep regras OWASP + custom para credenciais/eval) — gate de merge       |
| SE-12 | **DAST verde** (OWASP ZAP contra endpoint do conector / webhook inbound) — gate de release |
| SE-13 | **Secret scanning verde** (gitleaks no histórico do PR + base) — gate de merge             |

### 6. Performance (6 testes)

Garantia mínima.

| #     | Teste                                              |
| ----- | -------------------------------------------------- |
| PE-01 | Push de 1 evento < 5s p95 (sem ERP real, com Mock) |
| PE-02 | Pull de 100 itens < 30s                            |
| PE-03 | Mapping engine < 50ms para payload 10KB            |
| PE-04 | Memória estável em loop de 1000 events             |
| PE-05 | Sem memory leak em 24h teste                       |
| PE-06 | CPU < 30% médio sob carga moderada                 |

---

## Como TCK detecta problemas

### Ferramentas usadas

- `vitest` para execução
- `nock` para mockar HTTP
- `@faker-js/faker` para dados
- Custom matchers `expect(connector).toHaveClassifiedError(...)`

### Scenarios via DSL declarativa

```yaml
scenario: ID-01
description: 'Same idempotency key — no duplication'
steps:
  - action: pushEvent
    params: { idempotencyKey: 'abc-123', payload: { ... } }
    expect: { success: true, externalId: $captured }
  - action: pushEvent
    params: { idempotencyKey: 'abc-123', payload: { ... } }
    expect: { success: true, externalId: $captured }
  - assert:
      - $0.externalId == $1.externalId
      - countCallsTo(erpEndpoint) == 1
```

---

## Custom matchers

```typescript
expect(error).toBeClassifiedAs('technical');
expect(connector).toRespectRateLimit({ max: 3, windowMs: 1000 });
expect(log).toNotContainSecret(['apiKey', 'token', 'password']);
expect(payload).toBeMaskedFor(['cpf', 'cnpj']);
```

---

## CI integration

```yaml
# .github/workflows/connector-ci.yml
name: Connector CI
on: [push, pull_request]
jobs:
  tck:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        connector: [bling, omie, conta-azul, sankhya]
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test -- --tck connectors/${{ matrix.connector }}
        env:
          ERP_SANDBOX_KEY: ${{ secrets[format('{0}_SANDBOX_KEY', matrix.connector)] }}
```

Branch só faz merge se TCK 100% verde.

---

## Versionamento do TCK

- TCK v1.x: 62 testes (escopo inicial)
- TCK v2.x: adicionar testes de webhook recebido, multi-tenant
- Conector pode declarar TCK suportado: `tckVersion: '^1.0.0'`

---

## Política de "ambiente de homologação SLA" — sandbox externo instável

Sandboxes públicos (Bling, Omie, ContaAzul, Tiny) caem com frequência. Sem fallback documentado, TCK fica bloqueado e CI vermelho por motivo externo.

**Regra**: se o sandbox externo do ERP fica indisponível por **> 2 horas consecutivas**, o conector pode rodar TCK contra **stub local** desde que:

1. Stub local seja **versionado no repositório** (`tests/stubs/<erp>/`) e mimetize a API real (request/response capturados em sessões reais anteriores via gravação de tráfego — ex: Polly, nock).
2. Cada execução com stub local **registra explicitamente** o motivo (`reason: sandbox-unavailable-since-<timestamp>`) e o time SRE recebe notificação.
3. Após o sandbox voltar, **TCK precisa rodar novamente** contra sandbox real em até 24h. Se não rodar, conector volta para "yellow" no portal.
4. Stub local **nunca substitui** sandbox real para H1 (homologação técnica) ou para liberar GA. É apenas para manter CI verde durante a queda.
5. Cenários que dependem de comportamento real do ERP (rate limit, retry-after, OAuth real) **não podem** ser stubs — esses ficam `skip` documentado.

Exemplos de configuração:

```yaml
tck:
  fallback:
    - erp: bling
      stub: tests/stubs/bling/
      maxStaleSandboxHours: 2
      requireRealRunWithin: 24h
```

---

## Cobertura mínima por tier de conector

| Tier conector             | Testes obrigatórios            | Testes opcionais |
| ------------------------- | ------------------------------ | ---------------- |
| **Tier-1 (SAP, TOTVS)**   | 100% (62/62)                   | nenhum opcional  |
| **PME (Bling, Omie)**     | 95% (sem PE-05 que exige 24h)  | PE-05            |
| **Genérico (REST, CSV)**  | 70% (skip webhook, skip OAuth) | múltiplos        |
| **Parceiros marketplace** | 100% obrigatório               | nenhum opcional  |

---

## Implementação — distribuição reconciliada

Total: **69 testes** = Interface 10 + Idempotency 8 + Error 16 + Resilience 16 (12 + 4 chaos) + Security 13 (10 + 3 gates SAST/DAST/secret) + Performance 6.

> Atualizado pela Auditoria R5 — Agente 5 (QA): suite chaos RE-13..RE-16 + gates SAST/DAST/secret scanning SE-11..SE-13.

### Sprint -2 (refactor remediação) — 34 testes

- Estrutura do pacote `@solution-ticket/connector-tck`
- **Interface compliance**: 10 testes (IF-01 a IF-10)
- **Idempotency**: 8 testes (ID-01 a ID-08)
- **Error classification**: 16 testes (TE-01 a TE-08 + BE-01 a BE-08)
- DSL básica
- CI integration template

### Sprint 0 — 22 testes

- **Resilience**: 12 testes (RE-01 a RE-12)
- **Security**: 10 testes (SE-01 a SE-10)
- Custom matchers básicos

### Sprint 1 — 6 testes + finalização

- **Performance**: 6 testes (PE-01 a PE-06)
- Documentação pública
- Publicação NPM

### Bling H1 (Sprint 7) — pré-requisito

- TCK 56/62 obrigatório (Performance pode ser parcial: PE-01 a PE-04 sim; PE-05/PE-06 podem ser pós-GA)
- Bling NÃO pode entrar em H1 antes de Sprint 1 fechar

> Aritmética validada: 34 + 22 + 6 = 62. Cobertura por categoria coerente com tabelas anteriores.

### Fase 4 (SDK) — abrir TCK ao público

- Pacote NPM público
- Documentação para parceiros
- Integração com programa de certificação

---

## Estimativa

- TCK skeleton + 30 testes: 13 pontos (Sprint -2)
- TCK completo + 62 testes: +13 pontos (Sprint 1)
- Custom matchers + DSL: 5 pontos
- **Total**: 31 pontos distribuídos

---

## Referências

- ADR-005 — Conectores plugáveis
- `SDK-CONNECTOR-SPEC.md` §3 — TCK mencionado
- `PLANO-HOMOLOGACAO-CONECTOR.md` — H1 referenciará TCK
- Auditoria 10-agentes — finding H12
