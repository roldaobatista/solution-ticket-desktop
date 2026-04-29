# ROPA — Registro de Operações de Tratamento — Módulo Integração ERP

> **Base legal:** LGPD art. 37 (Lei 13.709/2018) — obrigação do controlador
> e do operador de manter registro de operações de tratamento de dados
> pessoais.
> **Escopo:** todas as operações de tratamento que ocorrem dentro do módulo
> Integração ERP do Solution Ticket Desktop (Hub, Outbox, Conectores,
> Relay Cloud, API pública, Webhooks).
> **Owner:** DPO (Encarregado).
> **Atualização:** trimestral pelo DPO + sempre que novo conector ou novo
> subprocessador entrar em operação.
> **Cross-link:** DPIA-TEMPLATE.md, MATRIZ-RETENCAO-ESQUECIMENTO.md,
> POLITICA-PRIVACIDADE.md, DPA-CLOUDFLARE-DRAFT.md, THREAT-MODEL-INTEGRACAO.md
> (LINDDUN).

---

## 1. Identificação do Controlador e Operador

| Campo                       | Valor                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| Controlador                 | _Cliente final (cada empresa contratante) — razão social + CNPJ_ |
| Operador                    | Solution Ticket / Roldão Tecnologia ME — CNPJ _a preencher_      |
| Encarregado / DPO designado | _placeholder — designação formal pendente_                       |
| Contato DPO                 | `dpo@solution-ticket.com`                                        |
| Endereço                    | _placeholder — sede formal_                                      |
| Telefone DPO                | _placeholder_                                                    |

> **Pendência:** designação formal do DPO (pessoa física ou jurídica) é
> obrigatória antes de GA Tier-1 / Enterprise. Owner: Roldão.

---

## 2. Operações de tratamento

### 2.1 Operação 01 — Integração ticket → ERP

| Campo                       | Valor                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Finalidade                  | Transmissão de ticket de pesagem ao ERP do cliente para emissão de NF-e/CT-e                       |
| Base legal                  | art. 7º II (cumprimento de obrigação legal/regulatória — fiscal CONFAZ)                            |
| Categoria de dados          | CPF do motorista, nome, CNPJ do cliente/transportadora, placa, peso, produto, valor                |
| Categoria de titular        | Motorista, cliente PF/PJ, transportador                                                            |
| Subprocessadores            | ERP do cliente (SAP, TOTVS, Microsoft, Oracle, ContaAzul, Bling) — controlador é o próprio cliente |
| Transferência internacional | Possível (SAP Cloud Frankfurt, MS Azure) — depende do conector contratado pelo cliente             |
| Retenção                    | 90 dias na outbox local após confirmação ERP; 5 anos no audit log                                  |
| Medidas de segurança        | TLS 1.2+, OAuth, DPAPI, hash chain, mascaramento UI                                                |

### 2.2 Operação 02 — Sincronização com parceiros (cadastros)

| Campo                       | Valor                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Finalidade                  | Manter cadastros de clientes/produtos/motoristas alinhados entre Solution Ticket e ERP |
| Base legal                  | art. 7º V (execução de contrato)                                                       |
| Categoria de dados          | CPF/CNPJ, nome, endereço, e-mail, telefone                                             |
| Categoria de titular        | Cliente PF/PJ, motorista cadastrado                                                    |
| Subprocessadores            | ERP do cliente                                                                         |
| Transferência internacional | Conforme conector                                                                      |
| Retenção                    | Vigência do contrato + 5 anos (obrigação fiscal)                                       |
| Medidas de segurança        | Field-level encryption nos PII (roadmap), mascaramento UI default                      |

### 2.3 Operação 03 — Recepção de webhook do ERP

| Campo                       | Valor                                                                        |
| --------------------------- | ---------------------------------------------------------------------------- |
| Finalidade                  | Receber confirmação fiscal / status de NF-e / atualização de status da venda |
| Base legal                  | art. 7º II (obrigação legal) + V (execução de contrato)                      |
| Categoria de dados          | Chave NFe, número/série, status SEFAZ, valor total                           |
| Categoria de titular        | Cliente PF/PJ                                                                |
| Subprocessadores            | Cloudflare (relay cloud, ver DPA-CLOUDFLARE-DRAFT.md)                        |
| Transferência internacional | EUA / global (Cloudflare) — base art. 33 IX (cláusulas-padrão)               |
| Retenção                    | Relay 30 dias; cliente local 5 anos                                          |
| Medidas de segurança        | mTLS, HMAC, idempotência                                                     |

### 2.4 Operação 04 — Reconciliação fiscal

| Campo                       | Valor                                                                     |
| --------------------------- | ------------------------------------------------------------------------- |
| Finalidade                  | Conferir e reconciliar tickets contra NF-e emitida; detectar divergências |
| Base legal                  | art. 7º II (obrigação legal/regulatória)                                  |
| Categoria de dados          | Chave NFe, ticket, CPF, valor, peso                                       |
| Categoria de titular        | Motorista, cliente PF/PJ                                                  |
| Subprocessadores            | Nenhum (processamento local)                                              |
| Transferência internacional | Não                                                                       |
| Retenção                    | 5 anos (obrigação fiscal)                                                 |
| Medidas de segurança        | Hash chain, audit trail                                                   |

### 2.5 Operação 05 — Auditoria interna

| Campo                       | Valor                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| Finalidade                  | Trilha de auditoria para detecção de fraude interna e investigação forense |
| Base legal                  | art. 7º IX (legítimo interesse — prevenção fraude)                         |
| Categoria de dados          | Eventos de sistema (não inclui PII além de identificador de usuário)       |
| Categoria de titular        | Operador, supervisor, auditor da estação                                   |
| Subprocessadores            | AWS S3 Object Lock (export de prova fiscal — ADR-018)                      |
| Transferência internacional | EUA — base art. 33 IX (cláusulas-padrão)                                   |
| Retenção                    | 5 anos (Object Lock Compliance)                                            |
| Medidas de segurança        | Hash chain, sealed-time-witness, S3 Object Lock                            |

### 2.6 Operação 06 — Telemetria opt-in (qualidade do produto)

| Campo                       | Valor                                                       |
| --------------------------- | ----------------------------------------------------------- |
| Finalidade                  | Coleta de métricas anônimas para melhoria do produto        |
| Base legal                  | art. 7º I (consentimento)                                   |
| Categoria de dados          | Eventos de uso, performance, erros (sem PII)                |
| Categoria de titular        | Operador / usuário do app                                   |
| Subprocessadores            | _a definir — provedor de telemetria (PostHog, Plausible)_   |
| Transferência internacional | Conforme provedor                                           |
| Retenção                    | 12 meses                                                    |
| Medidas de segurança        | Anonimização na origem; opt-in explícito; opt-out revogável |

### 2.7 Operação 07 — Suporte (acesso a payload sob demanda)

| Campo                       | Valor                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Finalidade                  | Diagnóstico de incidente que exige inspeção de payload com PII                      |
| Base legal                  | art. 7º V (execução de contrato — suporte) + art. 11 II "a" se houver dado sensível |
| Categoria de dados          | CPF, placa, dados fiscais (sob justificativa)                                       |
| Categoria de titular        | Motorista, cliente                                                                  |
| Subprocessadores            | Nenhum (acesso técnico, não-replicável)                                             |
| Transferência internacional | Não                                                                                 |
| Retenção                    | Sessão de 30 min (PERMISSOES-INTEGRACAO.md §3); audit log do acesso por 5 anos      |
| Medidas de segurança        | Permissão `INTEGRACAO_VER_PAYLOAD_CRU` + dual control WebAuthn + log Sev2           |

### 2.8 Operação 08 — Marketing / CRM

| Campo                       | Valor                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| Finalidade                  | Comunicação de novidades, treinamento, ofertas — para usuários do produto (não-titulares finais) |
| Base legal                  | art. 7º I (consentimento)                                                                        |
| Categoria de dados          | E-mail e nome do usuário do produto (não inclui CPF de motorista)                                |
| Categoria de titular        | Usuário do app (cliente Solution Ticket)                                                         |
| Subprocessadores            | _a definir — provedor de e-mail marketing_                                                       |
| Transferência internacional | Conforme provedor                                                                                |
| Retenção                    | Até revogação do consentimento                                                                   |
| Medidas de segurança        | Opt-in explícito; opt-out em todo e-mail                                                         |

---

## 3. Subprocessadores consolidados

| Subprocessador                    | Função                 | DPA assinado?                      | Localização      |
| --------------------------------- | ---------------------- | ---------------------------------- | ---------------- |
| Cloudflare                        | Relay webhook          | Em draft (DPA-CLOUDFLARE-DRAFT.md) | Global           |
| AWS                               | S3 Object Lock (audit) | Pendente                           | EUA              |
| ERPs do cliente (SAP, TOTVS etc.) | Destinatários          | Cliente é controlador              | Conforme cliente |
| _Telemetria_                      | Métricas opt-in        | Pendente                           | _a definir_      |
| _E-mail marketing_                | Comunicação            | Pendente                           | _a definir_      |

---

## 4. Atualização e governança

- **Periodicidade**: revisão **trimestral** pelo DPO (1º dia útil de cada
  trimestre).
- **Trigger ad-hoc**: novo conector ERP, novo subprocessador, mudança de
  finalidade ou base legal, incidente Sev1/Sev2 com impacto privacidade.
- **Versionamento**: cada revisão gera novo commit com mensagem
  `ROPA: revisão YYYY-Qn` e tag de release `ropa-YYYY-Qn`.
- **Disponibilidade**: ROPA é entregável obrigatório em fiscalização ANPD
  (art. 37 §1º) — manter atualizado e em formato acessível (PDF + MD).

---

## 5. Cross-links

- DPIA-TEMPLATE.md — análise de impacto por conector.
- MATRIZ-RETENCAO-ESQUECIMENTO.md — prazos detalhados.
- POLITICA-PRIVACIDADE.md — comunicação ao titular.
- DPA-CLOUDFLARE-DRAFT.md — sub-processador relay.
- THREAT-MODEL-INTEGRACAO.md §3 (LINDDUN).
- SECRETS-MANAGEMENT.md — segurança operacional.
- ADR-018 — audit trail.
- LGPD art. 37, 38, 41 — registro, DPIA, encarregado.
