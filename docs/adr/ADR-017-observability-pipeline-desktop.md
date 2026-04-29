# ADR-017 — Pipeline de Observabilidade Desktop (LGPD-safe)

**Status**: Aceita
**Data**: 2026-04-27
**Autor**: SRE / Tech Lead
**Decisores**: CTO, Tech Lead, DPO
**Cross-link**: ADR-008 (Relay Cloud Webhook), `docs/integracao/SLO-INTEGRACAO.md`, `docs/ON-CALL.md`, `docs/integracao/RELAY-CLOUD-SECURITY-SPEC.md`

---

## 1. Contexto

O Solution Ticket é um produto **desktop local-first**: o backend roda no PC do cliente em `127.0.0.1`, persiste em SQLite local, e a maior parte da operação não precisa de internet. Isso traz três problemas de observabilidade:

1. **Cego remotamente** — quando o cliente Enterprise reporta lentidão, o time não tem traços nem métricas e debuga por print-screen + log via TeamViewer.
2. **LGPD impede telemetria invasiva** — não podemos enviar carga útil (pesagens, CPF, placa, valores fiscais) para serviço terceiro sem consentimento explícito do controlador.
3. **Compromisso de SLO no ON-CALL** — sem métricas centralizadas não há como medir burn-rate, MTTA, MTTR.

Sem solução, o módulo Integração ERP entra em GA (Sprint 6) sem capacidade de honrar SLA contratual.

---

## 2. Decisão

Adotamos uma stack **OpenTelemetry → relay cloud opt-in → backend gerenciado**, com três camadas de privacidade:

### 2.1 Camadas de telemetria

| Camada                 | Conteúdo                                                                                        | Ativação                                        | Retenção                 |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------ |
| **Métricas agregadas** | counters/gauges/histograms sem PII (`outbox_pending_count`, `worker_busy_ratio`, latências p95) | **Sempre ativa** (opt-out explícito por config) | 90 dias                  |
| **Traces detalhados**  | spans com IDs canônicos, sem corpo de payload, sem PII                                          | **Opt-in** no setup ("Telemetria opcional")     | 30 dias                  |
| **Audit log assinado** | hash chain de eventos críticos (ver ADR-018)                                                    | Sempre ativa, criptografada                     | 5 anos em S3 Object Lock |

### 2.2 Pipeline técnico

```
[Desktop NestJS]
   ├── OpenTelemetry SDK (Node.js)
   │     ├── Metrics exporter (OTLP/HTTP, batch 30s)
   │     └── Traces exporter (OTLP/HTTP, sampled 1% default)
   │
   ▼  TLS 1.3 + mTLS (cert tenant)
[Relay Cloud — Cloudflare Workers]
   ├── Validação tenant + rate-limit
   ├── Mascaramento defensivo (regex CPF/CNPJ/email)
   └── Forward → backend
   │
   ▼
[Backend de observabilidade]
```

### 2.3 Backend de observabilidade

**MVP (Sprint 6 GA)**: **Grafana Cloud** (free tier de partida; plano Pro quando passar de 10k métricas).

- Pronto em horas, sem operação de banco.
- Tempo (traces) + Loki (logs) + Mimir (metrics) integrados.
- Alertmanager nativo, integra com OnCall.

**Plano B (escala)**: self-hosted **Tempo + Loki + Mimir** em VPS quando custo Grafana Cloud passar de R$ 8k/mês ou cliente Enterprise exigir hospedagem em território nacional.

### 2.4 Consentimento e UI

- Tela de setup do desktop tem checkbox **"Telemetria opcional (traces)"** — desligado por padrão.
- Métricas agregadas explicadas em modal LGPD: "enviamos contagens, sem ler suas pesagens".
- Cliente pode revogar a qualquer momento em Configurações → Privacidade. Revogação para envio em até 60s.

---

## 3. Consequências

### Positivas

- On-call enxerga problema do cliente sem precisar TeamViewer (MTTA cai estimado 80%).
- LGPD coberto: documentamos base legal (legítimo interesse + consentimento por camada).
- SLO/burn-rate viáveis (`SLO-INTEGRACAO.md`).
- Audit log resistente a fraude (ver ADR-018).

### Negativas

- **Custo**: ~R$ 5k/mês em GA (Grafana Cloud Pro estimado) — virá direto da margem do plano Enterprise.
- Overhead local: SDK OpenTelemetry consome ~30 MB RAM e 1–2 % CPU (medido em spike S0).
- Cliente que opta-out de traces fica com diagnóstico limitado em P1/P2.

### Riscos

- Vazamento de PII por descuido em atributo de span → **mitigação**: lista allowlist de atributos no SDK + revisão obrigatória em PR que mexe em instrumentação.
- Relay cloud cair → **mitigação**: SDK tem buffer local 1h; após isso descarta com log local.

---

## 4. Alternativas consideradas

| Alternativa                          | Por que descartado                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| **Zero telemetria**                  | Inviável: time fica cego, SLA Enterprise impossível, MTTR explode.                      |
| **Telemetria mandatória sem opt-in** | Quebra LGPD; DPO vetou. Cliente Enterprise exige opt-in granular.                       |
| **Sentry-only (errors)**             | Cobre exceções mas não métricas/traces; insuficiente para SLO.                          |
| **Datadog**                          | Custo proibitivo (~3× Grafana Cloud em volumes equivalentes).                           |
| **ELK self-hosted no MVP**           | Operação distrai time pequeno; preferível pagar SaaS no MVP e migrar quando justificar. |

---

## 5. Implementação

- Spike S0 OBS-01: SDK OpenTelemetry + exporter OTLP no backend NestJS — Sprint 0.
- Spike S0 OBS-02: relay cloud aceitar OTLP via Workers — Sprint 0.
- Tela de consentimento LGPD — Sprint 1.
- Dashboards iniciais (RED + USE) — Sprint 2.
- Burn-rate alerts integrados ao ON-CALL — Sprint 3.

---

## 6. Referências

- ADR-008 — Relay cloud webhook
- `docs/integracao/SLO-INTEGRACAO.md`
- `docs/integracao/RELAY-CLOUD-SECURITY-SPEC.md`
- `docs/ON-CALL.md`
- OpenTelemetry Spec — https://opentelemetry.io/docs/specs/
- LGPD Art. 7º (legítimo interesse) e Art. 8º (consentimento)
