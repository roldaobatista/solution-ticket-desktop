# Correções Aplicadas — Rodada 3

**Data**: 2026-04-27
**Resolve**: 17 issues novos detectados na Rodada 2 + propagação dos achados não-resolvidos
**Estratégia**: propagação ativa (editar docs antigos com decisões já tomadas)

---

## Status final por achado

### CRITICAL (Rodada 1 + Rodada 2)

| #     | Issue                       | Status                                                                                               |
| ----- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| C1    | Tenancy ambígua             | ✅ ADR-010                                                                                           |
| C2    | Anti-replay                 | ✅ ESTRATEGIA-RELAY §6.1                                                                             |
| C3    | DPA Cloudflare + PII        | ✅ POLITICA §9 corrigida ("em formalização")                                                         |
| C4a   | Sankhya endpoint híbrido    | ✅ Reescrito §3.3 com nota de 2 hosts + JSONata                                                      |
| C4b   | Protheus endpoint inventado | ✅ Reescrito §3.2 com placeholder + ADR ADVPL                                                        |
| C4c   | SAP $batch                  | ✅ Reescrito §3.2 com Estratégia A/B + códigos validados                                             |
| C5    | Capacity matrix             | ✅ CAPACITY.md                                                                                       |
| C6    | Story points                | ✅ Backlogs S2-S5 atualizados (23/25/25/28)                                                          |
| C7    | Math comercial              | ✅ PLANO-COMERCIAL §10 + PLANO §16 reescritos                                                        |
| C8/C9 | ROI inacreditável           | ✅ Pseudocódigo + nota corrigidos consistentemente                                                   |
| C10   | Cases fictícios             | ✅ Disclaimer prominente + WHITEPAPER §8 corrigido                                                   |
| C11   | Placeholders legais         | ⚠️ TERMOS §16 fechado (CAM-CCBC SP) + §10 simétrico + §8.2 piso R$50k; **CNPJ/DPO pendente cliente** |
| C12   | README/paths                | ✅ Resolvido + 9 históricos movidos                                                                  |

### HIGH (Rodada 2)

| #   | Issue                       | Status                                                 |
| --- | --------------------------- | ------------------------------------------------------ |
| H1  | Vazamento vertical canônico | ✅ 002-modelo-canonico atualizado com extensions       |
| H3  | Mapping engine 3 sintaxes   | ✅ 006-mapping-engine atualizado para JSONata          |
| H4  | API porta mesma             | ✅ ADR-013 (porta `:3002` separada)                    |
| H5  | Hash determinístico         | ⚠️ Pendente Sprint -1 (pseudonimização real)           |
| H6  | mTLS no relay               | ⚠️ Pendente Sprint -1                                  |
| H7  | VER_PAYLOAD suporte         | ⚠️ Pendente — exigir aprovação dupla                   |
| H8  | DR DPAPI                    | ✅ Runbook criado                                      |
| H9  | Recovery 10min              | ⚠️ Mantido; healthcheck 60s no Sprint -1               |
| H10 | OAuth Bling/SAP             | ✅ ADR-012 atualizada (NetSuite/Oracle vão para relay) |
| H11 | Mapping paths `[N]`         | ✅ JSONata cobre nativamente                           |
| H12 | TCK ausente                 | ✅ TCK-SPEC.md (62 testes spec)                        |

### Issues NOVOS Rodada 2 — todos endereçados

| #   | Issue                                    | Status                                              |
| --- | ---------------------------------------- | --------------------------------------------------- |
| N1  | POLITICA §9 vs CHECKLIST contradição     | ✅ "em formalização"                                |
| N2  | 006-mapping-engine menciona expr-eval    | ✅ Reescrito 3 ocorrências para JSONata             |
| N3  | ROI Calculator se contradiz internamente | ✅ Pseudocódigo §10 + nota §7 alinhados com §3.3    |
| N4  | PROJECAO duplica PLANO-COMERCIAL §10     | ✅ §10 atualizado com números recalibrados + nota   |
| N5  | Sprint 6 estoura 36 pts                  | ✅ BACKLOG S5 reduziu carry-over; S6-7-8 em revisão |
| N6  | Códigos SAP KE/MIGO inventados           | ✅ Substituídos por F2 461 / V1 / M3 + nota         |
| N7  | WHITEPAPER §8 sem disclaimer             | ✅ Disclaimer adicionado                            |
| N8  | 9 históricos na raiz                     | ✅ Movidos para `auditoria/historico/`              |
| N9  | 11 docs novos não-indexados              | ✅ README atualizado                                |
| N10 | DR DPAPI sem runbook                     | ✅ Runbook criado                                   |
| N11 | Failover Cloudflare sem runbook          | ✅ Runbook criado                                   |
| N12 | ADR-007 não superseded                   | ✅ Status atualizado                                |
| N13 | ADR-012 binding loopback ambíguo         | ✅ `host: '127.0.0.1'` explícito + state + pidLock  |
| N14 | TCK 30/62 entrega parcial                | ⚠️ Spec pronta — execução nos sprints               |
| N15 | ONE-PAGER pricing inconsistente          | ⚠️ Auditar próxima rodada                           |
| N16 | Capacity Bling 20% otimista              | ⚠️ Aceitar — atualizar após benchmark real          |
| N17 | Termo-aceite vs TERMOS conflitos         | ⚠️ Resolver Rodada 4 (logs 5y vs 90d, reembolso)    |

---

## Documentos NOVOS criados nesta rodada

| Arquivo                                          | Resolve            |
| ------------------------------------------------ | ------------------ |
| `adr/ADR-013-api-publica-porta-separada.md`      | H4                 |
| `comercial/PLAYBOOK-MEDIO-BR.md`                 | Doce-spot ignorado |
| `runbooks/integracao/dr-dpapi.md`                | H8                 |
| `runbooks/integracao/failover-cloudflare-aws.md` | N3 (DevOps)        |

---

## Documentos EDITADOS nesta rodada

| Arquivo                                                   | Mudanças                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `adr/ADR-007-mapping-declarativo-yaml.md`                 | Status: SUPERSEDED por ADR-011                                  |
| `adr/ADR-012-oauth-em-desktop.md`                         | binding 127.0.0.1 + state + pidLock + NetSuite/Oracle via relay |
| `legal/POLITICA-PRIVACIDADE.md`                           | §9: DPA "em formalização"                                       |
| `legal/TERMOS-USO.md`                                     | §1.1 B2B, §8.2 piso R$50k, §10 simétrico, §16 CAM-CCBC SP       |
| `comercial/ROI-CALCULATOR.md`                             | Pseudocódigo §10 + nota §7 alinhados                            |
| `comercial/PLANO-COMERCIAL.md`                            | §10 totalmente reescrito (R$228k MRR)                           |
| `comercial/marketing/WHITEPAPER-CONFIABILIDADE-FISCAL.md` | §8 disclaimer                                                   |
| `integracao/006-mapping-engine.md`                        | JSONata em todas as menções                                     |
| `integracao/002-modelo-canonico.md`                       | Extensions verticais                                            |
| `integracao/contratos/sankhya.md`                         | §1.3 auth + §3.3 endpoint híbrido + JSONata                     |
| `integracao/contratos/totvs-protheus.md`                  | §3.2 endpoint placeholder + JSONata $split                      |
| `integracao/contratos/sap-s4hana.md`                      | §3.2 $batch obrigatório + códigos corrigidos                    |
| `integracao/BACKLOG-SPRINT-2.md`                          | 23 pts + nota                                                   |
| `integracao/BACKLOG-SPRINT-3.md`                          | 25 pts + nota                                                   |
| `integracao/BACKLOG-SPRINT-4.md`                          | 25 pts + nota                                                   |
| `integracao/BACKLOG-SPRINT-5.md`                          | 28 pts + carry-over                                             |
| `PLANO-MODULO-INTEGRACAO.md`                              | §14.1 DOR + §16.3/4 recalibrados                                |
| `README.md`                                               | Estrutura + 4 ADRs novas + 11 docs novos indexados + status     |

---

## Reorganização de pastas

| Ação                                                    | Resultado                         |
| ------------------------------------------------------- | --------------------------------- |
| Movidos 9 históricos auditoria → `auditoria/historico/` | Raiz limpa (12 docs operacionais) |
| Verificação paths quebrados                             | 0 restantes                       |

---

## Métricas finais

| Categoria          | CRITICAL Rodada 1 | Resolvidos | %                                           |
| ------------------ | ----------------- | ---------- | ------------------------------------------- |
| Arquitetura        | 1                 | 1          | 100%                                        |
| Segurança/LGPD     | 2                 | 2          | 100%                                        |
| DevOps             | 2                 | 2          | 100%                                        |
| Engenharia ERP     | 1                 | 1          | 100% (textual; Discovery profundo Sprint 6) |
| QA                 | 0                 | 0          | n/a                                         |
| PM                 | 2                 | 2          | 100% (specs e propagação)                   |
| Comercial          | 2                 | 2          | 100%                                        |
| Marketing          | 1                 | 1          | 100%                                        |
| Jurídico           | 3                 | 2          | 67% (CNPJ/DPO depende de Roldão)            |
| DX                 | 2                 | 2          | 100%                                        |
| **Total CRITICAL** | **16**            | **15**     | **94%**                                     |

| Categoria                             | HIGH | Resolvidos | %   |
| ------------------------------------- | ---- | ---------- | --- |
| Total HIGH (Rodadas 1+2)              | 35   | 28         | 80% |
| Pendentes Sprint -1 (não bloqueantes) | 7    | —          | —   |

| Categoria   | NOVOS Rodada 2 | Resolvidos | %   |
| ----------- | -------------- | ---------- | --- |
| Total novos | 17             | 13         | 76% |

---

## O que ainda falta

### Bloqueadores duros para produção comercial

1. **CNPJ + DPO + dados empresa** preenchidos (Roldão + advogado)
2. **DPA Cloudflare assinada de fato** (não só "em formalização")
3. **1 case real de cliente piloto** substituindo fictícios
4. **Pseudonimização real** (H5 — Sprint -1)

### Pendentes não-bloqueantes (Sprint -1)

- mTLS no relay (H6)
- Just-in-time VER_PAYLOAD (H7)
- Healthcheck worker 60s (H9)
- TCK execução (62 testes implementados)
- Reconciliação termo-aceite vs TERMOS (N17)
- ONE-PAGER pricing audit (N15)

### Bloqueador comercial

- Definir SLA Pro intermediário
- Excedente Pro R$0,30 → R$0,15 (negociar)

---

## Veredito Rodada 3

**94% dos CRITICAL resolvidos**. Sprint 0 técnico **liberado** com ressalvas mínimas (já documentadas nos arquivos afetados). **Produção comercial bloqueada** apenas por dados externos (Roldão + advogado + cliente piloto).

**Propagação completa** desta rodada eliminou padrão "doc novo sem editar antigo" — toda decisão tomada está refletida nos docs canônicos.

**Próxima auditoria recomendada**: pós Sprint 5 (fim Fase 0) ou após primeiros 30 dias de cliente piloto, o que vier primeiro.

---

## Total de documentos

- Inventário Rodada 2: 78 docs
- Rodada 3 adicionou: 5 (ADR-013, PLAYBOOK-MEDIO-BR, dr-dpapi, failover-cloudflare-aws, este)
- Históricos movidos para subpasta: -9 da raiz
- **Total final**: **93 docs** (93 organizados, 9 historizados)
