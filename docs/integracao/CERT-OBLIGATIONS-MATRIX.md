# Certification Obligations Matrix — Partner Programs ERP

> **Escopo:** obrigações contínuas em programas de partner para conectores ERP do Solution Ticket.
> **Owner:** Tech Lead + DPO.
> **Revisão:** trimestral (Q-end).
> **Cross-link:** ADR-020 (supply chain), CERTIFICACOES-ERP-CHECKLIST.md (entrada inicial).

---

## 1. Matriz mestre

| ERP                           | Programa Partner                    | Custo recorrente                  | Obrigações contínuas                                                                                                                      | Renovação | Owner ações     |
| ----------------------------- | ----------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------- |
| **SAP S/4HANA**               | SAP PartnerEdge — Build             | USD 2.000-3.000/ano               | Pentest externo anual, SLA reporting trimestral, security patches em ≤30 dias após CVE crítica, SBOM atualizado, code signing obrigatório | Anual     | Tech Lead       |
| **TOTVS Protheus / RM**       | TOTVS Partner Solutions             | R$ ~6.000/ano                     | Renovação anual + treinamento técnico (1 dev/ano), revisão de código pela TOTVS antes de cada release major, conformidade LGPD declarada  | Anual     | Tech Lead + DPO |
| **Microsoft Dynamics 365 BC** | Microsoft AppSource (ISV)           | Variável (commit transactability) | Revisão técnica anual da Microsoft, evidência GDPR/SOC2 quando atende cliente Enterprise, suporte a Azure AD, telemetria opt-in           | Anual     | Tech Lead       |
| **Oracle NetSuite**           | Oracle SuiteCloud Developer Network | USD 1.000-2.000/ano               | Security review anual, restrições de UX (SuiteApp brand guidelines), uso obrigatório SuiteScript 2.x, rate limit compliance               | Anual     | Tech Lead       |
| **ContaAzul**                 | ContaAzul Apps                      | Gratuito ou taxa baixa            | Revisão simples (formulário), conformidade LGPD, suporte ao usuário em PT-BR                                                              | Anual     | Tech Lead       |
| **Bling**                     | Bling Apps                          | Gratuito                          | Revisão simples, rate limit por API key, política de privacidade pública                                                                  | Anual     | Tech Lead       |

---

## 2. Obrigações transversais (todos os programas)

| Obrigação                                  | Frequência  | Evidência                                     | Responsável |
| ------------------------------------------ | ----------- | --------------------------------------------- | ----------- |
| Política de privacidade pública atualizada | Contínuo    | URL pública                                   | DPO         |
| Termo de uso público atualizado            | Contínuo    | URL pública                                   | DPO         |
| LGPD compliance                            | Contínuo    | DPIA por conector + DPA com sub-processadores | DPO         |
| Patches de CVE crítico                     | ≤30 dias    | Release notes + SBOM                          | Tech Lead   |
| Suporte ao cliente em PT-BR                | Contínuo    | Canal `suporte@` ativo                        | Suporte     |
| Status page / comunicado de incidente      | Contínuo    | URL pública (a criar)                         | Tech Lead   |
| Code signing válido                        | Contínuo    | Cert OV/EV em vigor                           | Tech Lead   |
| SBOM disponível por release                | Por release | `sbom.json` no GitHub Releases                | CI          |

---

## 3. Calendário de renovação

| Mês      | ERP / Item                                                         | Responsável |
| -------- | ------------------------------------------------------------------ | ----------- |
| Janeiro  | SAP PartnerEdge — fee anual + SLA report Q4                        | Tech Lead   |
| Março    | Pentest externo anual (cobre SAP + TOTVS)                          | Tech Lead   |
| Abril    | TOTVS Partner — renovação + treinamento                            | Tech Lead   |
| Junho    | Microsoft AppSource — review anual                                 | Tech Lead   |
| Setembro | Oracle SuiteCloud — security review                                | Tech Lead   |
| Outubro  | Code signing certificate — renovar (alerta 60d antes da expiração) | Tech Lead   |
| Novembro | ContaAzul + Bling — renovação leve                                 | Tech Lead   |
| Dezembro | Revisão LGPD anual de DPIAs                                        | DPO         |

> Todos os itens acima entram no calendário compartilhado da equipe; alerta automatizado 60 dias antes do vencimento.

---

## 4. Gates de release por conector

Antes de cada release **major** de um conector específico:

1. Confirmar conformidade com obrigações da tabela §1 do ERP correspondente.
2. SBOM gerado e SCA verde (ADR-020).
3. DPIA do conector revisada se houve mudança em dados tratados.
4. Threat model atualizado (`THREAT-MODEL-INTEGRACAO.md`) se nova superfície.
5. Pentest externo válido (≤12 meses) para SAP/TOTVS.

**Sem todos os gates verdes → release bloqueado.**

---

## 5. Off-boarding de programa

Quando descontinuamos um conector:

- Notificar partner program em ≤30 dias.
- Revogar credenciais (SECRETS-MANAGEMENT.md).
- Comunicar clientes ativos com 90 dias de aviso.
- Manter audit log do conector pelo prazo de retenção (5 anos fiscal).

---

## 6. Cross-links

- ADR-020 — supply chain (SBOM/code signing).
- CERTIFICACOES-ERP-CHECKLIST.md — checklist de entrada.
- DPIA-TEMPLATE.md — gate LGPD.
- SECRETS-MANAGEMENT.md — chaves de partner.
- THREAT-MODEL-INTEGRACAO.md.
