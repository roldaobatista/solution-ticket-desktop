# Feature Flags Runtime — Especificação

**Versão**: 1.0 — 2026-04-27 (criado a partir da Auditoria 5-Especialistas R2 — SRE)
**Audiência**: SRE, Tech Lead, Suporte L2/L3, Pré-vendas Enterprise
**Cross-link**: `RELAY-CLOUD-SECURITY-SPEC.md`, `SLO-INTEGRACAO.md`, ADR-008, ADR-018

---

## 1. Por que existe este documento

Hoje há confusão entre **canary de release** (latest-canary.yml; 10/50/100 % de rollout do binário Electron) e **feature flags em runtime** (estado por conector/tenant que muda sem redeploy). São coisas distintas e este doc separa formalmente.

| Mecanismo                                 | Granularidade     | Velocidade de mudança                | Persistência          |
| ----------------------------------------- | ----------------- | ------------------------------------ | --------------------- |
| **Canary de release** (latest-canary.yml) | versão do binário | minutos a horas (build + assinatura) | imutável (versão)     |
| **Feature flags runtime** (este doc)      | conector × tenant | **≤ 60 s** (sync via relay)          | mutável (estado JSON) |

---

## 2. Estrutura

Estado vive em `backend/data/feature-flags.json`, sincronizado via relay a cada 60 s.

```json
{
  "version": 42,
  "updatedAt": "2026-04-27T15:30:00Z",
  "signature": "<base64 RSA-SHA256 da serialização canônica>",
  "tenants": {
    "tenant-a": {
      "connector-bling": "enabled",
      "connector-omie": "disabled",
      "connector-sankhya": "degraded",
      "ttl": "2026-04-30T00:00:00Z"
    },
    "tenant-b": {
      "connector-bling": "enabled",
      "connector-totvs": "enabled",
      "ttl": null
    }
  },
  "global": {
    "ipc-backpressure-mitigation": "enabled",
    "outbox-poison-isolation": "enabled"
  }
}
```

### Estados aceitos por flag de conector

- `enabled` — funcionamento normal.
- `disabled` — kill-switch; worker não dispatcha eventos desse conector (eventos acumulam em `PENDING`).
- `degraded` — funciona com restrições (ex.: 50 % concurrency, batch reduzido); usado em throttle.

### Campo `ttl`

- Quando preenchido: flag volta ao default automaticamente após `ttl`.
- Útil para mitigação temporária (ex.: throttle por 24 h enquanto investiga).
- `null` = permanente até nova mudança.

---

## 3. Casos de uso

### 3.1 Kill-switch por conector (bug em produção)

- Bug crítico em conector Bling impacta múltiplos tenants.
- SRE muda flag global `connector-bling = disabled` no relay.
- Em ≤ 60 s todos os desktops param de despachar Bling.
- Eventos acumulam em outbox (sem perda).
- Após fix + release: flag volta para `enabled`.

### 3.2 Throttle por tenant (cliente abusivo)

- Tenant X gera tráfego anômalo (10× a média), saturando o ERP do próprio cliente.
- SRE muda `tenant-x.connector-omie = degraded` com `ttl = +24h`.
- Worker entra em modo restrito para esse tenant; outros tenants intactos.

### 3.3 Feature gradual por tenant (beta)

- Nova feature do conector SAP S/4 entra em produção via flag global `enabled-for=["tenant-pilot-1","tenant-pilot-2"]`.
- 1 semana de observação; depois libera para todos.
- Diferente de canary (que controla **versão**) — aqui controla **comportamento** dentro da mesma versão.

---

## 4. Sincronização (sync)

### Modelo pull

- Desktop faz **pull a cada 60 s** via endpoint do relay (`GET /v1/feature-flags?tenant=<id>&since=<version>`).
- Resposta: 200 com novo JSON se versão mudou; 304 se inalterada.
- Cache local em memória + persistência em `backend/data/feature-flags.json`.

### Cache local

- TTL de **5 min** após último pull bem-sucedido.
- Após TTL expirar sem novo pull: comportamento de tolerância (ver §4.1).

### Tolerância a relay offline

- **MVP (Sprint 0–6)**: default seguro `enabled` para todas as flags se cache stale > 5 min.
  - Justificativa: módulo é local-first; melhor falhar **aberto** (worker continua dispatchando) do que parar tudo se relay quebrar.
- **Pós-Sprint 6**: comportamento `last-known` — usa cache último mesmo se stale, com warning visível na UI.
  - Justificativa: cliente Tier-1 contratual não tolera comportamento "abre tudo" — last-known é mais conservador.

### Push opcional (Tier Enterprise)

- Tenant Enterprise pode receber push via canal SSE/websocket (pós-MVP).
- Reduz latência de 60 s → < 5 s.
- Exige conexão persistente com relay.

---

## 5. Auditoria

Toda mudança de flag gera **log assinado** (ADR-018):

- Quem mudou (operador/sistema).
- Quando (timestamp UTC).
- Tenant + flag + valor anterior + valor novo.
- Motivo (campo obrigatório em mudança manual).
- Hash chain encadeado com audit log local.

Mudança sem motivo é rejeitada pelo relay (HTTP 400).

Relatório semanal exportado para SIEM (`RELAY-CLOUD-SECURITY-SPEC.md` §10.2) categoria `feature-flag-change`.

---

## 6. Operação

### Quem pode mudar

- **Global** (afeta todos os tenants): tech lead + SRE on-call (2 olhos).
- **Por tenant**: SRE on-call individual + suporte L2 (com aprovação de tech lead se for `disabled`).
- **Cliente Enterprise**: portal próprio limitado a flags **do próprio tenant** marcadas como cliente-controláveis.

### UI

- Painel admin no relay (web).
- CLI `solution-ticket flags set --tenant <id> --flag <key> --value <state> --ttl <duration> --reason <text>`.

### Métricas Prometheus

```
feature_flag_sync_total{result="ok|stale|error"}
feature_flag_state{tenant,connector,state}
feature_flag_change_total{tenant,connector,changed_by}
feature_flag_cache_age_seconds{tenant}
```

---

## 7. Fora do escopo MVP

Os itens abaixo **não** entram no MVP (Sprint 0–6) e são deferidos para roadmap pós-GA:

- **Experimentos A/B** (controle estatístico com amostragem aleatória).
- **Percent rollout dentro de tenant** (ex.: "50 % dos eventos do tenant X usam nova lógica").
- **Targeting por atributo do evento** (ex.: "eventos com valor > X usam path Y").
- **Histórico visual de flags** com gráfico de mudanças.
- **Aprovação multi-stakeholder** com workflow.

Razão: kill-switch por conector e throttle por tenant cobrem 95 % dos casos de incidente. A&B/percentual são otimizações de produto, não de confiabilidade.

---

## 8. Referências

- ADR-008 — Relay cloud (transporte do sync)
- ADR-018 — Audit log tamper-evident (assinatura das mudanças)
- `RELAY-CLOUD-SECURITY-SPEC.md` §10.2 — SIEM forwarding
- `SLO-INTEGRACAO.md` §3.3 — SLI por componente (kill-switch impacta SLO do conector)
- Martin Fowler, _Feature Toggles_ — https://martinfowler.com/articles/feature-toggles.html
