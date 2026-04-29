# Registro de Aceite Agentico — Conector ERP em Produção

**Cliente**: {Razão social}
**CNPJ**: {CNPJ}
**Conector ERP homologado**: {ERP / código}
**Versão do Solution Ticket**: {x.y.z}
**Versão do Conector**: {x.y.z}
**Data do registro**: {YYYY-MM-DD}
**Estado agentico**: ☐ TECH_READY ☐ PILOT_READY ☐ COMMERCIAL_GA_READY ☐ BLOCKED_EXTERNAL

> Este template substitui assinatura interna por pacote de evidências. Quando houver contrato, e-sign ou representante externo real, anexar como dependência externa; não usar assinatura humana como gate técnico.

---

## 1. Identificação das partes

### Contratante (Cliente)

- Razão social: {...}
- CNPJ: {...}
- Endereço: {...}
- Representante técnico: {nome / cargo / e-mail}
- Representante legal: {nome / cargo / e-mail}

### Contratada (Solution Ticket)

- Razão social: {Solution Ticket Sistemas LTDA}
- CNPJ: {...}
- Representante técnico: {nome / cargo}
- Account Manager: {nome / e-mail}

---

## 2. Escopo do aceite

Este registro consolida as evidências de homologação do seguinte conector ERP integrado ao Solution Ticket:

| Item                               | Detalhe                        |
| ---------------------------------- | ------------------------------ |
| ERP integrado                      | {nome + versão}                |
| Cliente do ERP                     | ☐ Cloud ☐ On-premise           |
| Unidades cobertas                  | {lista de unidades / balanças} |
| Entidades sincronizadas (ERP → ST) | {lista}                        |
| Eventos enviados (ST → ERP)        | {lista}                        |
| Volume médio mensal estimado       | {N pesagens/mês}               |

---

## 3. Validações realizadas

O `QA-Automation-Agent`, cliente real ou fixture operacional confirma a execução dos seguintes testes durante a homologação assistida/sombra (Fase H4):

- [ ] Configuração do perfil de integração via UI
- [ ] Teste de conexão com ambiente de produção do ERP
- [ ] Importação de cadastros (clientes, fornecedores, produtos)
- [ ] Edição de mapping pela UI sem assistência técnica
- [ ] Operação de pesagem real e envio ao ERP
- [ ] Cancelamento de ticket e reflexo correto no ERP
- [ ] Reprocessamento operacional auditado de evento com erro
- [ ] Reconciliação e relatório de divergência
- [ ] Treinamento da equipe operacional (mínimo 4h)
- [ ] **{N} pesagens reais processadas com 0 perda e 0 duplicidade**

---

## 4. Métricas de aceitação

| Métrica                      | Meta acordada | Resultado | Conforme? |
| ---------------------------- | ------------- | --------- | --------- |
| Disponibilidade do conector  | ≥ 99%         | {X%}      | ☐         |
| Tempo médio fechamento → ERP | < 5s          | {Xs}      | ☐         |
| Eventos perdidos             | 0             | {N}       | ☐         |
| Eventos duplicados           | 0             | {N}       | ☐         |
| Tempo de resposta do suporte | < 4h          | {médio}   | ☐         |

---

## 5. Documentação entregue

Cliente confirma o recebimento de:

- [ ] Manual de configuração do conector
- [ ] Runbook operacional (top 10 erros + solução)
- [ ] Vídeo de configuração
- [ ] Vídeo de troubleshooting
- [ ] Acesso ao portal de suporte
- [ ] Lista de contatos de suporte

---

## 6. Suporte e SLA

A partir de `COMMERCIAL_GA_READY`, vigora o SLA do plano contratado. Antes disso, este documento é apenas evidência técnica/comercial preliminar:

| Tier contratado | Resposta          | Resolução     | Disponibilidade |
| --------------- | ----------------- | ------------- | --------------- |
| ☐ Pro           | 4h business hours | best-effort   | best-effort     |
| ☐ Enterprise    | 30 min P0 / 1h P1 | 4h P0 / 8h P1 | 99.5%           |

Detalhes em `docs/comercial/PLANO-COMERCIAL.md` seção 8.

---

## 7. Responsabilidades

### Do Cliente

- Manter cadastros do ERP atualizados (clientes, produtos, etc.)
- Manter conectividade de internet adequada
- Comunicar mudanças de versão/customização do ERP com 30 dias de antecedência
- Treinar novos usuários conforme material entregue
- Renovar credenciais e certificados nos prazos
- Reportar incidentes via canais oficiais

### Da Contratada

- Manter conector funcional em sua versão atual
- Fornecer suporte conforme SLA contratado
- Atualizar conector em caso de mudança de API do ERP
- Comunicar mudanças relevantes com antecedência
- Garantir confidencialidade dos dados (LGPD)
- Preservar logs de auditoria por 5 anos

---

## 8. Limitações conhecidas

O Cliente declara conhecer e aceitar as seguintes limitações documentadas:

- {limitação 1, ex: "Bling tem rate limit de 3 req/s — em pico de safra, eventos podem aguardar até 5 minutos"}
- {limitação 2}
- {limitação 3}

---

## 9. Plano de continuidade

Em caso de indisponibilidade do conector:

- Pesagem **continua funcionando** localmente sem interrupção
- Eventos ficam em fila local até reestabelecimento
- Nenhum dado é perdido

Em caso de indisponibilidade do ERP do cliente:

- Eventos aguardam em fila por até 30 dias
- Cliente pode optar por exportar manualmente em CSV nesse período

---

## 10. Cláusula de rollback

Caso, nos primeiros 30 dias após este aceite, ocorra incidente P0 não resolvido em 24h, o Cliente pode solicitar:

- Retorno ao processo anterior sem cobrança adicional
- Reembolso proporcional do setup fee
- Re-homologação a custo zero

---

## 11. Confidencialidade

Dados técnicos e comerciais trocados durante a homologação devem seguir NDA/contrato externo, quando existir, ou permanecer classificados como confidenciais no evidence pack.

---

## 12. Decisão agentic

Com base nas evidências anexas, o `Agent-Orchestrator` classifica o conector como:

- [ ] `TECH_READY`
- [ ] `PILOT_READY`
- [ ] `COMMERCIAL_GA_READY`
- [ ] `BLOCKED_EVIDENCE`
- [ ] `BLOCKED_EXTERNAL`

---

**Data**: {YYYY-MM-DD}

---

### Evidências

| Fonte                  | Artefato                 | Hash/ID | Status |
| ---------------------- | ------------------------ | ------- | ------ |
| Agent-Orchestrator     | decision record          |         |        |
| QA-Automation-Agent    | relatório H1-H5          |         |        |
| SRE-Agent              | SLO/rollback             |         |        |
| Security-Agent         | SAST/DAST/secrets        |         |        |
| LGPD-Legal-Agent       | DPIA/ROPA/riscos         |         |        |
| Fonte externa opcional | e-sign/contrato/feedback |         |        |

---

## Anexos

- A1. Relatório de Homologação completo (`docs/integracao/relatorios-homologacao/{erp}-{data}.md`)
- A2. Mapping YAML versionado
- A3. Lista de testes executados em H4 com evidências
- A4. NDA/contrato externo, se houver
