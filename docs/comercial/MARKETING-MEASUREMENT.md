# Marketing — Mensuração e Atribuição

**Versão**: 1.0 — 2026-04-27
**Resolve**: Auditoria Rodada 5 — Agente 8 — "Sem mensuração: UTMs, atribuição, dashboard"
**Relacionados**: `MARKETING-FUNNEL.md`, `MARKETING-SEO-CONTENT.md`

---

## 1. Convenção de UTMs

Todo link externo emitido pela Solution Ticket deve carregar UTMs padronizados.

### Parâmetros padrão

| Parâmetro      | O que preenche            | Exemplos válidos                                                                      |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `utm_source`   | origem (plataforma)       | `google`, `meta`, `linkedin`, `email`, `webinar`, `evento`, `comparativo`, `parceiro` |
| `utm_medium`   | canal/tipo                | `cpc`, `organic`, `social`, `email`, `display`, `referral`, `doc`, `video`            |
| `utm_campaign` | nome curto da campanha    | `lancamento-bling`, `whitepaper-fiscal`, `roi-calc`, `vs-rpa-2026q3`                  |
| `utm_term`     | keyword (ads) ou segmento | `integracao-balanca-erp`, `pme-agro`                                                  |
| `utm_content`  | variante criativa         | `banner-azul`, `cta-roi`, `header-link`                                               |

### Regras

- **Sempre minúsculas**, sem espaço, separador `-` (kebab-case).
- `utm_campaign` inclui **trimestre+ano** sempre que possível: `vs-rpa-2026q3`.
- Encurtador interno (`solution-ticket.com/go/...`) preserva UTMs em redirect 302.
- Ferramenta única para gerar UTMs: planilha compartilhada + form interno (evitar UTMs criados ad-hoc).

### Exemplos por canal

| Canal                                         | URL exemplo                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Google Ads (keyword "integração balança ERP") | `?utm_source=google&utm_medium=cpc&utm_campaign=erp-integracao-2026q3&utm_term=integracao-balanca-erp&utm_content=cta-demo` |
| Meta Ads (carrossel agro)                     | `?utm_source=meta&utm_medium=social&utm_campaign=agro-cooperativa-2026q3&utm_content=carrossel-azul`                        |
| Newsletter mensal                             | `?utm_source=newsletter&utm_medium=email&utm_campaign=novidades-2026-08&utm_content=cta-webinar`                            |
| Doc comparativo (vs-rpa.md)                   | `?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-rpa&utm_content=rodape-cta`                                         |
| Webinar gravado YouTube                       | `?utm_source=youtube&utm_medium=video&utm_campaign=webinar-fiscal-2026q3&utm_content=descricao`                             |
| Parceiro indicação                            | `?utm_source=parceiro-{nome}&utm_medium=referral&utm_campaign=indicacao-2026&utm_content=email`                             |

---

## 2. Stack de mensuração

### Por segmento

| Segmento                | Analytics web | CRM/Marketing automation      | Behavior                      |
| ----------------------- | ------------- | ----------------------------- | ----------------------------- |
| **PME**                 | GA4           | RD Station Marketing          | Hotjar (sessões + heatmap)    |
| **Médio**               | GA4           | RD Station ou HubSpot Starter | Hotjar                        |
| **Tier-1 / Enterprise** | GA4 + Ads     | HubSpot Pro/Enterprise        | Hotjar + Fullstory (opcional) |

### Por que essa divisão

- **RD Station** é mais barato e cobre PME/Médio brasileiros bem (R$ 2k–6k/mês).
- **HubSpot** ganha em ABM, score multi-touch e sequences para Tier-1+ (R$ 8k–25k/mês).
- **GA4** é base universal — não substitui CRM mas alimenta dashboards.
- **Hotjar** é leve e suficiente para identificar fricção em formulários e calculadora ROI.

### Integrações mínimas

```
Site marketing (Next.js)
    │
    ├── GA4 (cookie consent obrigatório, modo cookieless de fallback)
    ├── RD/HubSpot (form submit + lead score)
    └── Hotjar (amostragem 30%)
            │
            └── CRM (RD/HubSpot) → Webhook → Backend interno (data warehouse)
```

---

## 3. Atribuição multi-touch

### Modelo recomendado: **U-shaped (position-based)**

- 40% crédito ao **primeiro toque** (descoberta — geralmente SEO orgânico ou ad).
- 40% crédito ao **toque de conversão** (geralmente demo agendada via BOFU).
- 20% distribuído entre os toques intermediários.

### Por que U-shaped (e não linear nem time-decay)

- **Linear** dilui demais e mascara canais de descoberta vs canais de fechamento.
- **Time-decay** privilegia BOFU (já dá crédito demais a Sales) e penaliza SEO/conteúdo TOFU.
- **U-shaped** equilibra: reconhece quem trouxe + quem fechou.

### Janela de atribuição

- **Click**: 90 dias (B2B PME/Médio) — ciclo curto.
- **View-through**: 7 dias (display).
- **Tier-1/Enterprise**: 180 dias por ciclo longo (configurar manualmente em HubSpot).

---

## 4. Dashboard mensal (Looker Studio ou Metabase)

### Visões obrigatórias

1. **Funil consolidado**: visitas → leads → MQLs → SQLs → demos → POCs → fechados.
2. **Por canal** (linhas): Orgânico SEO, Google Ads, Meta Ads, LinkedIn Ads, E-mail, Direto, Referral, Eventos, Parceiros.
3. **CAC por canal**: gasto / clientes fechados atribuídos (U-shaped).
4. **Ciclo médio de venda** (dias): por segmento e por canal de origem.
5. **Pipeline gerado** (R$): MRR estimado dos SQLs ativos × probabilidade média de fechamento por estágio.
6. **NRR / Churn / LTV** (data warehouse): cohort por mês de aquisição.
7. **Top 10 páginas** convertendo MQL.
8. **Top 10 keywords** trazendo SQL.

### Cadência

- **Diário** (automático): visitas, leads novos, MQLs novos.
- **Semanal** (review marketing): dashboard funil + top conteúdo.
- **Mensal** (review com vendas + diretoria): CAC, LTV, ciclo, pipeline, retrospectiva canais.

---

## 5. KPIs por estágio

| Estágio             | Métrica primária      | Meta mensal (mês 18)       | Responsável           |
| ------------------- | --------------------- | -------------------------- | --------------------- |
| TOFU                | Visitas únicas        | 10.500                     | Marketing (SEO + Ads) |
| TOFU → Lead         | Lead capture rate     | 3% das visitas (315 leads) | Marketing             |
| Lead → MQL          | MQL rate              | 50% (160 MQLs)             | Marketing automation  |
| MQL → SQL           | SQL rate              | 33% (52 SQLs)              | SDR / Inside Sales    |
| SQL → Demo          | Demo show-up          | 70% (37 demos)             | Inside Sales          |
| Demo → POC          | POC start rate        | 40% (15 POCs)              | Sales                 |
| POC → Fechado       | Win rate              | 40% (6 fechados)           | Sales                 |
| Fechado → Ativo 90d | Onboarding success    | 95%                        | CS                    |
| Ativo → NRR         | Net Revenue Retention | ≥ 110%                     | CS / Sales            |

> Metas escalam ao longo de 18 meses; tabela acima reflete o **regime estável** do mês 18. Plano de ramp-up trimestral em revisão de marketing.

---

## 6. Governança de dados

- **Cookie consent** (LGPD): banner com opt-in granular para analytics e ads.
- **Modo cookieless**: GA4 com Consent Mode v2; perda esperada ~20% de eventos quando usuário recusa cookies.
- **PII em CRM**: e-mail e telefone OK; CPF **nunca** em formulário marketing.
- **Retenção de dados analytics**: 14 meses padrão; histórico agregado em data warehouse.
- **Acesso ao dashboard**: marketing + diretoria full; vendas vê apenas pipeline próprio.
