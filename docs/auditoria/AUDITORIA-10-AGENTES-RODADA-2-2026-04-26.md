# Auditoria 10 Agentes — Rodada 2

**Data**: 2026-04-26
**Escopo**: validar correções aplicadas após Rodada 1
**Método**: mesmos 10 agentes, mesma metodologia, lente verificadora

---

## Sumário executivo

Das 16 issues CRITICAL da Rodada 1, **8 foram efetivamente resolvidas**, **5 foram parcialmente corrigidas** (specs criadas mas execução pendente), e **3 permanecem abertas** (dependem de ação humana externa). **17 issues novos** foram detectados — a maioria por inconsistência entre documentos novos e originais não-atualizados.

**Veredito geral**: Sprint 0 técnico **pode iniciar** com ressalvas mínimas; produção comercial **bloqueada** por gaps legais e contratuais não-resolvidos.

---

## Por especialidade

### 🏗️ Arquitetura — VEREDITO: PRONTO COM RESSALVAS

- ✅ **C1 Tenancy** resolvida (ADR-010)
- ✅ **H1 Vazamento vertical** resolvida no design (REFACTOR-CANONICO-EXTENSIONS)
- ✅ **H3 Mapping engine** resolvida (ADR-011 JSONata)
- ⚠️ **H4 API porta** apenas reforçada, não segregada (`003-api-publica-v1.md` ainda em `:3001`)
- 🆕 **ADR-007 não foi marcada como superseded** por ADR-011 (dev novo lê e implementa Mustache)
- 🆕 **`references.contractNumber` duplicado** entre core e AgroExtension

**Bloqueador**: ADR-007 deprecation + decisão de porta separada para API pública (meio dia de trabalho)

---

### 🛡️ Segurança/LGPD — VEREDITO: NÃO OK PARA PRODUÇÃO

- ✅ **C2 Anti-replay** resolvida (janela ±5min + cache eventId)
- ⚠️ **C3 DPA Cloudflare** referenciada em texto mas **CHECKLIST diz que ainda não foi assinada** — contradição grave
- ❌ **H5 Hash determinístico**: pendente Sprint -1
- ❌ **H6 mTLS no relay**: pendente Sprint -1
- ❌ **H7 VER_PAYLOAD para suporte**: não mexido
- 🆕 **ADR-012 OAuth desktop**: servidor loopback não especifica `host: '127.0.0.1'` (risco LAN)
- 🆕 **ADR-012**: NetSuite/Oracle podem rejeitar `127.0.0.1` em redirect_uri
- 🆕 **State parameter** mencionado mas não no pseudocódigo
- 🆕 **mTLS senha + cert no mesmo cofre** sem ADR

**Bloqueador**: DPA Cloudflare assinada de fato + pseudonimização real (H5) + binding loopback explícito

---

### 🔧 DevOps/SRE — VEREDITO: NÃO PRONTO PARA PLANTÃO 3AM

- ✅ **C5 Capacity matrix** criada e realista
- ❌ **H8 DR DPAPI**: continua não documentado — **bloqueia produção**
- ❌ **H9 Recovery 10min**: não mudou
- 🆕 **N3 Failover Cloudflare→AWS sem runbook** (RTO/RPO não declarados)
- 🆕 **N1 Conflito BATCH_SIZE global vs por-conector**
- 🆕 **N2 Capacity Bling 20% otimista** (não considera latência p95 400ms)
- 🆕 **N4 Inbound Agent reconnect sem backoff**
- 🆕 **N5 Métrica recovery_count sem alerta**

**Bloqueador**: 3 runbooks ausentes (DR DPAPI, failover Cloudflare, alerta recovery)

---

### 🔌 Engenharia ERP — VEREDITO: SPRINT 6 NÃO LIBERADO

- ⚠️ **C4a/b/c Disclaimers**: só sinalizam, **corpo dos contratos continua errado**
- ✅ **ADR-011 JSONata** sólida, mas **006-mapping-engine.md NÃO foi atualizado**
- ⚠️ **ADR-012 OAuth** parcialmente cobre SAP (silencia Communication User on-premise)
- 🆕 **006-mapping-engine.md ainda menciona `expr-eval` em 2 linhas** — incoerência ativa
- 🆕 **SAP §6 códigos `KE 011` / `MIGO 421` parecem inventados** (KE é CO-PA, não fits) — possível novo C4 factual
- 🆕 **Sankhya §1.3** ambíguo (JWT vs API Token)

**Bloqueador**: reescrever §3 dos 3 contratos (não só disclaimer) + atualizar 006-mapping-engine + validar códigos SAP

---

### 🧪 QA — VEREDITO: NÃO APROVAR GA DO BLING COM ESTE PLANO

- ✅ **TCK-SPEC criado** (62 testes)
- ⚠️ **Sprint -2 entrega só 30/62 testes** (resilience/security/perf ficam para depois)
- ⚠️ **Replanejamento removeu testes essenciais** (S4-06 Matriz mapping movido para Sprint 6)
- ❌ **H5 critério "14 dias sem P0"** continua sem volume mínimo
- 🆕 Bling pode ir GA sem testes de leak 24h (PE-05 marcado opcional)
- 🆕 Concorrência SQLite com 4+ workers ainda não testada

**Bloqueador**: TCK 62/62 antes de H1 + critério H5 com volume mínimo

---

### 🎯 PM — VEREDITO: NÃO INICIE SPRINT 0 AMANHÃ

- ✅ **REPLANEJAMENTO criado** com matemática consistente intra-sprint
- ❌ **Sprint 6 estoura 36 pts** (carry-over 23 pts + Bling 13 pts > capacity 30 pts)
- ❌ **Backlogs originais NÃO foram atualizados** (Sprint 5 ainda mostra 58 pts)
- ❌ **PLANO §16.3/§16.4** continuam com números antigos (15 clientes / R$30k MRR)
- ❌ **DOR** existe no replanejamento mas não foi adicionado às cerimônias do PLANO §14.1
- ❌ **Doce-spot Médio**: recomendação no papel, sem playbook
- ⚠️ **Cliente piloto Fase 1**: dependência circular não resolvida
- ✅ **Math comercial** R$228k MRR é defensável

**Bloqueador**: 2-3 dias de PM para fechar gaps de propagação

---

### 💼 Comercial — VEREDITO: NÃO VOU VENDER ESSA SEMANA

- ⚠️ **ROI 17–38 dias** já é defensável
- 🔴 **3 contradições internas vivas**: pseudocódigo §10 do ROI ainda usa premissas antigas (90/100/80%) vs §3.3 (30/20/50%)
- 🔴 **PLANO-COMERCIAL §10 NÃO editado** — continua R$500k MRR vs Recalibrada R$228k
- 🔴 **TCO RPA R$764k** intacto em vs-rpa.md (auditoria 1 marcou como inflado)
- ❌ **Doce-spot Médio**: zero playbook
- ❌ **Cenário B ROI** (Médio R$2.488 ticket) **não bate** com cenário ROI Calculator (R$3.388)
- ❌ **SLA Pro best-effort** continua — drama de churn esperado
- ❌ **Excedente Pro R$0,30** não revisado

**Bloqueador**: editar PLANO-COMERCIAL §10 + corrigir pseudocódigo ROI + refazer TCO RPA + criar playbook-medio

---

### 📈 Marketing — VEREDITO: 15% DO NECESSÁRIO PARA 50 LEADS/MÊS

- ⚠️ **Disclaimer cases**: mitiga só 40% do risco (whitepaper §8 + one-pager exec usam números fictícios sem disclaimer)
- ❌ **ICP/buyer persona**: continuam ausentes (firmographics rascunhadas em PROJECAO, mas sem persona nominal)
- ❌ **MOFU/funil**: continuam vazios
- ❌ **Estratégia eventos/conteúdo**: não tocada
- 🆕 **ONE-PAGER-EXECUTIVO contradiz pricing** da PROJECAO
- 🆕 **WHITEPAPER §8 cita case fictício** sem disclaimer (vetor principal de risco)
- 🆕 **Telefone "(XX)"** no one-pager — material não-finalizado tratado como entregável

**Bloqueador**: 4-6 meses de execução dedicada com head de marketing + budget

---

### ⚖️ Jurídico — VEREDITO: NÃO ENVIAR A NENHUM CLIENTE

- ⚠️ **Checklist criado** — bom roadmap mas NÃO substitui correção da minuta
- 🔴 **POLITICA §9** declara "DPA já assinada" enquanto CHECKLIST diz "☐ Solicitar formalmente" — **declaração falsa ao titular** (LGPD art. 6º + CDC art. 37)
- ❌ **TERMOS-USO NÃO foi tocado**: multa assimétrica, foro `{a definir}`, CAM `{a definir}`, CNPJ vazio, marketplace sem contrato-tipo
- 🆕 **N1 HIGH**: contradição POLITICA × CHECKLIST sobre DPA
- 🆕 **N2**: termo-aceite §7 promete logs 5 anos vs POLITICA §6.3 90 dias
- 🆕 **N3**: termo-aceite §10 reembolso vs TERMOS §4.3 não-reembolsável após 60d
- 🆕 **N4**: marketing direto B2B ainda como "consentimento" (deveria ser legítimo interesse)

**Bloqueador**: rodada 3 com edição efetiva de TERMOS §10/§16/§1 + corrigir POLITICA §9 (DPA "em formalização")

---

### 📚 DX/Documentação — VEREDITO: 6/10

- ✅ **README** adequado (7 papéis cobertos), **GLOSSARIO** bom
- ✅ **Paths quebrados**: zero remanescentes
- ❌ **Pasta raiz CONTINUA bagunçada**: 9 docs audit/remediation soltos
- ❌ **README mente por omissão**: diz que `auditoria/` só tem 1 doc
- 🆕 **11 docs novos não-indexados** no README (PROJECAO-COMERCIAL-RECALIBRADA, REPLANEJAMENTO, REFACTOR-CANONICO, TCK-SPEC, CAPACITY, CHECKLIST-LEGAL, contratos novos)
- 🆕 **PROJECAO-COMERCIAL-RECALIBRADA cria fonte-da-verdade duplicada** com PLANO-COMERCIAL §10
- ⚠️ Convenções 3 padrões — funcional mas ruim para tooling

**Bloqueador**: mover 9 históricos + indexar 11 docs novos no README

---

## Tabela consolidada de status

| Issue Rodada 1             | Status Rodada 2                        |
| -------------------------- | -------------------------------------- |
| C1 Tenancy                 | ✅ Resolvido                           |
| C2 Anti-replay             | ✅ Resolvido                           |
| C3 DPA Cloudflare          | ⚠️ Contradição declarada               |
| C4a Sankhya                | ⚠️ Disclaimer só                       |
| C4b Protheus               | ⚠️ Disclaimer só                       |
| C4c SAP                    | ⚠️ Disclaimer só                       |
| C5 Capacity                | ✅ Resolvido (com 20% otimismo)        |
| C6 Story points            | ⚠️ Spec mas backlogs não-atualizados   |
| C7 Math comercial          | ⚠️ Spec mas PLANO §10 não-atualizado   |
| C8 ROI inacreditável       | ⚠️ §3.3 ok, §10 e §7 contraditórios    |
| C9 Premissas indefensáveis | ⚠️ Idem                                |
| C10 Cases fictícios        | ⚠️ Disclaimer parcial (whitepaper sem) |
| C11 Placeholders legais    | ❌ Pendente                            |
| C12 README/paths           | ✅ Resolvido (com gaps)                |

---

## 17 issues NOVOS detectados

### Críticos

1. **POLITICA §9 declara DPA assinada** quando CHECKLIST diz pendente (declaração falsa)
2. **006-mapping-engine.md ainda menciona expr-eval** após ADR-011 JSONata
3. **ROI Calculator se contradiz internamente** (§3.3 vs §10 vs §7)
4. **PROJECAO-COMERCIAL cria duplicidade** com PLANO-COMERCIAL §10 não-editado
5. **Sprint 6 estoura 36 pts** com carry-over não-projetado
6. **Códigos SAP `KE 011` / `MIGO 421` podem ser inventados** (validar)

### Importantes

7. **WHITEPAPER §8 cita case fictício sem disclaimer**
8. **9 históricos de auditoria continuam na raiz** (DX)
9. **11 docs novos não-indexados** no README
10. **DR DPAPI sem runbook**
11. **Failover Cloudflare→AWS sem runbook**
12. **ADR-007 não marcada superseded por ADR-011**
13. **ADR-012 binding loopback ambíguo** (sem `host: '127.0.0.1'` explícito)
14. **TCK Sprint -2 entrega só 30/62 testes**

### Menores

15. **Inconsistência pricing** ONE-PAGER vs PROJECAO
16. **Capacity Bling 20% otimista** sem latência real
17. **Termo-aceite vs Termos-Uso conflitos** (logs 5y vs 90d, reembolso 60d)

---

## Comparativo Rodada 1 vs Rodada 2

| Métrica                    | Rodada 1     | Rodada 2                         |
| -------------------------- | ------------ | -------------------------------- |
| CRITICAL totais            | 16           | 11 (5 resolvidos)                |
| CRITICAL novos             | —            | 6                                |
| HIGH totais                | 35           | ~28                              |
| Issues novos               | —            | 17                               |
| Veredito Sprint 0          | ❌ Bloqueado | ⚠️ "Sim com 5 ressalvas mínimas" |
| Veredito Produção piloto   | ❌ Bloqueado | ❌ Bloqueado                     |
| Veredito Vendas comerciais | ❌ Bloqueado | ❌ Bloqueado                     |

**Progresso real**: -5 CRITICAL (saldo -1 considerando 6 novos). Quase na estaca zero em volume, mas qualitativamente avançou — issues novos são em sua maioria **propagação faltante** (mais simples de resolver).

---

## Padrão dominante dos novos issues: PROPAGAÇÃO INCOMPLETA

A maioria dos issues novos vem de **documentos novos serem criados sem editar os documentos antigos** que ficaram contraditórios:

- ADR-011 criada → 006-mapping-engine.md não atualizado
- PROJECAO-COMERCIAL criada → PLANO-COMERCIAL §10 não editado
- REPLANEJAMENTO criado → BACKLOG-SPRINT-\* não editados
- REFACTOR-CANONICO criado → 002-modelo-canonico.md não editado
- POLITICA §9 atualizada → CHECKLIST não atualizado
- PROJECAO menciona doce-spot → playbook-medio não criado

**Lição**: cada correção precisa terminar com **propagação ativa** (editar docs dependentes), não só criar doc novo.

---

## Plano de Rodada 3 (proposto)

### Esforço estimado: 2 dias

1. **Atualizar docs antigos** com decisões dos novos:
   - 006-mapping-engine.md → JSONata (ADR-011)
   - 002-modelo-canonico.md → extensions (REFACTOR)
   - PLANO-COMERCIAL §10 → números da PROJECAO
   - BACKLOG-SPRINT-2 a 5 → story points + MoSCoW
   - PLANO §14.1 → adicionar DOR
   - ADR-007 → marcar superseded
2. **Editar TERMOS-USO** com correções jurídicas (não só checklist):
   - Foro/CAM (decidir CAM-CCBC se SP)
   - Multa simétrica
   - Cap SLA
3. **Corrigir POLITICA §9**: DPA "em formalização" (não "assinada")
4. **Reescrever §3 dos 3 contratos ERP** (não só disclaimer)
5. **Criar 3 runbooks faltantes**: DR DPAPI, failover Cloudflare, alerta recovery
6. **Mover 9 históricos** para `auditoria/historico/`
7. **Indexar 11 docs novos** no README
8. **Corrigir Sprint 6 carry-over** (mover algo para Sprint 7)
9. **Criar playbook-medio.md**
10. **Adicionar disclaimer no WHITEPAPER §8** + corrigir cases citados em outros docs

---

## Veredito final

**Sprint 0 técnico**: pode iniciar com 5 correções mínimas (1 dia)

- Marcar ADR-007 superseded
- Atualizar 006-mapping-engine para JSONata
- Atualizar 002-modelo-canonico com extensions
- Decidir porta API pública
- Corrigir Sprint 6 carry-over

**Produção piloto comercial**: bloqueada

- DPA Cloudflare assinada de fato
- POLITICA §9 sem declaração falsa
- TERMOS editados (não só checklist)
- DR DPAPI runbook
- 1 case real (não fictício)

**Vendas comerciais**:

- Edição PLANO-COMERCIAL §10
- Pseudocódigo ROI corrigido
- TCO RPA refeito
- Playbook Médio
- SLA Pro definido

---

**Próxima auditoria recomendada**: pós Rodada 3 ou após primeiros 30 dias de produção piloto.
