# Tabletop Semestral — Resposta a Incidente de Segurança (Executivo)

> **Escopo:** simulação executiva (não game day técnico) para validar
> coordenação multi-área em incidentes de segurança, privacidade e
> regulatório.
> **Owner:** CISO + Tech Lead (facilitação) — patrocínio CEO.
> **Cross-link:** SECURITY-INCIDENT-PLAYBOOK.md (técnico operacional),
> THREAT-MODEL-INTEGRACAO.md, ROPA-MODULO-INTEGRACAO.md, ON-CALL.md.

---

## 1. Diferença entre tabletop e game day técnico

| Aspecto       | Game day técnico                               | Tabletop executivo                                |
| ------------- | ---------------------------------------------- | ------------------------------------------------- |
| Foco          | Sistema reage; SRE/devs corrigem em fluxo real | Decisão humana; comunicação; cadeia de comando    |
| Duração       | 2-8h, ambiente real ou stage                   | 2-3h, sala de reunião                             |
| Participantes | SRE, devs, on-call                             | C-level, jurídico, comercial, comunicação         |
| Saída         | Bugs/runbooks corrigidos                       | Gaps de processo + comunicação + responsabilidade |

Este documento descreve **o tabletop**. O game day técnico está em
`SECURITY-INCIDENT-PLAYBOOK.md` + `CHAOS-ENGINEERING-PLAN.md`.

---

## 2. Participantes

Obrigatórios em todas as sessões:

- **CEO** (sponsor, decisões de negócio)
- **CISO** (facilitação técnica, prioridades de segurança)
- **DPO** (decisões LGPD, comunicação à ANPD)
- **Jurídico** (responsabilidade civil, contratos, comunicações regulatórias)
- **Comercial / CSM** (comunicação com clientes afetados)
- **Tech Lead** (impacto técnico, esforço, viabilidade)
- **SRE on-call** (input técnico operacional)

Opcional (conforme cenário):

- Marketing / Comunicação (incidente público)
- Financeiro (custo de resposta, seguro)
- RH (insider threat)

---

## 3. Cenários (rotação semestral — 1 cenário/sessão)

### Cenário A — Vazamento de PII via relay

- Atacante explorou misconfig no relay; CPFs de 2 clientes vazaram em log
  externo indexado por motor de busca.
- **Decisões a treinar**: comunicação à ANPD em ≤72h; comunicação aos
  titulares; comunicação aos clientes contratantes; contenção do indexamento;
  pós-mortem público.

### Cenário B — Ransomware na infraestrutura corporativa

- Estação do Tech Lead criptografada; chave RSA `keygen/private.key`
  potencialmente exfiltrada antes de cifrar.
- **Decisões**: pagar ou não? Acionar seguro cyber? Revogar todas as
  licenças emitidas? Reemitir com nova chave? Comunicação aos clientes?

### Cenário C — Insider threat (suporte abusa de VER_PAYLOAD_CRU)

- Auditoria detecta funcionário do suporte usando elevação `VER_PAYLOAD_CRU`
  para colher CPFs de motoristas e vender em fórum.
- **Decisões**: ação trabalhista; comunicação aos clientes afetados; revisão
  de processo; comunicação à ANPD; lições para controle de acesso.

### Cenário D — Supply chain compromise (deps NPM)

- Pacote NPM popular usado pelo backend recebe update malicioso via
  account takeover do mantenedor; release 2.4.1 sai de canary com
  exfiltração de tokens.
- **Decisões**: rollback emergencial; revogação de tokens em massa;
  reemissão de release; comunicação a clientes Tier-1.

### Cenário E — Cert SAP comprometido

- Token API SAP PartnerEdge vaza em PR público no GitHub (commit acidental
  de um dev).
- **Decisões**: rotação imediata; comunicação ao SAP; impacto em
  certificação PartnerEdge; revisão de processos de pre-commit.

### Cenário F — Investigação ANPD por reclamação de titular

- Titular reclama à ANPD que pediu exclusão e não foi atendido; ANPD abre
  procedimento e exige resposta em 15 dias úteis.
- **Decisões**: prazo legal; coleta de evidências; resposta formal;
  exposição de gaps de processo; eventuais multas.

---

## 4. Calendário e cadência

- **1 cenário por semestre** (mínimo); 2 cenários/ano.
- Sessão dura **2-3h** + 30min de debrief.
- Calendário fixo: 2º trimestre + 4º trimestre, datas combinadas no início
  do ano fiscal.
- Convocação 4 semanas antes; presença obrigatória dos titulares (suplência
  formal admitida apenas para Comercial / CSM).

---

## 5. Estrutura da sessão

1. **Briefing (10 min)** — facilitador apresenta o cenário inicial; sem
   informação prévia aos participantes.
2. **Injeção 1 (30 min)** — situação se agrava; novas informações
   chegam; equipe decide e documenta ações.
3. **Injeção 2 (30 min)** — pressão externa (cliente, mídia, regulador).
4. **Injeção 3 (30 min)** — descoberta de complicação adicional (ex.: dado
   sensível além do esperado, atacante interno, perda de evidência).
5. **Resolução (20 min)** — equipe declara contenção e plano de
   recuperação.
6. **Debrief (30 min)** — gaps identificados, próximas ações, owners,
   prazos.

---

## 6. Saída (entregável)

Cada sessão produz um **relatório** com:

- Cronologia das decisões.
- Gaps de processo identificados (comunicação, responsabilidade, ferramenta,
  documentação).
- Ações corretivas com owner + prazo (entram no backlog).
- Avaliação de cobertura do seguro cyber para o cenário.
- Próximo cenário sugerido.

Relatório fica em `docs/security/tabletops/<YYYY>-<sem>-<cenario>.md` por
5 anos. Ações entram em `BACKLOG-SPRINT-*.md` da próxima sprint.

---

## 7. Seguro Cyber — avaliação contínua

- **Owner**: CFO + CISO.
- **Pesquisa de cobertura**: para clientes Tier-1 / Enterprise, cotação
  anual com no mínimo 3 seguradoras (AXA, Chubb, Tokio Marine, ou similar).
- **Mapeamento de exclusões**: cada apólice tem exclusões específicas
  (ex.: ato de guerra, dano reputacional, danos a 3º). Mapear em
  documento separado e validar junto ao Jurídico.
- **Cobertura mínima sugerida (a calibrar)**: R$ 5-10M para Enterprise;
  R$ 1-3M para Tier-1; opcional para SMB.
- **Tabletop como evidência**: muitas seguradoras descontam prêmio quando
  cliente comprova programa de simulação executiva ativo — relatórios
  servem como evidência.
- **Revisão**: anual (renovação) + após cada incidente Sev1/Sev2.

---

## 8. Cross-links

- SECURITY-INCIDENT-PLAYBOOK.md — playbook técnico operacional.
- THREAT-MODEL-INTEGRACAO.md — STRIDE/LINDDUN.
- ROPA-MODULO-INTEGRACAO.md — base de tratamentos para análise LGPD.
- DPIA-TEMPLATE.md — instrumento de análise.
- ON-CALL.md — escalação técnica.
- CHAOS-ENGINEERING-PLAN.md — game day técnico (complementar).
- SECRETS-MANAGEMENT.md — rotação emergencial.
