# Checklist — Preenchimento dos Documentos Legais

**Status**: AÇÃO REQUERIDA antes de qualquer envio comercial
**Tempo estimado**: 1 semana
**Responsável agentico**: `LGPD-Legal-Agent` + `ContractLegalAgent`

> 🔴 Documentos legais (`POLITICA-PRIVACIDADE.md`, `TERMOS-USO.md`, `../integracao/templates/termo-aceite-cliente.md`) têm placeholders críticos. Agentes podem validar placeholders, consistência e gerar minuta/evidence pack. Revisão jurídica/assinatura externa, se necessária, fica `BLOCKED_EXTERNAL` e não bloqueia engenharia técnica.

---

## 🚨 GATE TÉCNICO — build de produção rejeita EULA com placeholders

**Build de produção do Solution Ticket rejeita qualquer EULA/Termos/Política que ainda contenha o marcador `{a preencher}` ou `{a definir}`.** A verificação é executada no pipeline de release (Sprint 0 / `RELEASE.md`) e bloqueia geração do instalador NSIS quando placeholders sobrevivem em arquivos de `docs/legal/`.

Implementação detalhada em `RELEASE.md` (Sprint 0). Owners: time de release + DPO.

---

## 🚫 Pendências externas — bloqueadoras de `COMMERCIAL_GA_READY` (ato externo, não programável)

Os itens abaixo **NÃO podem ser resolvidos por código**. Eles bloqueiam liberação comercial, mas não impedem `TECH_READY`/`PILOT_READY` quando o evidence pack técnico estiver completo:

| #   | Pendência                                                               | Ato externo necessário                                                                         | Bloqueia                                                                       |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | **Razão social + CNPJ + endereço + IE**                                 | Constituição/regularização da PJ Solution Ticket Sistemas LTDA na Receita Federal e prefeitura | Emissão de NF, contrato comercial, qualquer cobrança formal                    |
| 2   | **DPO designado** (nome, currículo LGPD, carta de designação assinada)  | Contratação ou designação interna + emissão da carta                                           | Operação LGPD-compliant; ANPD pode multar até 2% do faturamento (LGPD art. 41) |
| 3   | **DPA Cloudflare assinada** (modelo padrão + adendos LGPD)              | Solicitação formal em clauses.cloudflare.com + assinatura                                      | Ativação do relay cloud com PII real (atualmente: polling-only por default)    |
| 4   | **Revisão jurídica externa** de TERMOS-USO.md + POLITICA-PRIVACIDADE.md | Contratação de advogado SaaS B2B + LGPD; devolutiva e ajustes                                  | Remoção do disclaimer "rascunho técnico" e publicação `1.0 PUBLICADA`          |

**Status atual**: 4/4 pendentes. Todos bloqueiam `COMMERCIAL_GA_READY`; nenhum bloqueia chassi técnico com mocks/fixtures.

---

## ✅ Aceites externos confirmados em 2026-04-27 (Rodada 5 de auditoria)

A redação contratual abaixo foi **estruturada e incorporada aos documentos** nesta data. **Valores e formulações específicas permanecem sujeitos a revisão jurídica externa** antes da publicação `1.0 PUBLICADA`.

| Cláusula                                                                                                 | Estrutura                         | Status                                       |
| -------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------- |
| **Multa simétrica §10.1.1** (3 mensalidades + reembolso pro rata setup + 90d migração)                   | TERMOS-USO.md §10.1.1             | ✅ escrita; valor sujeito a revisão jurídica |
| **Cap LGPD §8.3** (cap variável tier-based + sem cap em multa ANPD efetiva)                              | TERMOS-USO.md §8.3 + §8.3.1       | ✅ estrutura                                 |
| **Alçada CAM-CCBC §16.3** (foro judicial < R$ 100k para preservar proporcionalidade de custas)           | TERMOS-USO.md §16.3               | ✅                                           |
| **Change-of-control §17.1.1** (opt-out de 60 dias se aquisição por concorrente do Cliente)               | TERMOS-USO.md §17.1 + §17.1.1     | ✅                                           |
| **Não-aliciamento §18** (12 meses pós-rescisão; multa de 3 salários do funcionário aliciado)             | TERMOS-USO.md §18                 | ✅                                           |
| **Right to audit §11.4** (questionário anual + sumário pentest + lista subprocessadores; in loco 1×/ano) | TERMOS-USO.md §11.4               | ✅                                           |
| **Customizações §3.3.1** (mappings do Cliente, código ST do ST, híbridos com licença perpétua)           | TERMOS-USO.md §3.3.1              | ✅                                           |
| **Saída §10.3** (export CSV+JSON, 30d, escopo completo, backup estendido R$ 297/mês)                     | TERMOS-USO.md §10.3               | ✅                                           |
| **Revisão automática ME/EPP §1.1.1** (cap e multa a 50%, foro CDC quando aplicável)                      | TERMOS-USO.md §1.1.1              | ✅                                           |
| **Versionamento subprocessadores §5.3** (changelog público + 30d notificação)                            | POLITICA-PRIVACIDADE.md §5.3      | ✅                                           |
| **Gate comercial relay cloud §5.2 / §9** (polling-only default até DPA Cloudflare)                       | POLITICA-PRIVACIDADE.md §5.2 + §9 | ✅                                           |
| **Rascunho DPA Cloudflare** (escopo, retenção edge, sub-processadores, incidentes 24h)                   | DPA-CLOUDFLARE-DRAFT.md           | ✅ rascunho                                  |

---

## 1. Dados da empresa (preencher imediatamente)

| Item                  | Onde aparece                            | Status                                         |
| --------------------- | --------------------------------------- | ---------------------------------------------- |
| Razão social completa | TERMOS §1, POLITICA §1                  | ☐ Definir nome formal LTDA                     |
| CNPJ                  | TERMOS §1, POLITICA §1, termo-aceite §1 | ☐ Cadastrar CNPJ ou usar PF temporariamente    |
| Endereço fiscal       | TERMOS §1, POLITICA §1                  | ☐ Definir                                      |
| Inscrição municipal   | termo-aceite §1                         | ☐ Definir                                      |
| E-mail institucional  | múltiplos                               | ☐ Configurar (ex: contato@solution-ticket.com) |
| Telefone              | múltiplos                               | ☐ Definir                                      |
| Site oficial          | múltiplos                               | ☐ Reservar domínio + lançar landing page       |

---

## 2. DPO / Encarregado LGPD (preencher antes de qualquer captação)

| Item                                        | Status                                              |
| ------------------------------------------- | --------------------------------------------------- |
| Nome do DPO                                 | ☐ Designar (pode ser o próprio Roldão inicialmente) |
| E-mail dedicado (`dpo@solution-ticket.com`) | ☐ Criar                                             |
| Telefone para contato                       | ☐ Definir                                           |
| Currículo do DPO (LGPD exige formação)      | ☐ Documentar                                        |
| Carta de designação assinada                | ☐ Emitir                                            |

⚠️ **LGPD art. 41**: tratamento sem encarregado nomeado configura infração. ANPD pode multar até **2% do faturamento** (mín R$ 50/máx R$ 50M).

---

## 3. Foro e arbitragem (TERMOS §16)

| Item                  | Opções recomendadas                   | Status                |
| --------------------- | ------------------------------------- | --------------------- |
| Comarca de eleição    | Cidade onde está registrada a empresa | ☐ Definir             |
| Câmara arbitral       | CAM-CCBC (SP), CAMARB (BH), CAM-FIESP | ☐ Escolher            |
| Regulamento da câmara | Padrão da câmara escolhida            | ☐ Aceitar formalmente |

⚠️ Sem câmara nomeada, cláusula compromissória é **inexequível** (Lei 9.307/96 art. 4º).

---

## 4. Subprocessadores e DPA (POLITICA §5, §9)

| Item                             | Status                                                 |
| -------------------------------- | ------------------------------------------------------ |
| DPA Cloudflare assinada          | ☐ Solicitar formalmente (clauses.cloudflare.com)       |
| URL pública de subprocessadores  | ☐ Criar `solution-ticket.com/subprocessors`            |
| DPA com processador de pagamento | ☐ Quando definir gateway (Stripe/Pagar.me/MercadoPago) |
| Backup provider                  | ☐ Definir (AWS S3 BR / Backblaze) + DPA                |

---

## 5. Garantias e SLA (TERMOS §9, §12)

| Item                                               | Decisão pendente                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| Hierarquia 60 dias setup vs 90 dias garantia geral | ☐ Definir qual prevalece (recomendado: 60d para conector, 90d para resto) |
| Cap mensal de crédito SLA                          | ☐ Definir % máximo (recomendado 100% mensalidade)                         |
| Procedimento de pleito SLA                         | ☐ Documentar prazo, forma, prova                                          |
| "Manutenção programada" definição contratual       | ☐ Criar cláusula                                                          |

---

## 6. Multas e rescisão (TERMOS §10)

| Item                                        | Recomendação auditoria                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Multa Enterprise rescisão antecipada        | Mudar de "30% saldo" para `min(30% saldo; 6 mensalidades)` com redução proporcional |
| Reciprocidade — ST rescinde sem justa causa | Adicionar cláusula simétrica                                                        |
| Multa < 50% cumprido (50%)                  | Rever sob CDC (se ME/EPP for cliente)                                               |

---

## 7. Marketplace (TERMOS §13, SDK §11)

| Item                                         | Status               |
| -------------------------------------------- | -------------------- |
| Contrato-tipo de parceiro Marketplace        | ☐ Redigir (advogado) |
| Cláusula back-to-back de responsabilidade    | ☐ Incluir            |
| Indenidade por violação de IP do parceiro    | ☐ Incluir            |
| Termos do parceiro vs Termos ST (hierarquia) | ☐ Definir            |

---

## 8. Propriedade intelectual

Decisões pendentes (TERMOS §3.3):

| Item                                   | Recomendação                                                      |
| -------------------------------------- | ----------------------------------------------------------------- |
| Customizações pagas pelo cliente       | Cliente é dono do mapping; código de extensão ST permanece com ST |
| Dados derivados/agregados anonimizados | ST tem licença de uso para melhoria — incluir cláusula            |
| Feedback do cliente                    | ST tem licença gratuita perpétua — incluir                        |

---

## 9. Cláusulas adicionais sugeridas pela auditoria

| Cláusula                                                              | Onde adicionar          |
| --------------------------------------------------------------------- | ----------------------- |
| Rotulagem B2B explícita ("não consumidor CDC")                        | TERMOS §1 nova subseção |
| Bases legais faltantes (prevenção fraude, processo, representante PJ) | POLITICA §3 tabela      |
| Marketing direto B2B = legítimo interesse (não consentimento)         | POLITICA §3             |
| Trade secrets perpetuamente confidenciais                             | TERMOS §11              |
| Whistleblowing como exceção à confidencialidade                       | TERMOS §11              |
| Transferência de dados em M&A — anuência prévia                       | TERMOS §17.1            |

---

## 10. LIA (Legitimate Interest Assessment)

LGPD exige **análise formal documentada** quando usar legítimo interesse como base:

| Tratamento           | LIA pendente                             |
| -------------------- | ---------------------------------------- |
| Logs operacionais    | ☐ Documentar balanceamento (POLITICA §3) |
| Marketing direto B2B | ☐ Documentar                             |
| Analytics agregado   | ☐ Documentar                             |

---

## 11. Validação final antes de uso

- [ ] Todos os placeholders `{a definir}` substituídos
- [ ] Advogado especializado revisou (LGPD + B2B SaaS + PI)
- [ ] DPA Cloudflare anexada
- [ ] Contrato-tipo Marketplace redigido
- [ ] Versão `1.0 PUBLICADA` substitui `1.0 RASCUNHO`
- [ ] Disclaimer "rascunho" removido dos arquivos
- [ ] Versão final publicada em `solution-ticket.com/legal/`
- [ ] Cliente Pro recebe link no momento do checkout
- [ ] Cliente Enterprise assina contrato físico ou via DocuSign

---

## Custo estimado de revisão jurídica externa

| Serviço                                  | Faixa                            |
| ---------------------------------------- | -------------------------------- |
| Revisão geral (advogado SaaS B2B sênior) | R$ 8.000–R$ 18.000               |
| LGPD compliance + LIA + DPA              | R$ 6.000–R$ 12.000               |
| Contrato Marketplace                     | R$ 5.000–R$ 10.000               |
| Total recomendado                        | **R$ 19.000–R$ 40.000 one-time** |

ROI: 1 contrato Enterprise fechado paga 5x esse custo.

---

## Cronograma sugerido (1 semana)

| Dia      | Ação                                            |
| -------- | ----------------------------------------------- |
| Seg      | Roldão preenche dados da empresa + designa DPO  |
| Ter      | Contratação de advogado + envio dos rascunhos   |
| Qua      | DPA Cloudflare + escolha câmara arbitral        |
| Qui      | Revisão jurídica em curso                       |
| Sex      | Devolutiva do advogado + ajustes                |
| Próx Seg | Publicação em `/legal/` + remoção do "rascunho" |

---

## Status

- Última atualização: 2026-04-26
- Próxima revisão: após assinatura do primeiro contrato Enterprise
- Owner: Roldão
