# Compromissos Comerciais — Matriz de Promessas a Clientes

**Versão**: 1.0 — 2026-04-27
**Origem**: Auditoria R5 Agente 6 — "RACI não cobre comercial/vendas (cliente piloto sem dono)"
**Owners agenticos**: `CommitmentsAgent` + `CommercialOpsAgent`
**Cadência**: revisão semanal automatizada a partir de CRM/e-sign/webhooks

---

## Por que existe

Comercial fechou contratos sem alinhar com Engenharia o **prazo realista** de cada conector. Resultado: cliente promete-se um ERP que ainda nem entrou em Discovery, criando dívida de credibilidade.

Esta matriz garante que **toda promessa feita a cliente esteja amarrada a um Sprint planejado** e tenha owner técnico nomeado.

---

## 1. Matriz de promessas ativas

| Lead/Prospect             | ERP prometido | Prazo prometido (cliente) | Sprint que entrega  | Owner técnico | Status        | Última revisão |
| ------------------------- | ------------- | ------------------------- | ------------------- | ------------- | ------------- | -------------- |
| _(exemplo)_ Agro XYZ Ltda | Bling         | 2026-09 (mês 5)           | Sprint 9 (GA Bling) | Eng Lead      | Em assinatura | 2026-04-27     |
| _(template)_ —            | —             | —                         | —                   | —             | —             | —              |

**Como popular**: `CommercialOpsAgent` adiciona linha ao receber evento de CRM/e-sign/contrato. `CommitmentsAgent` valida em ≤24h contra tabela ERP × fase; se violar a policy, gera proposta com cláusula de escopo futuro ou marca renegociação.

---

## 2. Tabela ERP × Fase (regra de promessa)

> **Regra dura**: proposta **não promete** ERP antes da fase indicada. Promessa em estágio anterior é bloqueada automaticamente ou reescrita como escopo futuro condicionado.

| ERP                                                 | Onda | Fase   | Sprint earliest GA | Mês earliest |
| --------------------------------------------------- | ---- | ------ | ------------------ | ------------ |
| Mock / REST genérico / CSV / SFTP                   | 0    | Fase 0 | Sprint 5           | mês 3        |
| Bling **ou** Sankhya (1 dos 2)                      | 1    | Fase 1 | Sprint 9           | mês 5        |
| Bling **e** Sankhya (ambos)                         | 1    | Fase 1 | Sprint 11          | mês 6        |
| Omie                                                | 1    | Fase 1 | Sprint 13          | mês 7        |
| ContaAzul                                           | 1    | Fase 1 | Sprint 13          | mês 7        |
| Tiny                                                | 1    | Fase 1 | Sprint 14          | mês 7        |
| TOTVS Protheus                                      | 2    | Fase 2 | Sprint 17          | mês 9        |
| Senior                                              | 2    | Fase 2 | Sprint 17          | mês 9        |
| TOTVS RM                                            | 2    | Fase 2 | Sprint 19          | mês 10       |
| TOTVS Datasul                                       | 2    | Fase 2 | Sprint 19          | mês 10       |
| SAP S/4HANA                                         | 3    | Fase 3 | Sprint 23          | mês 12       |
| Dynamics 365 F&O                                    | 3    | Fase 3 | Sprint 24          | mês 12       |
| NetSuite                                            | 3    | Fase 3 | Sprint 26          | mês 13       |
| Oracle Fusion                                       | 3    | Fase 3 | Sprint 27          | mês 14       |
| Long tail (Infor, Epicor, IFS, Mega, CIGAM, Benner) | 4    | Fase 4 | sob demanda        | mês 15+      |

**Observação Sankhya/Bling**: a decisão de qual sai primeiro acontece no Sprint 0. Promessa antes disso usa fórmula "Bling ou Sankhya — definição até [data]".

---

## 3. Processo

### 3.1 Novo deal (proposta → contrato)

1. **Estágio Proposta**: vendedor consulta tabela §2 e usa linguagem "ERP-X previsto Onda Y, mês Z".
2. **Estágio Negociação**: se cliente exige data fixa, `CommitmentsAgent` valida automaticamente contra capacidade e fase.
3. **Estágio Assinatura/e-sign**: webhook adiciona linha na matriz §1.
4. **Confirmação técnica**: `CommitmentsAgent` revisa em ≤24h. Se Sprint planejado bater com prazo prometido → confirma. Senão → aciona renegociação ou alocação de buffer.

### 3.2 Review semanal

- **Quando**: terça-feira 10h, 30 min
- **Quem**: `CommitmentsAgent` + `CommercialOpsAgent`
- **Pauta**:
  1. Linhas novas adicionadas na semana
  2. Linhas em risco (sprint atrasado, escopo cortado)
  3. Renegociações em curso
  4. Promessas próximas do vencimento (próximas 4 semanas)
- **Output**: decisões registradas; "Última revisão" da linha atualizada.

### 3.3 Promessa que vai falhar

> Quando PM identifica que prazo prometido **não vai bater** (sprint atrasou, escopo virou Should/Could na regra de corte automático).

Procedimento:

1. PM avisa Comercial com mínimo 4 semanas de antecedência.
2. Comercial entra em contato com cliente: oferece (a) extensão do prazo + crédito, (b) troca de ERP equivalente já entregue, (c) cancelamento sem multa.
3. Decisão registrada em ata; linha da matriz atualizada com novo prazo ou status "renegociado".

---

## 4. Penalidades de overcommit

Para evitar repetição do problema:

- **Vendedor que prometer ERP antes da fase sem aprovação**: prêmio do deal reduzido em 50%.
- **3 promessas furadas no trimestre pela mesma origem**: `CommitmentsAgent` bloqueia promessa de ERP fora da policy em todo deal seguinte.
- **PM que aprovar promessa irrealista**: registrado em retrospectiva; reincidência → revisão de critérios.

---

## 5. Métricas de saúde

| Métrica                                             | Meta  | Frequência |
| --------------------------------------------------- | ----- | ---------- |
| % deals com linha na matriz na assinatura           | 100%  | Mensal     |
| % promessas cumpridas no prazo original             | ≥ 90% | Trimestral |
| Lead time médio entre assinatura e adição na matriz | ≤ 24h | Mensal     |
| Promessas renegociadas / promessas totais           | ≤ 10% | Trimestral |

---

## 6. Histórico de versões

- **v1.0 — 2026-04-27** — Versão inicial. Cria matriz vazia + tabela ERP×Fase + processo.
