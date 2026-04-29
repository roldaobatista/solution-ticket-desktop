# ADR-022 — Política de branch e PR diferenciada para o módulo Integração ERP

- **Status:** Aceita
- **Data:** 2026-04-27
- **Autores agenticos:** `Architecture-Agent` + `Security-Agent`
- **Cross-link:** `docs/integracao/PLANO-MODULO-INTEGRACAO.md` §1.7, `~/.claude/CLAUDE.md` (global), `RELEASE.md`

---

## 1. Contexto

O `CLAUDE.md` global do dono do produto estabelece: **"SEMPRE direto em main, sem PR, sem code review interno"**. Essa política é eficiente para um produto de pesagem-base com um único stakeholder técnico e sem requisitos regulatórios externos.

A auditoria R2 (PM, Engenharia, CISO) levantou conflito direto entre essa política e os requisitos do módulo Integração ERP para clientes Tier-1/Enterprise:

- **SAP PartnerEdge** exige trilha de change management auditável (commits assinados, revisão por pares, retenção de PR).
- **TOTVS** (homologação Protheus) exige documentação de mudança e rollback testado.
- **Oracle EBS** e clientes ANPD-sensíveis exigem segregação de funções e prova de revisão.

Manter o fluxo "main direto" no chassi do módulo significa **perder homologação** ou expor a empresa a auditoria reprovada por terceiros.

## 2. Decisão — política diferenciada por escopo

### 2.1. Produto-base (continua como está)

Pesagem, hardware, billing, UI core, telas administrativas que não toquem `backend/src/integracao/**`:

- Segue `~/.claude/CLAUDE.md` global.
- Main direto, sem PR, sem code review interno.
- Validação local rápida (lint + types) antes do push.

### 2.2. Módulo Integração ERP — chassi (change record + 2 reviewers agenticos)

A partir de Sprint 1, **PR obrigatório** para mudanças em:

- `backend/src/integracao/**` — toda lógica do hub (Outbox, Mapping, Cofre, Audit Trail, Conectores Tier-1+).
- `backend/prisma/schema.prisma` — adições/alterações em tabelas `integracao_*`.
- `frontend/src/integracao/**` — UI do hub.
- `docs/adr/ADR-0*.md` quando o ADR for novo ou alterar decisão vigente.

Regras:

- **2 reviewers agenticos** mínimo (`Architecture-Agent` + 1 entre `SRE-Agent`, `Security-Agent`, `QA-Automation-Agent` conforme escopo).
- **Commits assinados**, quando infraestrutura Git estiver disponível, são preferidos; quando não estiver, anexar hash do diff e evidence pack em `EVIDENCE-MANIFEST.md`.
- **Branch curta** — duração ≤ 7 dias entre criação e merge; branches mais longas exigem rebase semanal.
- **Commits atômicos** — fix, feature, refactor, docs em commits separados.
- **Merge squash** padrão; merge commit apenas para releases.
- **CI verde mandatório** — não há "merge mesmo com red".

### 2.3. Módulo Integração ERP — periferia (main direto permitido)

- UI Mapping (apenas tela, sem lógica de mapping).
- Runbooks, FAQs, READMEs do módulo.
- Documentos `docs/integracao/*.md` que não sejam ADR nem contratos formais.
- Templates e checklists.

Pode ir direto em main se afetar **só** doc ou UI sem alteração de contrato/lógica.

## 3. Justificativa

O chassi do módulo é regulatório-fiscal e auditado por terceiros (SAP PartnerEdge, TOTVS, ANPD). Trilha de change management não é preferência interna, é **requisito contratual** para fechar contratos Tier-1.

A política diferenciada preserva eficiência onde não há risco regulatório (produto-base, periferia do módulo) e atende compliance onde há (chassi).

## 4. Implementação

### 4.1. Branch protection (GitHub)

Configurar regras protegendo `main` para os caminhos:

- `backend/src/integracao/**`
- `backend/prisma/schema.prisma` (com escopo: bloquear apenas commits que alterem tabelas `integracao_*`).
- `frontend/src/integracao/**`
- `docs/adr/**`

Required reviewers: **2 reviewers agenticos** ou CODEOWNERS reais quando GitHub exigir pessoa.

Required checks: lint, types, unit, contract, e2e crítico.

Required signatures: `Verified` no GitHub (commits assinados com GPG ou SSH).

### 4.2. CODEOWNERS

Adicionar `.github/CODEOWNERS` mapeando os caminhos acima para Tech Lead e reviewers cadastrados.

### 4.3. Pre-commit hook local

Bloquear commit não assinado em arquivos cobertos por esta política.

## 5. Override emergencial (Sev1)

Hotfix Sev1 (sistema parado em cliente Tier-1, perda de dados, vazamento) pode ser direto em main desde que:

- `Incident-Agent` confirma Sev1 com evidencia de telemetria/log e aciona `Security-Agent` ou `SRE-Agent`.
- Commit assinado mantido (não há override de assinatura).
- Mensagem do commit começa com `HOTFIX-SEV1: <descrição>`.
- **Post-merge review obrigatório em 24h** — PR retroativo aberto, revisado e merged-in-doc com link para o commit emergencial.
- Incidente registrado no runbook com causa raiz e prevenção.

Override sem evidence pack ou sem post-review = violação de política, tratada como incidente de segurança.

## 6. Implicações

- Velocidade de entrega no chassi cai ~10-15% pelo overhead de PR; absorvido no planejamento.
- Onboarding de novos engs do módulo inclui treinamento em assinatura de commit + fluxo de PR.
- Auditorias externas (SAP, TOTVS) ganham trilha exportável via `gh api` ou export de PRs.
- Fluxo automático "salvei a correção" (do CLAUDE.md global) **continua válido** para produto-base e periferia; agente Claude detecta caminho e aplica política certa.

## 7. Revisão

Revisar este ADR em 6 meses (2026-10) ou quando primeiro cliente Tier-1 fechar contrato — o que vier antes.
