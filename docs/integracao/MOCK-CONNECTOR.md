# Mock Connector — especificação

> Owner: Eng | Última revisão: 2026-04-27 | Versão: 1.0
> Sprint base: S3 (ver `BACKLOG-SPRINT-3.md` história S3-04)
> Pacote: `@solution-ticket/connector-mock` (interno, não publicado)

---

## 1. Propósito

O **Mock Connector** é uma implementação fake de `IErpConnector` usada em:

- **Testes e2e** do Hub (cenário ticket → outbox → conector → confirmação) sem dependência de ERP real.
- **Desenvolvimento local** quando o dev ainda não tem credenciais sandbox.
- **Reprodução de bugs**: cenários determinísticos (timeout, 5xx, 429) sem precisar derrubar ERP de homologação.
- **CI**: rodar a suíte completa do TCK contra um conector de referência que sempre passa.

Não é destinado a produção. Habilitado **apenas** quando `INTEGRATION_MOCK_ENABLED=true` no backend.

---

## 2. Contrato

Implementa integralmente a interface `IErpConnector` (ver `SDK-CONNECTOR-SPEC.md` §3). Comportamento controlado por header HTTP customizado `x-mock-scenario` na requisição que o Hub fará ao endpoint mock:

| `x-mock-scenario`   | Comportamento                                           |
| ------------------- | ------------------------------------------------------- |
| `success` (default) | 200 OK com payload canônico mínimo                      |
| `timeout`           | mantém conexão aberta sem responder por 30s             |
| `error-500`         | 500 Internal Server Error (retryable)                   |
| `error-404`         | 404 Not Found (não retryable, vai pra DLQ)              |
| `rate-limit`        | 429 com `Retry-After: 5`                                |
| `duplicate`         | retorna como se evento já tivesse sido processado antes |
| `slow`              | responde em latência configurável (ver §4)              |

A tabela acima é fonte da verdade — qualquer cenário novo exige PR atualizando este doc + os testes do TCK.

---

## 3. Fixtures

Conjunto mínimo embarcado em `backend/test/fixtures/mock-connector/`:

- `ticket-confirmed.json` — resposta de sucesso para `weighing.ticket.closed`.
- `customer-not-found.json` — payload de erro 404 (`code: ERR_BUSINESS_NOT_FOUND`).
- `rate-limit.json` — corpo do 429 com mensagem padrão.
- `idempotent-replay.json` — resposta para cenário `duplicate`.

Fixtures **não** carregam dados pessoais reais (LGPD); todos os campos são fictícios e marcados com prefixo `MOCK-`.

---

## 4. Uso em testes

### 4.1 Testes e2e (NestJS)

```ts
// backend/test/integracao/mock-flow.e2e-spec.ts
beforeAll(() => {
  process.env.INTEGRATION_MOCK_ENABLED = 'true';
});

it('cenário success: ticket confirmado em < 5s', async () => {
  await postTicket({ headers: { 'x-mock-scenario': 'success' } });
  const event = await waitForOutboxStatus('CONFIRMED', 5_000);
  expect(event.status).toBe('CONFIRMED');
});
```

### 4.2 Latência configurável

Variável `MOCK_LATENCY_MS` (50–5000) força delay em todas as respostas. Útil para validar timeout do Hub e burn-rate de SLO sem precisar carregar o sistema.

### 4.3 TCK

O TCK (`TCK-SPEC.md`) executa todos os 62 testes contra o Mock Connector como **smoke test do próprio TCK**: se o mock falhar, o problema está no kit, não no conector real.

---

## 5. Limites e segurança

- **Não escreve em banco real**: todos os dados ficam em memória (Map por processo).
- **Endpoint isolado**: porta separada (`3099` por padrão), `127.0.0.1` only, igual ao backend.
- **Logs marcados** com `[MOCK]` para evitar confusão com tráfego real em ambientes de teste compartilhados.
- **Feature flag**: se `INTEGRATION_MOCK_ENABLED` não for `true`, o módulo nem é registrado no `AppModule`.

---

## 6. Referências

- `SDK-CONNECTOR-SPEC.md` — interface `IErpConnector` que o mock implementa
- `TCK-SPEC.md` — suíte de conformidade que roda contra o mock no CI
- `BACKLOG-SPRINT-3.md` § S3-04 — história que originou este conector
