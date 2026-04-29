# Contract Testing — Hub ↔ Conector

**Versão**: 1.0 — 2026-04-27
**Resolve**: Auditoria 10-agentes Rodada 5 — Agente 5 (QA), HIGH "Contract testing Hub↔Conector ausente".
**Aplica-se a**: cada conector ERP (Bling, Omie, ContaAzul, Tiny, Sankhya, SAP, TOTVS, parceiros).

---

## 1. Por que existe

TCK testa conector contra interface estática. Mas a interface evolui (campos novos em `IErpConnector.send`, novos códigos de erro em `pushEvent`). Sem contract testing:

- Hub publica versão nova → conector quebra silenciosamente em produção.
- Conector parceiro implementa interface antiga → falha de integração só em runtime.

**Pact** congela expectativas em formato declarativo (JSON). Hub é **consumer**; cada conector é **provider**.

---

## 2. Fluxo

```
[Hub repo]                     [Pact Broker]                [Conector repo]
   |                                  |                            |
   | 1. Define expectations          |                            |
   |    em vitest+pact-js            |                            |
   |--------- publish ---------->    |                            |
   |                                  |                            |
   |                                  |  2. CI do conector pega   |
   |                                  |---- fetch contracts ----->|
   |                                  |                            |
   |                                  |  3. provider verify        |
   |                                  |    contra implementação   |
   |                                  |<---- publish results ----|
   |                                  |                            |
   | 4. can-i-deploy? --------------->|                            |
   |   (gate de release)              |                            |
```

**Quebra de contrato em verify = PR do conector bloqueado.**
**Hub não pode subir versão se algum conector com tag `prod` falhar verify.**

---

## 3. Componentes

### 3.1 Pact Broker

- **Auto-hospedado** em ambiente de homologação (Postgres + Pact Broker oficial).
- Backup diário do banco.
- Auth: token por repo (Hub e cada conector).

### 3.2 Consumer (Hub)

- Localização dos testes: `backend/src/integracao/__tests__/contracts/`.
- Cada interaction representa uma chamada que o Hub faz ao conector.
- Publicação em CI: `pact-js publish` após verde.

### 3.3 Provider (Conector)

- Cada conector roda `pact-js verify` no CI dele, contra o broker.
- Estados de provider (`given`) usados para preparar fixtures (parceiro X existe, ticket Y já foi enviado).

---

## 4. Versionamento

| Item                | Política                                                                        |
| ------------------- | ------------------------------------------------------------------------------- |
| **Tag de release**  | Cada deploy publica com `git sha` + tag de ambiente (`dev`, `staging`, `prod`). |
| **Backward-compat** | Hub mantém suporte a contratos das **2 versões anteriores** do conector.        |
| **Breaking change** | Bump major obrigatório + comunicação 30 dias antes a parceiros.                 |
| **Deprecation**     | Contrato marcado `deprecated: true` no broker antes de remover.                 |

**Gate `can-i-deploy`**:

```bash
pact-broker can-i-deploy \
  --pacticipant Hub --version $CI_COMMIT_SHA \
  --to-environment prod
```

Sem verde dos providers `prod`, deploy é bloqueado.

---

## 5. Exemplos de interactions

### 5.1 `IErpConnector.send`

```typescript
// hub-bling.consumer.spec.ts
provider
  .given('parceiro 12345 existe e ticket idempotency abc-001 ainda não foi enviado')
  .uponReceiving('push de ticket de pesagem (compra simples)')
  .withRequest({
    method: 'POST',
    path: '/v1/erp/send',
    headers: { 'X-Idempotency-Key': 'abc-001' },
    body: { eventType: 'WeighingTicketClosed', revision: 1, payloadCanonical: like({}) },
  })
  .willRespondWith({
    status: 200,
    body: { success: true, externalId: like('NF-9876') },
  });
```

### 5.2 `IErpConnector.fetchPartner`

```typescript
provider
  .given('parceiro 12345 cadastrado no ERP')
  .uponReceiving('busca de parceiro por external id')
  .withRequest({ method: 'GET', path: '/v1/erp/partners/12345' })
  .willRespondWith({
    status: 200,
    body: { id: '12345', cnpj: like('00000000000000'), nome: like('ACME LTDA') },
  });
```

### 5.3 `IErpConnector.subscribeWebhook`

```typescript
provider
  .given('webhook não configurado para tenant t-001')
  .uponReceiving('subscribe de webhook nfe.emitida')
  .withRequest({
    method: 'POST',
    path: '/v1/erp/webhooks',
    body: { event: 'nfe.emitida', callbackUrl: like('https://relay.../webhook') },
  })
  .willRespondWith({ status: 201, body: { subscriptionId: like('sub-xyz') } });
```

---

## 6. Cobertura mínima por conector

| Método                                      | Obrigatório?        | Notas                                          |
| ------------------------------------------- | ------------------- | ---------------------------------------------- |
| `testConnection`                            | sim                 | smoke                                          |
| `pushEvent` (send)                          | sim                 | matriz: 1 happy + 4 erros (400, 401, 429, 500) |
| `pullChanges` (fetchPartner / fetchProduct) | sim                 | paginação + checkpoint                         |
| `subscribeWebhook`                          | se conector suporta | senão `skip` documentado                       |
| `cancelEvent`                               | sim                 | idempotência                                   |
| `getRemoteObject`                           | sim                 | not-found vs found                             |

**Mínimo absoluto: 8 interactions por conector.**

---

## 7. CI integration

```yaml
# Hub CI (.github/workflows/contract-publish.yml)
- run: pnpm test:contract:consumer
- run: pact-broker publish ./pacts \
    --consumer-app-version $GITHUB_SHA \
    --tag $GITHUB_REF_NAME

# Conector CI (.github/workflows/contract-verify.yml)
- run: pact-broker verify \
    --provider Bling \
    --provider-base-url http://localhost:3001 \
    --publish-verification-results \
    --provider-version $GITHUB_SHA
```

---

## 8. Referências

- `ESTRATEGIA-TESTES.md` §3 — pirâmide e ferramentas
- `TCK-SPEC.md` — testes conformance estáticos
- `SDK-CONNECTOR-SPEC.md` — interface `IErpConnector`
- ADR-005 — Conectores plugáveis
