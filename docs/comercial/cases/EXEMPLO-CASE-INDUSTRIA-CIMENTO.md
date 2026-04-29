> ⚠️ **DISCLAIMER — CASO FICTÍCIO**: este documento é ilustrativo, baseado em padrões de mercado. **Cliente, números e quotes não são reais.** Não utilizar como prova de cliente real em RFPs, propostas comerciais ou material público sem substituir por dados de cliente verdadeiro com permissão escrita.

# Caso — Indústria de Cimento (Exemplo Anonimizado)

**Status**: Ilustrativo — baseado em padrões do segmento
**Permissão**: ✅ Versão anonimizada
**Versão**: 1.0 — 2026-04-26

---

## 1. Resumo executivo

> "Migramos de uma integração custom que custou R$ 380k e quebrou após 8 meses. Em 60 dias com Solution Ticket, voltamos ao normal — sem custo de manutenção contínuo."
> — Diretor de TI, Indústria Cimenteira do Sudeste

| Métrica                            | Antes (custom quebrado) | Depois (ST Enterprise) |
| ---------------------------------- | ----------------------- | ---------------------- |
| Pesagens/mês                       | 18.000                  | 18.000                 |
| Disponibilidade integração         | 65%                     | 99.7%                  |
| Tempo de digitação manual (backup) | 6h/dia                  | 0                      |
| Custo de manutenção                | R$ 8.500/mês            | Incluso                |
| Tickets perdidos/mês               | 12 (média)              | 0                      |

---

## 2. Sobre o cliente

| Item         | Valor                                        |
| ------------ | -------------------------------------------- |
| Setor        | Indústria — fabricação de cimento e clínquer |
| Porte        | Grande (multi-planta)                        |
| Faturamento  | ~R$ 1.2 bilhões/ano                          |
| Funcionários | 800                                          |
| Localização  | Sudeste (3 plantas)                          |
| ERP          | SAP S/4HANA (migração recente do ECC)        |

---

## 3. O desafio

### Contexto

Indústria opera **3 plantas** com 6 balanças rodoviárias. Cada caminhão saindo carregado precisa virar:

- Movimento de saída no SAP (BAPI_GOODSMVT_CREATE)
- Vinculação à ordem de venda (VBAK)
- Contribuição para apuração de IPI/ICMS
- Atualização de estoque contábil

### Problemas

- **Custom quebrou após upgrade SAP**: integração desenvolvida em 2024 (R$ 380k) parou de funcionar quando cliente migrou ECC → S/4HANA em 2025
- **Equipe interna não conseguiu refazer**: dev original havia saído; substituto levaria 6 meses para entender
- **Operação paralisada**: 6 semanas com operadores digitando manual no SAP — 6h/dia de equipe dedicada
- **12 pesagens perdidas/mês**: por erro humano na digitação
- **Auditoria fiscal urgente**: divergência entre quantidades pesadas e lançadas SAP

---

## 4. A solução

### Arquitetura

- **Plano**: Enterprise
- **Conector**: SAP S/4HANA
- **Plantas**: 3
- **Balanças**: 6
- **Volume**: 18.000 pesagens/mês
- **SLA contratual**: 99.5% + suporte 24/7

### Implementação

- **Início**: dia X (assinatura)
- **Discovery**: 4 semanas (Communication Arrangement + Event Mesh + mapping por planta)
- **Implementação**: 4 semanas (mapping customizado para vertical cimento)
- **Homologação**: 4 semanas (H1–H4 nas 3 plantas)
- **Modo Sombra**: 4 semanas
- **GA**: 16 semanas após início

### Customizações

- Mapping específico para 8 SKUs de cimento (CP-II, CP-III, CP-V, etc.)
- Vinculação automática a Ordens de Venda SAP
- Integração com Event Mesh para liberação de pedido em tempo real
- Templates separados por planta (cada planta tem regras de TS/TES diferentes)

---

## 5. Resultados (após 90 dias em produção)

### Operacionais

| KPI                             | Antes              | Depois | Variação |
| ------------------------------- | ------------------ | ------ | -------- |
| Pesagens perdidas/mês           | 12                 | 0      | -100%    |
| Digitação manual                | 6h/dia × 3 plantas | 0      | -100%    |
| Disponibilidade                 | 65%                | 99.7%  | +34pp    |
| Latência médio fechamento → SAP | 30 min (digitação) | 4s     | -99%     |
| Multas fiscais (12m projetados) | R$ 45k/ano         | R$ 0   | -100%    |
| Auditoria mensal                | 5 dias             | 4h     | -97%     |

### ROI

- Investimento ano 1: R$ 230k (setup R$ 25k + onboarding R$ 100k + mensalidade × 12)
- Economia anual: R$ ~580k (folha + retrabalho + multas + balança parada)
- Payback: ~5 meses
- ROI ano 1: 152%

### Intangíveis

- Relacionamento com SAP partner do cliente: agora colaborativo (vs adversarial quando havia custom)
- Equipe interna liberou 1.5 FTE para outros projetos
- Confiança em scaling para futura 4ª planta

---

## 6. Depoimentos

> "Quando a integração quebrou, achamos que voltaríamos para Excel por 6 meses. Solution Ticket virou em 4 meses, com auditoria fiscal melhor que tínhamos antes."
> — Diretor de TI

> "Para mim, mudou: antes minha rotina era 'verificar se SAP recebeu'. Agora é 'pesar e seguir vida'."
> — Operador balança Planta SP

> "Pela primeira vez em 18 meses, tive zero divergência fiscal no fechamento mensal. Receita Federal pode chegar quando quiser."
> — Diretor Financeiro

---

## 7. Lições aprendidas

### O que funcionou

- **Discovery profundo (4 semanas)**: pareceu muito, mas evitou retrabalho
- **Migração coordenada com SAP partner do cliente**: comunicação técnica direta
- **Modo Sombra de 4 semanas**: confiança para virar
- **Event Mesh para pedidos em tempo real**: latência caiu drasticamente

### Desafios

- **Mapping diferente por planta**: tomou 2 semanas a mais que esperado
- **Communication Arrangement complexa**: exigiu basis SAP do cliente
- **Aceite formal SAP partner**: 3 semanas de revisão técnica

### Recomendações para indústrias similares

- Garanta comprometimento do basis SAP do cliente desde Discovery
- Modo Sombra 4 semanas (não 2) para operação multi-planta
- Tenha consultor SAP do lado do cliente disponível durante GA
- Use Event Mesh — vale o esforço para latência < 5s

---

## 8. Próximos passos

- Q3: integrar 4ª planta (greenfield)
- Q4: avaliar conector adicional para Microsoft Dynamics 365 (subsidiária recente)
- 2027: case público com vídeo testemunhal

---

## 9. Permissões

- [x] Versão anonimizada
- [x] Números absolutos
- [x] Percentuais

---

**Disclaimer**: caso ilustrativo baseado em padrões reais do segmento.
