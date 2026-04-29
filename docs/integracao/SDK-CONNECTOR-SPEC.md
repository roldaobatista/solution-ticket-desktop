# SDK de Conectores ERP para Parceiros

> Owner: Eng | Última revisão: 2026-04-27 | Versão: 5

**Status**: Especificação para Fase 4 (mês 15+)
**Versão**: 1.0 — 2026-04-26
**ADR base**: ADR-005 (conectores plugáveis)
**Pacote NPM**: `@solution-ticket/connector-sdk` (a publicar)

---

## 1. Visão

Permitir que **parceiros desenvolvam conectores ERP** sem acesso ao código-fonte do core. Conectores certificados aparecem no **Marketplace**, com revenue share 70/30 (parceiro/Solution Ticket).

---

## 2. Princípios

1. **Compatibilidade contratual**: SDK estabelece interface; mudanças seguem semver
2. **Sandbox isolado**: conector não acessa banco core diretamente, apenas via SDK
3. **Sem privilégio escalado**: conector roda com permissões mínimas
4. **Auditoria total**: toda chamada ao core é logada
5. **Certificação obrigatória**: conector só vai ao marketplace após TCK + revisão

---

## 3. Pacotes publicados

### `@solution-ticket/connector-sdk`

Interfaces e tipos TypeScript que o conector implementa.

```ts
import {
  ErpConnector,
  ConnectorCapabilities,
  IntegrationContext,
  CanonicalIntegrationEvent,
  PushResult,
  PullResult,
} from '@solution-ticket/connector-sdk';

export class MyErpConnector implements ErpConnector {
  capabilities(): ConnectorCapabilities {
    return {
      supportsPush: true,
      supportsPull: true,
      supportsWebhooks: false,
      supportedEntities: ['WeighingTicket', 'Partner', 'Product'],
      authMethods: ['oauth2-bearer'],
      transportMethods: ['rest'],
      rateLimits: { requestsPerSecond: 10 },
    };
  }

  async testConnection(config) {
    /* ... */
  }
  async pushEvent(ctx, event): Promise<PushResult> {
    /* ... */
  }
  async pullChanges(ctx, checkpoint): Promise<PullResult> {
    /* ... */
  }
}
```

### `@solution-ticket/connector-tck`

Test Conformance Kit — suíte de testes que **todo conector deve passar**.

```bash
npm install --save-dev @solution-ticket/connector-tck
npm test -- --tck
```

Cobre:

- 100% da interface `ErpConnector`
- Idempotência
- Classificação de erro técnico vs negócio
- Mapping engine integration
- Resiliência (timeout, rate limit, 5xx)
- Segurança (sem secret em log)
- **OAuth refresh / revocation** — três cenários obrigatórios (ver abaixo)

#### Cenários OAuth obrigatórios no TCK

Todo conector que implemente auth OAuth 2.0 (Authorization Code, Client
Credentials, ou variantes com PKCE) **precisa passar** nos três cenários
abaixo. O TCK falha o conector se algum não for coberto.

**(a) Refresh durante request em voo**

- Cenário: o TCK programa o servidor mock para responder 401
  `invalid_token` ao primeiro request, e 200 OK ao retry.
- Comportamento esperado: o conector detecta 401, dispara refresh,
  persiste par novo no cofre, reexecuta o request original 1× e retorna
  o resultado de sucesso ao chamador. Sem dupla cobrança ao runtime.
- Asserts: refresh chamado exatamente 1×; cofre atualizado; token novo
  usado no retry; resposta final OK.

**(b) Refresh paralelo (race condition entre 2 workers)**

- Cenário: 2 workers do conector compartilham a mesma DEK/credencial; o
  TCK força ambos a detectarem 401 simultaneamente e ambos tentarem
  refresh. O servidor de auth concede refresh apenas para o **primeiro**
  request, e responde `invalid_grant` ao segundo (refresh rotacionado).
- Comportamento esperado: lock distribuído (ou single-flight in-process,
  conforme ADR-005) garante que **apenas 1 refresh ocorre**. O segundo
  worker espera, lê o token novo do cofre, reexecuta sua requisição
  original com o token atualizado.
- Asserts: cofre nunca tem refresh perdido; nenhum dos workers entra em
  loop de refresh; ambos os requests originais terminam OK; auditoria
  registra exatamente 1 evento de refresh.

**(c) Revogação remota detectada**

- Cenário: o servidor de auth do TCK marca o refresh token como revogado
  (cliente "desinstalou" o app). Conector recebe 401 `invalid_token`,
  tenta refresh, recebe `invalid_grant` permanente.
- Comportamento esperado: conector marca seu estado como `NEEDS_REAUTH`,
  para de processar a fila do tenant afetado, emite evento auditável
  `connector.needsReauth`, e expõe esse estado via `testConnection()`
  para que a UI possa oferecer botão de reconectar.
- Asserts: NÃO entra em loop de refresh; fila pausa; status `NEEDS_REAUTH`
  exposto; evento de auditoria emitido; nenhum 401 em request subsequente
  (porque parou de tentar).

### `@solution-ticket/create-connector`

CLI scaffold:

```bash
npx @solution-ticket/create-connector my-erp
```

Gera:

```
my-erp-connector/
  package.json
  tsconfig.json
  src/
    my-erp.connector.ts
    my-erp.auth.ts
    my-erp.client.ts
    my-erp.mapper.ts
    my-erp.errors.ts
    my-erp.fixtures.ts
  test/
    my-erp.connector.spec.ts
    my-erp.tck.spec.ts
  mapping/
    my-erp-default.yaml
  README.md
  CONTRACT.md
```

---

## 4. Interface obrigatória

```typescript
export interface ErpConnector {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly vendor: string; // empresa parceira

  capabilities(): ConnectorCapabilities;

  testConnection(config: ConnectorConfig): Promise<HealthCheckResult>;

  pushEvent(context: IntegrationContext, event: CanonicalIntegrationEvent): Promise<PushResult>;

  pullChanges(context: IntegrationContext, checkpoint: SyncCheckpoint): Promise<PullResult>;

  getRemoteObject(
    context: IntegrationContext,
    objectType: CanonicalObjectType,
    externalId: string,
  ): Promise<RemoteObject | null>;

  cancelOperation?(
    context: IntegrationContext,
    externalId: string,
    reason: string,
  ): Promise<CancelResult>;

  // Opcional: handler de webhook entrante
  handleWebhook?(context: IntegrationContext, payload: WebhookPayload): Promise<InboxEvent[]>;
}
```

---

## 5. SDK helpers

### Cliente HTTP com instrumentação

```ts
import { createHttpClient } from '@solution-ticket/connector-sdk';

const client = createHttpClient({
  baseUrl: config.baseUrl,
  rateLimit: { requestsPerSecond: 10 },
  retry: { maxAttempts: 3 },
  // Tracing automático via OpenTelemetry
});
```

### Mapping engine acessível

```ts
import { applyMapping } from '@solution-ticket/connector-sdk';

const remotePayload = await applyMapping({
  canonical: event.payload,
  mappingYaml: yaml,
});
```

### Cofre de credenciais

```ts
import { Secrets } from '@solution-ticket/connector-sdk';

const apiKey = await Secrets.get(context.profileId, 'apiKey');
// Conector NÃO acessa cofre direto — vai pelo SDK
```

### Logs estruturados

```ts
import { Logger } from '@solution-ticket/connector-sdk';

const log = Logger.forConnector('my-erp', context.correlationId);
log.info({ entityId: event.entityId }, 'pushing event');
```

Tudo automaticamente mascarado conforme regras do core.

---

## 6. O que o conector NÃO pode fazer

- ❌ Acessar banco do Solution Ticket diretamente
- ❌ Acessar credenciais de outros conectores
- ❌ Modificar entidades de negócio (ticket, etc.)
- ❌ Disparar eventos de domínio
- ❌ Burlar rate limits configurados
- ❌ Logar credenciais (mascaramento é forçado)
- ❌ Coletar telemetria sem consentimento explícito do cliente
- ❌ Fazer chamadas de rede fora do escopo do ERP-alvo

Restrições aplicadas via:

- Sandbox de processo (Worker thread isolado)
- Permissões NPM restritas
- Code review na certificação

---

## 7. Programa de certificação

### Categorias de parceiro

| Tier          | Requisitos                                       | Revenue share |
| ------------- | ------------------------------------------------ | ------------- |
| **Community** | TCK + revisão de segurança básica                | 70/30         |
| **Verified**  | + suporte L1 ao cliente final + 5 deals fechados | 75/25         |
| **Premium**   | + co-marketing + treinamento + SLA contratual    | 80/20         |

### Processo de certificação

1. **Inscrição**: parceiro preenche formulário em solution-ticket.com/partners
2. **NDA**: assinatura mútua
3. **Acesso ao SDK**: token de desenvolvedor + sandbox
4. **Desenvolvimento**: parceiro codifica conector
5. **Self-test**: TCK passa 100%
6. **Submissão**: PR no repositório de marketplace
7. **Revisão técnica ST**: 2 semanas
   - Code review
   - Auditoria de segurança
   - Validação TCK
8. **Cliente piloto**: 1 cliente real operando 30 dias sem P0
9. **Aprovação**: certificado emitido + listagem no marketplace
10. **Manutenção contínua**: parceiro mantém conector + atualiza para novas versões SDK

### Critérios de remoção

Conector pode ser **removido** do marketplace se:

- Cliente reportar bug crítico não corrigido em 30 dias
- Parceiro abandonar manutenção (> 90 dias sem update)
- Violação de licença ou termos
- Vulnerabilidade de segurança não corrigida em 7 dias

Em caso de remoção:

- Clientes existentes continuam funcionando por 12 meses
- Solution Ticket assume suporte L1 nesse período
- Migração assistida para alternativa

---

## 8. Marketplace técnico

### Listagem

- Página por conector com:
  - Descrição, screenshots, demo vídeo
  - Pricing (definido pelo parceiro)
  - Capacidades (auto-detectado de `capabilities()`)
  - Certificações
  - Avaliações de clientes
  - Documentação de configuração

### Compra

- Cliente Solution Ticket compra conector via interface única
- Cobrança intermediada pelo Solution Ticket
- Pagamento ao parceiro mensal (NF-e do parceiro para ST)

### Suporte

| Categoria | L1       | L2       | L3            |
| --------- | -------- | -------- | ------------- |
| Community | Cliente  | Parceiro | Parceiro      |
| Verified  | Parceiro | Parceiro | ST + Parceiro |
| Premium   | Parceiro | Parceiro | ST + Parceiro |

---

## 9. Versionamento do SDK

- Semver semântico
- Major version: breaking change (parceiros têm 12 meses para migrar)
- Minor: features novas, backward compatible
- Patch: bugfixes

| Versão | Lançamento       | Suporte até |
| ------ | ---------------- | ----------- |
| v1.x   | 2027-Q1          | 2030-Q1     |
| v2.x   | 2028 (planejado) | 2031        |

---

## 10. Documentação para parceiros

A publicar em solution-ticket.com/partners:

- **Getting Started Guide** (30 min para primeiro conector funcional)
- **API Reference** (gerado de TypeDoc)
- **Examples Repository** (3 conectores fictícios completos)
- **TCK Documentation** (como passar todos os testes)
- **Marketplace Guidelines** (UI/UX, pricing, suporte)
- **Webinars trimestrais** para parceiros
- **Slack/Discord community**

---

## 11. Roadmap do SDK

### v1.0 (mês 15)

- Interface `ErpConnector` estável
- TCK básico (60 testes)
- CLI scaffold
- Documentação inicial
- 5 parceiros piloto

### v1.1 (mês 18)

- Helpers para webhook handling
- Helpers para mapping customizado
- TCK estendido (100 testes)
- 15 parceiros ativos

### v2.0 (futuro)

- Plugins para custom transformations no mapping engine
- Workflows multi-passo (saga)
- Analytics opt-in para parceiros
- 50+ conectores no marketplace

---

## 12. Compliance e legal

- Termo de uso do SDK (parceiro aceita ao baixar)
- NDA mútuo
- Código aberto da interface (parte é open-source para evangelizar)
- Conector parceiro mantém propriedade intelectual
- Solution Ticket fica com a marca/distribuição

Ver `docs/legal/POLITICA-PRIVACIDADE.md` e `docs/legal/TERMOS-USO.md`.

---

## 13. Métricas de sucesso

| Métrica                    | Mês 18 | Mês 24  | Mês 36  |
| -------------------------- | ------ | ------- | ------- |
| Parceiros ativos           | 5      | 15      | 50      |
| Conectores certificados    | 5      | 12      | 30      |
| Receita marketplace mensal | R$ 50k | R$ 200k | R$ 800k |
| % MRR via marketplace      | 5%     | 15%     | 30%     |
| NPS de parceiros           | > 50   | > 60    | > 70    |

---

## 14. Riscos

| Risco                                      | Mitigação                              |
| ------------------------------------------ | -------------------------------------- |
| Conector parceiro com bug afeta cliente    | Sandbox + suporte L1 reverte           |
| Parceiro abandona conector                 | Cláusula de manutenção; ST assume      |
| Vulnerabilidade de segurança em conector   | Auditoria pré-marketplace + bug bounty |
| Concorrência entre conectores do mesmo ERP | Aceitar — cliente escolhe              |
| Marketplace não decola                     | Programa de incentivo + co-marketing   |

---

## Referências

- ADR-005 — Conectores plugáveis
- `docs/integracao/007-playbook-conectores-erp.md`
- `docs/comercial/PLANO-COMERCIAL.md` seção 5
