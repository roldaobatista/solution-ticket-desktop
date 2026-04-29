# Dependências Externas com Lead-time — Runway do Módulo Integração ERP

> **Status:** Vivo, revisar mensalmente
> **Owner agentico:** `PartnerOpsAgent` + `Finance-Agent` + `Agent-Orchestrator`
> **Atualizado:** Sprint 0

---

## 1. Resumo executivo

O caminho crítico **real** do módulo Integração ERP **não é desenvolvimento** — é a cadeia de dependências externas com lead-time longo. Esta tabela explicita cada dependência, prazo realista de obtenção, dono interno, plano B e custo de atraso.

**Caminho crítico externo:** Tech Lead contratado → 2 LOIs assinadas → sandboxes Bling+Sankhya provisionados → SAP PartnerEdge. No modo agentic, esses itens priorizam `COMMERCIAL_GA_READY`; o chassi técnico segue com `Architecture-Agent`, Mock e Generic REST conforme `EXTERNAL-DEPENDENCIES.md`.

## 2. Tabela mestre de dependências

| Dependência                                 | Lead-time                             | Owner           | Plano B                                                                                                    | Custo de atraso por mês de slip                                             | Status atual                                          |
| ------------------------------------------- | ------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Tech Lead contratado**                    | 30-60d                                | HiringOpsAgent  | `Architecture-Agent` cobre interim, com escopo reduzido e revisão adicional                                | R$ 200k/mês slip comercial                                                  | A iniciar                                             |
| **2 LOIs (cartas de intenção) assinadas**   | até fim de Sprint 0                   | PM              | Adiar Fase 1 em 1 sprint enquanto fecha LOI                                                                | R$ 200k/mês                                                                 | A iniciar                                             |
| **Sandboxes Bling + Sankhya provisionados** | 7-14d após pedido formal              | Tech Lead       | Continuar usando sandbox Mock para desenvolvimento; integração real desliza 1-2 sprints                    | R$ 50-80k/mês                                                               | Pedido a fazer Sprint 0                               |
| **SAP PartnerEdge**                         | 4-6 meses                             | PartnerOpsAgent | Priorizar Microsoft Dynamics primeiro (já está no plano oficial); SAP entra Fase 3                         | R$ 0 no curto prazo (Dynamics cobre); R$ 100k+ se piloto SAP atrasar Fase 3 | Iniciar processo Sprint 1                             |
| **TOTVS Partner Solutions**                 | 90-120d                               | PartnerOpsAgent | Priorizar Sankhya primeiro (já está no plano); TOTVS entra na sequência                                    | R$ 0 no curto prazo (Sankhya cobre); R$ 80k+ se atrasar Onda 2              | Iniciar processo Sprint 2                             |
| **Microsoft AppSource (listagem)**          | 60-90d                                | PartnerOpsAgent | Atender Dynamics direto (sem listagem AppSource) durante Fase 1; listagem entra como melhoria de aquisição | R$ 0 técnico; impacto comercial em geração de lead                          | Iniciar Sprint 3                                      |
| **Certificado code signing OV/EV**          | 7-14d (OV) / 4-6 semanas (EV com HSM) | SRE             | Adiar GA pago — **não-negociável** liberar instalador comercial sem code signing                           | R$ 0 antes do GA; bloqueador absoluto no GA                                 | A iniciar Sprint 0 (OV) e Sprint 4 (EV se necessário) |

## 3. Caminho crítico — leitura objetiva

### Bloqueadores em série até Fase 1

1. Tech Lead contratado (30-60d).
2. 2 LOIs assinadas (em paralelo com #1, mas precisa do PM dedicado).
3. Sandboxes Bling + Sankhya (depende de relacionamento comercial; pedir junto da LOI).
4. Cert code signing OV (paralelo, baixo custo).

### Em paralelo (longo prazo, não bloqueia Fase 0/1)

5. SAP PartnerEdge — iniciar Sprint 1, conclui em Fase 3.
6. TOTVS Partner Solutions — iniciar Sprint 2, conclui em Fase 2/3.
7. Microsoft AppSource — iniciar Sprint 3, conclui em Fase 2.

## 4. Riscos cruzados

- **Tech Lead atrasa em 60d**: Fase 0 desliza por inteiro porque não há quem assine ADRs nem revise arquitetura crítica. Plano B de Eng Sr interim **só sustenta 30 dias** sem perda de qualidade significativa.
- **LOIs não fecham até fim de Sprint 0**: a calibração de prioridades (qual ERP recebe atenção primeiro) fica especulativa, e há risco de retrabalho de mapping em Fase 1.
- **Sandbox Bling/Sankhya negado** por critério do parceiro: cair em Mock estende ciclo de homologação; pode adicionar 1-2 sprints à Onda 1 da Fase 1.
- **Cert OV demora >14d**: liberar instalador interno só para piloto, sem distribuir publicamente. GA público fica bloqueado até cert sair.

## 5. Cadência de revisão

- Status desta tabela **revisado em planning de cada sprint**.
- Mudança de status (ex: Tech Lead contratado, LOI fechada) atualiza a tabela e dispara replanejamento se afeta caminho crítico.
- Slip > 2 semanas em qualquer linha do caminho crítico → aplicar `auto_action` de `EXTERNAL-DEPENDENCIES.md` e publicar decision record.
