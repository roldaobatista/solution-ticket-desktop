# 009 — Critérios de Homologação (Sumário Executivo)

**Versão**: 1.1 — 2026-04-29 (agent-first)
**Plano detalhado**: `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md`
**Audiência**: subagentes de execução, engenharia, produto, jurídico/LGPD, cliente quando existir

> **Regra agentic:** H1-H5 fecham estados técnicos (`TECH_READY`/`PILOT_READY`). Assinatura de cliente ou diretoria é dependência externa para `COMMERCIAL_GA_READY`, não bloqueia validação técnica.

Este documento é o **resumo executivo** do plano de homologação. Para detalhes operacionais (cenários, massa de teste, templates) consulte o plano completo.

---

## 1. Quando homologar

Após implementação concluída em sandbox (Etapa 4 do Playbook). Sem homologação, conector **não vai para produção**.

---

## 2. As 5 fases

| Fase   | Foco                           | Duração   | Responsável                             |
| ------ | ------------------------------ | --------- | --------------------------------------- |
| **H1** | Validação técnica em sandbox   | 3–5 dias  | `Backend-Agent` + `QA-Automation-Agent` |
| **H2** | Cenários de erro               | 2–3 dias  | `Backend-Agent` + `QA-Automation-Agent` |
| **H3** | Carga e resiliência            | 2 dias    | `QA-Automation-Agent` + `SRE-Agent`     |
| **H4** | Homologação assistida/sombra   | 2 semanas | `QA-Automation-Agent` + cliente/fixture |
| **H5** | Produção piloto/sombra → ativo | 2 semanas | `SRE-Agent` + `Support-Agent`           |

**Total**: ~5 semanas por conector.

---

## 3. Critérios de aprovação por fase

### H1 — Técnico

- [ ] 16/16 cenários de pull/push passando
- [ ] Cobertura de testes ≥ 80%
- [ ] Reviews agenticos de spec e qualidade aprovados

### H2 — Erros

- [ ] 8/8 cenários de erro técnico (retry funciona)
- [ ] 8/8 cenários de erro de negócio (não retenta)
- [ ] Mensagens de erro claras

### H3 — Carga

- [ ] 1000 tickets em < 10 min
- [ ] Latência p95 < 2s
- [ ] Memória estável em 24h
- [ ] CPU média < 30%

### H4 — Assistida/sombra

- [ ] 10/10 cenários executados sem ajuda do implementador
- [ ] 100 pesagens reais ou simuladas sem perda/duplicidade
- [ ] Relatório de evidências H4 gerado

### H5 — Produção

- [ ] Modo Sombra: 7 dias sem divergência
- [ ] Modo Ativo: 14 dias consecutivos sem P0/P1
- [ ] Métricas dentro da meta

---

## 4. Estados de liberação

Conector recebe estado por evidência:

- `TECH_READY`: H1-H3 verdes, threat model/reviews/contract tests/TCK conforme `EVIDENCE-MANIFEST.md`.
- `PILOT_READY`: `TECH_READY` + H4/H5 em cliente real ou sombra equivalente, sem P0/P1.
- `COMMERCIAL_GA_READY`: `PILOT_READY` + dependências externas resolvidas em `EXTERNAL-DEPENDENCIES.md`.

---

## 5. Métricas absolutas (não-negociáveis)

| Métrica                         | Meta     |
| ------------------------------- | -------- |
| Pesagens perdidas               | 0        |
| Pesagens duplicadas no ERP      | 0        |
| Eventos sem idempotency key     | 0        |
| Tempo para diagnosticar falha   | < 10 min |
| Operação bloqueada por ERP fora | 0 casos  |

---

## 6. Plano de rollback

Se incidente P0 ocorrer nos primeiros 30 dias após GA:

1. Cliente afetado vai para modo manual (export CSV)
2. Investigação em < 4h
3. Hotfix em < 24h
4. Re-homologação parcial antes de reativar

Detalhe em `PLANO-HOMOLOGACAO-CONECTOR.md` seção 9.

---

## 7. Evidências finais

Documento `docs/integracao/templates/relatorio-homologacao.md` exige evidências de:

- `Architecture-Agent`
- `ERP-Specialist-Agent`
- `QA-Automation-Agent`
- `SRE-Agent`
- `Security-Agent`
- `LGPD-Legal-Agent`
- Cliente piloto e área comercial apenas como dependência externa quando o alvo for `COMMERCIAL_GA_READY`

Sem evidência técnica, conector não chega a `TECH_READY`. Sem dependências externas, conector não chega a `COMMERCIAL_GA_READY`.

---

## 8. Casos especiais

### 8.1 Conector genérico (REST/CSV/SFTP)

- Não passa por H4/H5 com cliente específico
- Homologado uma vez na Fase 0
- Cada cliente que usar faz onboarding técnico próprio (não é re-homologação)

### 8.2 Update de conector existente

- Mudança maior (breaking): re-homologação completa
- Mudança menor (campo novo opcional): apenas H1 + H3
- Hotfix: testes de regressão + smoke test

### 8.3 Cliente migrando de outro produto

- Período de "modo sombra" estendido para 4 semanas (vs 2)
- Comparação 1:1 com ferramenta anterior por 2 semanas
- Migração de dados históricos opcional (serviço pago)

---

## 9. Referências

- `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md` — plano completo
- `docs/integracao/007-playbook-conectores-erp.md` — playbook das 6 etapas
- `docs/integracao/templates/relatorio-homologacao.md` — template
- `docs/integracao/templates/termo-aceite-cliente.md` — termo legal
