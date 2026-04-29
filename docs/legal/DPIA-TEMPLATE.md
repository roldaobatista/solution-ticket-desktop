# DPIA — Relatório de Impacto à Proteção de Dados Pessoais

> **Base legal:** LGPD art. 38 (Lei 13.709/2018).
> **Aplicação:** uma DPIA por conector ERP integrado ao Solution Ticket.
> **Owner agentico:** `LGPD-Legal-Agent`.
> **Gate (DoD):** DPIA preenchida, ROPA/matriz de retenção revisadas e riscos residuais registrados são critério para `TECH_READY`/`PILOT_READY`. Assinatura/representação legal externa, quando exigida, é `BLOCKED_EXTERNAL` para `COMMERCIAL_GA_READY`.

---

## 1. Identificação do tratamento

| Campo                        | Valor                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| Conector                     | _ex.: SAP S/4HANA Cloud_                                          |
| Versão da integração         | _ex.: 1.0.0_                                                      |
| Cliente / Controlador        | _Razão social, CNPJ_                                              |
| Operador                     | Solution Ticket (Roldão Tecnologia)                               |
| Data de início do tratamento | _AAAA-MM-DD_                                                      |
| DPIA aplicável a             | [ ] Implantação inicial [ ] Mudança relevante [ ] Renovação anual |
| Data desta DPIA              | _AAAA-MM-DD_                                                      |

---

## 2. Dados pessoais envolvidos

| Categoria              | Dado                                             | Origem              | Finalidade               |
| ---------------------- | ------------------------------------------------ | ------------------- | ------------------------ |
| Identificação          | CPF do motorista                                 | Captura na portaria | Emissão de ticket fiscal |
| Identificação          | Nome do motorista                                | Captura na portaria | Identificação no ticket  |
| Identificação veicular | Placa                                            | OCR/manual          | Histórico de pesagens    |
| Empresa                | CNPJ cliente/transportadora                      | Cadastro            | Faturamento              |
| Contato                | Telefone/email                                   | Cadastro            | Notificação de ticket    |
| Sensível?              | _Não há tratamento de dados sensíveis previstos_ | —                   | —                        |

> **Atenção:** se o conector previr CNH, biometria ou geolocalização — DPIA reforçada com parecer jurídico é obrigatória.

---

## 3. Finalidade × Base legal

| Finalidade                                | Base legal LGPD                                          | Justificativa                    |
| ----------------------------------------- | -------------------------------------------------------- | -------------------------------- |
| Emissão de NF-e/CT-e a partir do ticket   | art. 7º, II (cumprimento de obrigação legal/regulatória) | Obrigação fiscal (CONFAZ)        |
| Conciliação financeira no ERP             | art. 7º, V (execução de contrato)                        | Contrato de prestação de serviço |
| Histórico de pesagens (auditoria interna) | art. 7º, IX (legítimo interesse)                         | Prevenção de fraude              |
| Marketing/comunicação                     | art. 7º, I (consentimento)                               | _Não aplicável neste módulo_     |

---

## 4. Transferência internacional

| Campo                  | Valor                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| Há transferência?      | [ ] Sim [ ] Não                                                                 |
| Países envolvidos      | _ex.: EUA (SAP Cloud Frankfurt → São Paulo replicação)_                         |
| Mecanismo              | [ ] Cláusulas-padrão [ ] Decisão de adequação ANPD [ ] Consentimento específico |
| DPA externo resolvido? | [ ] Sim — anexar [ ] Não — marcar `BLOCKED_EXTERNAL` para `COMMERCIAL_GA_READY` |

---

## 5. Tempo de retenção

| Tipo de dado             | Onde            | Prazo                        | Base               |
| ------------------------ | --------------- | ---------------------------- | ------------------ |
| Payload com CPF (outbox) | Estação cliente | 90 dias após confirmação ERP | MATRIZ-RETENCAO §3 |
| Audit log                | Estação cliente | 5 anos                       | Obrigação fiscal   |
| Logs de webhook          | Relay cloud     | 30 dias                      | Operacional        |
| Backup completo          | Cliente         | 12 meses                     | Recuperação fiscal |

---

## 6. Medidas técnicas e organizacionais

- Criptografia em trânsito (TLS 1.2+) e em repouso (DPAPI no cofre, field-level nos PII do outbox).
- Mascaramento default de CPF na UI (permissão `INTEGRACAO_VER_PAYLOAD_CRU` separada).
- RBAC por matriz §12.2.
- Audit log com hash chain (ADR-018).
- Rotação de credenciais ≤90d.
- Treinamento anual da equipe.
- Política de offboarding em ≤24h.

---

## 7. Riscos identificados

| #   | Risco                               | Probabilidade | Impacto | Sev   |
| --- | ----------------------------------- | ------------- | ------- | ----- |
| 1   | Vazamento de payload com CPF        | Baixa         | Alto    | Médio |
| 2   | Acesso indevido por operador        | Média         | Médio   | Médio |
| 3   | Retenção além do prazo LGPD         | Média         | Alto    | Alto  |
| 4   | Transferência internacional sem DPA | Baixa         | Alto    | Alto  |

---

## 8. Medidas mitigadoras

| Risco # | Medida                                          | Owner     | Prazo  |
| ------- | ----------------------------------------------- | --------- | ------ |
| 1       | Field-level encryption nos campos PII do outbox | Tech Lead | _data_ |
| 2       | RBAC com permissão específica + log obrigatório | Tech Lead | _data_ |
| 3       | Job de purge automático com auditoria           | Tech Lead | _data_ |
| 4       | DPA com sub-processador antes de GA             | DPO       | _data_ |

---

## 8.1. Direitos do titular operacionalizados

LGPD art. 18-22 garante aos titulares 9 direitos: confirmação,
acesso, correção, anonimização/bloqueio/eliminação, portabilidade,
informação sobre compartilhamento, informação sobre não-consentir,
revogação de consentimento, oposição. **Operacionalização obrigatória:**

### Canal de atendimento

- **E-mail dedicado**: `dpo@solution-ticket.com` (auto-resposta com
  protocolo + prazo).
- **Portal do titular** (roadmap pós-MVP): formulário web com
  autenticação (token enviado por e-mail/SMS); registra solicitação em
  fila para o DPO.
- **SLA**: resposta em **≤7 dias úteis** (mais restritivo que ANPD —
  norma orientativa permite 15 dias, mas adotamos 7 para reduzir risco).

### Fluxo de atendimento (5 etapas)

1. **Recebimento** — solicitação via canal entra em fila com protocolo
   único; auto-resposta confirma recebimento + prazo.
2. **Classificação** — DPO classifica em uma das categorias:
   - Acesso (cópia dos dados tratados)
   - Correção (dado incorreto)
   - Exclusão / anonimização
   - Portabilidade (export estruturado, ex.: JSON)
   - Oposição ao tratamento
   - Informação sobre compartilhamento (lista de subprocessadores)
   - Revogação de consentimento (quando base legal é consentimento)
3. **Execução** — área responsável (Tech Lead em geral, ou
   Comercial/Suporte conforme caso) executa a ação dentro do SLA;
   evidência registrada em audit log do módulo + ticket interno
   referenciando protocolo.
4. **Resposta ao titular** — DPO responde formalmente com confirmação +
   detalhamento da ação tomada; em caso de negativa (ex.: dado
   necessário para obrigação legal ou contrato), justificativa por
   escrito com base legal LGPD.
5. **Registro** — solicitação + resposta + evidência ficam em
   `docs/legal/solicitacoes-titular/<protocolo>/` por 5 anos
   (atendimento a fiscalização ANPD).

### Direitos especiais

- **Exclusão**: confirmar que dado fiscal já transmitido a ERP/SEFAZ
  **não pode ser apagado** (obrigação fiscal art. 7º II); explicar ao
  titular e oferecer anonimização nos campos não-fiscais.
- **Portabilidade**: gerar export JSON estruturado contendo apenas dados
  daquele titular (CPF, placa, histórico de pesagens) — automatizar
  query parametrizada, **não** entregar dump completo do banco.
- **Revogação de consentimento**: aplicável apenas a tratamentos com
  base no consentimento (não bloqueia tratamentos com outras bases —
  obrigação legal, execução de contrato, etc.).

### Métricas

- Volume mensal de solicitações por categoria.
- SLA compliance (% atendidas em ≤7 dias úteis).
- Tempo médio por categoria.

Reportar mensalmente ao CISO + trimestralmente em Comitê de Privacidade.

---

## 9. Parecer agentico LGPD

```
Data: ____/____/______
Parecer: [ ] Favorável  [ ] Favorável com ressalvas  [ ] Desfavorável
Ressalvas / Condicionantes:
_________________________________________________________________
_________________________________________________________________

Agente: LGPD-Legal-Agent
Evidence pack: _________________________________
Dependências externas: [ ] Não  [ ] Sim — listar em EXTERNAL-DEPENDENCIES.md
```

---

## 10. Instruções de preenchimento

1. **Quando preencher:** ao iniciar projeto de integração com novo ERP, antes do início do desenvolvimento (gate de Sprint 0).
2. **Quem preenche:** `LGPD-Legal-Agent`, com insumos do `ERP-Specialist-Agent` e `Security-Agent`.
3. **Fechamento:** parecer agentico é suficiente para `TECH_READY`/`PILOT_READY`; assinatura externa, se exigida, fica marcada como dependência para `COMMERCIAL_GA_READY`.
4. **Revisão:** anual ou em mudança relevante (novo dado tratado, novo país, novo sub-processador).
5. **Armazenamento:** em `docs/legal/dpia/<conector>/<aaaa-mm-dd>.md` com versionamento Git.
6. **Cliente solicita?** entregar cópia em PDF — não enviar arquivo cru contendo CPF de produção.

---

## 11. Cross-links

- POLITICA-PRIVACIDADE.md
- DPA-CLOUDFLARE-DRAFT.md (sub-processador relay)
- THREAT-MODEL-INTEGRACAO.md §3 (LINDDUN)
- MATRIZ-RETENCAO
- CHECKLIST-PREENCHIMENTO-LEGAL.md
