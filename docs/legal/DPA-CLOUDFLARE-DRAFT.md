# DPA Cloudflare — Rascunho de Escopo (Solution Ticket)

**Versão**: rascunho 0.1 — 2026-04-27
**Status**: 🚧 **RASCUNHO TÉCNICO** — usar como base para DPA real assinada com Cloudflare Brasil/EUA
**Owner**: DPO Solution Ticket + jurídico contratado
**Bloqueia**: ativação do relay cloud com PII real (atualmente: polling-only por default)

> ⚠️ Este documento NÃO substitui a DPA oficial assinada com a Cloudflare, Inc. e/ou Cloudflare Brasil Serviços Online LTDA. Serve como **base interna** para negociar adendos LGPD ao modelo padrão DPA da Cloudflare, disponível em `clauses.cloudflare.com`.

---

## 1. Partes

- **Controlador (Solution Ticket)**: Solution Ticket Sistemas LTDA — CNPJ {a preencher}, endereço {a preencher}
- **Operador (Cloudflare)**: Cloudflare, Inc. (matriz EUA) e Cloudflare Brasil Serviços Online LTDA (filial BR), conforme aplicável à entidade contratante
- **Sub-operadores (sub-processadores Cloudflare)**: lista oficial em `cloudflare.com/subprocessors`, atualizada pela Cloudflare

## 2. Objeto

Tratamento de dados pessoais pela Cloudflare na qualidade de **operador (LGPD art. 5º, VII / GDPR art. 28)** para fins exclusivos da prestação de serviços contratados pelo Solution Ticket: **relay HTTPS de eventos webhook** vindos de ERPs cloud (Bling, Omie, ContaAzul, SAP S/4HANA Cloud, Microsoft Dynamics) destinados ao agent local instalado no Cliente final.

## 3. Natureza e finalidade do tratamento

- **Natureza**: trânsito e armazenamento temporário (queue) de eventos HTTPS em edge global Cloudflare, com retransmissão ao agent local mediante autenticação
- **Finalidade**: garantir entrega resiliente de notificações ERP → agent local mesmo quando o agent estiver offline temporariamente
- **Decisão de tratar**: do **Solution Ticket** (controlador frente à Cloudflare); o Cliente final do Solution Ticket figura como **co-controlador** na cadeia mais ampla, nos termos da Política de Privacidade

## 4. Categorias de dados pessoais tratados

- **CPF e CNPJ** de parceiros (clientes finais, fornecedores, transportadoras) presentes em payloads de pedidos/notas
- **Nome** de pessoa física (motoristas, contatos PJ)
- **E-mail** corporativo de contato
- **Identificadores fiscais e operacionais**: número de NF-e, CT-e, placa de veículo, dados de pesagem
- **Não tratados intencionalmente**: dados sensíveis LGPD art. 5º, II (saúde, biometria, origem racial etc.)

## 5. Categorias de titulares

- Pessoas físicas e representantes de pessoas jurídicas envolvidas em transações comerciais dos Clientes finais do Solution Ticket
- Motoristas e operadores logísticos identificados em documentos fiscais

## 6. Retenção edge

- **TTL máximo no edge Cloudflare**: **30 dias** (limite contratual com a Cloudflare)
- **TTL operacional default**: **7 dias para Pro** / **30 dias para Enterprise**
- Após consumo pelo agent local: evento é **marcado para purga** e removido em até 24h
- **Sem retenção arquivística no edge** — backup persistente é responsabilidade do agent local + backend Solution Ticket

## 7. Sub-processadores Cloudflare relevantes

Cloudflare opera infraestrutura própria; sub-processadores limitados (referência `cloudflare.com/subprocessors`):

| Categoria                                  | Região                  | Finalidade                |
| ------------------------------------------ | ----------------------- | ------------------------- |
| Datacenter operations (próprio Cloudflare) | EUA, UE, BR (edge POPs) | Operação da rede edge     |
| DDoS scrubbing                             | Global                  | Mitigação de ataques      |
| Suporte tier 2/3                           | EUA, UE                 | Atendimento de incidentes |

Solution Ticket compromete-se a refletir alterações materiais da lista oficial Cloudflare em `solution-ticket.com/subprocessors` em até **30 dias**, com notificação ao Cliente conforme §5.3 da Política de Privacidade.

## 8. Localização e transferência internacional

- Edge global Cloudflare; **roteamento preferencial Brasil** quando disponível
- Configuração regional **Brasil/UE-only** disponível para Cliente Enterprise mediante solicitação formal
- **Base legal de transferência LGPD**: art. 33, II (cláusulas contratuais específicas) + art. 33, IX (execução de contrato)
- Para Clientes EU: **Standard Contractual Clauses (SCC) 2021/914** anexadas à DPA

## 9. Direitos do controlador

Solution Ticket pode, a qualquer tempo, exigir da Cloudflare:

- (a) Auditoria documental anual (questionário SOC 2 / ISO 27001 fornecidos pela Cloudflare)
- (b) Relatório de incidentes que afetem dados do Solution Ticket
- (c) Eliminação ou devolução dos dados ao término do contrato
- (d) Restrição/interrupção do tratamento mediante solicitação fundamentada
- (e) Cooperação no atendimento a requisições de titulares (LGPD art. 18)

## 10. Notificação de incidentes

- **Cloudflare → Solution Ticket**: até **24 (vinte e quatro) horas** da descoberta do incidente
- **Conteúdo mínimo**: natureza, categoria de dados e titulares afetados (estimativa), medidas de contenção e mitigação
- **Solution Ticket → Cliente afetado**: até 48h conforme Política de Privacidade §11
- **Solution Ticket → ANPD**: até 72h quando aplicável (LGPD art. 48)

## 11. Segurança

Cloudflare mantém certificações vigentes: **SOC 2 Type II, ISO 27001, ISO 27018, PCI-DSS Service Provider, FedRAMP Moderate** (referência atualizada em `cloudflare.com/trust-hub/`).

Medidas técnicas mínimas exigidas:

- TLS 1.3 em trânsito
- Criptografia em repouso (AES-256)
- Controle de acesso baseado em função (RBAC) + MFA obrigatório
- Logs de acesso administrativo retidos por no mínimo 1 ano

## 12. Término

- Ao término do contrato Solution Ticket ↔ Cloudflare: **purga completa** dos dados em edge em até 30 dias
- Cloudflare fornece **certificado de eliminação** mediante solicitação formal
- Logs operacionais (sem PII) podem ser retidos por até 12 meses para fins de auditoria de segurança da própria Cloudflare

## 13. Foro

- **Versão Brasil**: foro da Comarca de São Paulo - SP, com aplicação subsidiária do GDPR para Clientes EU
- **Versão EUA**: jurisdição conforme DPA padrão Cloudflare (Delaware), com aplicação extraterritorial LGPD para titulares brasileiros

---

## Próximos passos para formalização

1. Solicitar **DPA padrão Cloudflare** em `clauses.cloudflare.com` (formulário oficial)
2. Submeter este rascunho ao **advogado contratado** para análise de adequação LGPD
3. Negociar **adendos brasileiros** específicos: notificação 24h, purga edge ≤ 30 dias, foro SP-BR
4. Assinatura digital pela diretoria Solution Ticket após designação formal do **DPO**
5. Publicação em `solution-ticket.com/dpa` (versão pública sem dados confidenciais comerciais)
6. **Liberação do gate comercial**: relay cloud passa a operar com PII real após assinatura confirmada

---

**🚧 RASCUNHO — não vincula juridicamente até assinatura da DPA oficial com a Cloudflare**
