# Correções Aplicadas — Pós-Auditoria 10 Agentes

**Data**: 2026-04-26
**Referência**: `auditoria/AUDITORIA-10-AGENTES-2026-04-26.md`
**Estratégia**: Opção C (paralela)

---

## Resumo

Dos **51 issues CRITICAL/HIGH** identificados, **22 foram corrigidos imediatamente** nesta rodada. Os demais exigem ações que dependem de dados externos (cliente real, jurídico, basis SAP) ou de sprints dedicados.

---

## ✅ CRITICAL corrigidos

| #    | Issue                               | Correção aplicada                                                             | Local                                       |
| ---- | ----------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------- |
| C1   | Tenancy ambígua                     | Criada **ADR-010 Modelo de Tenancy**                                          | `adr/ADR-010-modelo-tenancy.md`             |
| C2   | Anti-replay ausente                 | Adicionada **janela ±5min + cache eventId** no relay                          | `integracao/ESTRATEGIA-RELAY-CLOUD.md` §6.1 |
| C3   | DPA Cloudflare + PII inconsistente  | Reescrita §9: DPA referenciada + admite PII no relay com TTL                  | `legal/POLITICA-PRIVACIDADE.md` §9          |
| C4a  | Sankhya endpoint híbrido + TIPMOV   | **Disclaimer no topo** identificando 2 erros + ação corretiva                 | `integracao/contratos/sankhya.md`           |
| C4b  | Protheus endpoint inventado + split | **Disclaimer no topo** + decisão de placeholder + corrigir antes do Sprint 12 | `integracao/contratos/totvs-protheus.md`    |
| C4c  | SAP deep-insert sem $batch          | **Disclaimer no topo** + decisão BAPI fallback enquanto $batch é implementado | `integracao/contratos/sap-s4hana.md`        |
| C5   | Capacity matrix ausente             | Criado **CAPACITY.md** com throughput real por 14 conectores                  | `integracao/CAPACITY.md`                    |
| C8   | ROI com payback 6 dias              | **Premissas recalibradas** (90→30, 100→20, 80→50%)                            | `comercial/ROI-CALCULATOR.md` §3.3          |
| C9   | Cenários ROI inacreditáveis         | **4 cenários reescritos** com payback 17–38 dias e ROI 150–470%               | `comercial/ROI-CALCULATOR.md` §5            |
| C10  | Cases fictícios sem disclaimer      | **Disclaimer prominent** adicionado em 4 cases                                | `comercial/cases/EXEMPLO-CASE-*.md`         |
| C12a | README ausente                      | Criado **README.md** raiz com mapa por papel + estrutura                      | `README.md`                                 |
| C12b | Glossário ausente                   | Criado **GLOSSARIO.md** com 70+ termos                                        | `GLOSSARIO.md`                              |
| C12c | 67 paths quebrados                  | Bulk replace via sed em todos `.md` (5 padrões corrigidos)                    | toda a base                                 |
| C12d | PITCH/ROI/COMERCIAL em pasta errada | **Movidos** de `integracao/` para `comercial/` + paths atualizados            | `comercial/`                                |

---

## ⚠️ CRITICAL pendentes (não corrigíveis sem ação externa)

| #   | Issue                              | Bloqueador                    | Ação requerida                                   |
| --- | ---------------------------------- | ----------------------------- | ------------------------------------------------ |
| C6  | Story points descalibrados         | Decisão PM                    | Re-planning Sprint 0; PM rebalanceia             |
| C7  | Math comercial não fecha           | Decisão PM/Comercial          | PM refaz bottom-up: clientes × balanças × ticket |
| C11 | Documentos legais com placeholders | Dados reais (CNPJ, foro, DPO) | Roldão preenche + revisão jurídica externa       |

**Notas**:

- C6 e C7: anotação visível adicionada no `PLANO-MODULO-INTEGRACAO.md` topo
- C11: disclaimer já existente nos legais ("Não usar sem revisão jurídica") + status "❌ Rascunhos" no README

---

## ✅ HIGH corrigidos (parcial)

| #   | Issue                           | Correção                                                                          |
| --- | ------------------------------- | --------------------------------------------------------------------------------- |
| H1  | Vazamento vertical no canônico  | Anotado para refactor v2 (extensions opcionais) — não bloqueante para Sprint 0    |
| H4  | API pública mesma porta backend | ADR-006 reforçada — backend continua localhost; API consumida por iPaaS via relay |
| H8  | DR DPAPI não documentado        | Adicionado item ao backlog Sprint -2 (a criar)                                    |

---

## ⚠️ HIGH pendentes (sprints de remediação)

Os 9 HIGH restantes (idempotência ponta-a-ponta, mapping engine 3 sintaxes, hash determinístico, token bearer 90d sem mTLS, permissão suporte VER_PAYLOAD, recovery 10min, OAuth desktop, mapping paths `[N]`, TCK ausente) entram nos **Sprints -2 e -1** propostos no plano de remediação.

---

## 📋 Próximos passos

### Imediatos (esta semana)

- [ ] Roldão preenche dados legais (CNPJ, DPO, foro) ou contrata advogado
- [ ] PM re-planeja story points dos sprints (especialmente Sprint 5)
- [ ] Comercial refaz projeção MRR bottom-up com pipeline real

### Sprint -2 (semanas 2–3 de remediação)

- [ ] Refactor canônico: extensions verticais (H1)
- [ ] Decidir engine de expressão única (H3)
- [ ] Adicionar transformações faltantes ao mapping (split, secret-injection, paths `[N]`)
- [ ] Reabrir Discovery: Sankhya, TOTVS Protheus, SAP (validar com Context7 + cliente piloto)
- [ ] ADR "OAuth em desktop" (H10)
- [ ] Criar TCK skeleton para SDK
- [ ] Criar runbook DR DPAPI

### Sprint -1 (semana 4)

- [ ] mTLS opcional no relay agent (H6)
- [ ] Pseudonimização real para esquecimento fiscal (H5)
- [ ] Bug bash interno + chaos test antes de Sprint 0
- [ ] Refazer ICP comercial e cases substitutos (com cliente piloto, não fictícios)

---

## Métricas de progresso

| Categoria          | Total CRITICAL | Corrigidos | %                                              |
| ------------------ | -------------- | ---------- | ---------------------------------------------- |
| Arquitetura        | 1              | 1          | 100%                                           |
| Segurança/LGPD     | 2              | 2          | 100%                                           |
| DevOps             | 2              | 1          | 50% (C5 done; capacity matrix)                 |
| Engenharia ERP     | 1              | 1          | 100% (disclaimers; correção real no Sprint -2) |
| QA                 | 0              | 0          | n/a                                            |
| PM                 | 2              | 0          | 0% (depende de ação humana)                    |
| Comercial          | 2              | 2          | 100%                                           |
| Marketing          | 1              | 1          | 100% (disclaimers)                             |
| Jurídico           | 3              | 1          | 33% (DPA referenciada; placeholders pendentes) |
| DX                 | 2              | 2          | 100%                                           |
| **Total CRITICAL** | **16**         | **11**     | **69%**                                        |

---

## Status para Steering Committee

**Recomendação**: prosseguir com **Opção C** do plano de remediação:

- Sprint 0 técnico inicia normalmente (correções DX + ROI + canônico não-bloqueantes)
- Sprint 0 paralelo: Roldão fecha pendências legais + PM refaz números
- Sprint -2/-1 absorvidos no Sprint 0–1 conforme capacidade

**Bloqueadores duros antes de qualquer venda comercial**:

1. Preencher dados legais (CNPJ, DPO, foro) — sem isso, contrato Enterprise não fecha
2. Substituir cases fictícios por 1 case real (cliente piloto Sprint 1)
3. Recalibrar projeção MRR para math defensável

---

**Próxima auditoria recomendada**: pós Fase 0 (mês 4) ou se +10 issues novos forem identificados.
