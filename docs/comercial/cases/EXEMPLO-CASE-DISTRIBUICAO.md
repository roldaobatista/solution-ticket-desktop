> ⚠️ **DISCLAIMER — CASO FICTÍCIO**: este documento é ilustrativo, baseado em padrões de mercado. **Cliente, números e quotes não são reais.** Não utilizar como prova de cliente real em RFPs, propostas comerciais ou material público sem substituir por dados de cliente verdadeiro com permissão escrita.

# Caso — Distribuidora de Combustíveis (Exemplo Anonimizado)

**Status**: Ilustrativo — baseado em padrões do segmento
**Permissão**: ✅ Versão anonimizada
**Versão**: 1.0 — 2026-04-26

---

## 1. Resumo executivo

> "Migramos de planilha + ERP cloud para integração automática. Eliminamos 3% de divergência mensal e cortamos custo de TI em R$ 12k/mês."
> — CFO, Distribuidora Regional de Combustíveis

| Métrica                       | Antes      | Depois |
| ----------------------------- | ---------- | ------ |
| Pesagens/mês                  | 4.500      | 4.500  |
| Tempo lançamento manual       | 3h/dia     | 0      |
| Divergência fiscal            | 3,1%       | 0,2%   |
| Conciliação financeira mensal | 4 dias     | 6h     |
| Custo de TI ad-hoc            | R$ 12k/mês | R$ 0   |

---

## 2. Sobre o cliente

| Item         | Valor                                                   |
| ------------ | ------------------------------------------------------- |
| Setor        | Distribuição de combustíveis (diesel, etanol, gasolina) |
| Porte        | Médio                                                   |
| Faturamento  | ~R$ 280 milhões/ano                                     |
| Funcionários | 95                                                      |
| Localização  | Centro-Oeste                                            |
| ERP          | SAP Business One                                        |
| Volume       | 4.500 pesagens/mês (carga e descarga)                   |

---

## 3. O desafio

### Contexto

Distribuidora opera 1 base com 2 balanças (entrada e saída). Cada movimento precisa virar:

- Lançamento no SAP B1 (faturamento + estoque)
- Documento auxiliar (DA-ICMS)
- Vinculação a pedido de venda
- Conciliação financeira (combustível tem regime especial de tributação)

### Problemas

- **Operador digitava ticket no SAP B1 manualmente**: 3h/dia
- **Divergência de 3.1%**: combustível tem alta sensibilidade fiscal — qualquer erro vira multa
- **Conciliação financeira tomava 4 dias/mês**: planilha cruzando 4.500 pesagens × notas SAP
- **TI ad-hoc para "consertar"**: R$ 12k/mês com consultor externo
- **CFO sem visão real-time** de margem por carga

---

## 4. A solução

### Arquitetura

- **Plano**: Pro
- **Conector**: SAP B1 (via API REST)
- **Balanças**: 2
- **Volume**: 4.500 pesagens/mês
- **API pública aberta**: para BI próprio do cliente consumir

### Implementação

- **Início**: 2026-Q1
- **Discovery**: 1 semana
- **Implementação**: 2 semanas (SAP B1 mais simples que S/4)
- **Homologação**: 2 semanas
- **Modo Sombra**: 1 semana
- **GA**: 6 semanas total — **mais rápido que outros segmentos**

### Customizações

- Mapping para tributação combustível (CST 60/70 conforme produto)
- Vinculação automática a contrato de cliente posto
- Cálculo de margem em real-time consumido pelo BI do cliente
- Alerta de divergência > 0,5% (combustível tem evaporação esperada)

---

## 5. Resultados (após 90 dias)

### Operacionais

| KPI                             | Antes      | Depois        |
| ------------------------------- | ---------- | ------------- |
| Tempo digitação                 | 3h/dia     | 0             |
| Divergência                     | 3,1%       | 0,2%          |
| Conciliação mensal              | 4 dias     | 6h            |
| Multas fiscais (12m projetados) | R$ 18k/ano | R$ 0          |
| Visão real-time margem          | Não        | Sim (via API) |

### Financeiros

- Folha (1 operador realocado): -R$ 4.500/mês
- TI ad-hoc consultoria: -R$ 12.000/mês
- Multas fiscais: -R$ 1.500/mês
- **Total economia**: R$ 18.000/mês

### ROI

- Investimento ano 1: R$ 19.300 (setup R$ 1.500 + Pro × 12 + 1 conector)
- Economia anual: R$ 216.000
- Payback: ~33 dias
- ROI ano 1: 1019%

### Intangíveis

- CFO consome dashboard real-time pelo celular
- Compliance fiscal saiu de "preocupação semanal" para "automatizada"
- Operador realocado para função analítica

---

## 6. Depoimentos

> "Combustível é negócio de margem. 3% de divergência come metade do meu lucro. Solution Ticket me devolveu margem."
> — CFO

> "Eu digitava ticket o dia inteiro. Hoje analiso vendas por região. Subi de função."
> — Ex-operador, hoje analista

---

## 7. Lições aprendidas

### O que funcionou

- **API pública para BI**: cliente consome dados sem reinventar
- **Setup rápido (6 semanas)**: SAP B1 muito mais simples que S/4
- **Conector PME (Pro)** suficiente: não precisou de Enterprise

### Desafios

- **Tributação combustível complexa**: mapping de CST exigiu Discovery cuidadoso
- **Variação por estado**: cliente atende 2 estados, precisou de mapping condicional
- **Evaporação esperada**: alertas precisaram tolerância configurável

### Recomendações para distribuidoras

- Para SAP B1, esperar 6 semanas (não 12)
- Use API pública para alimentar BI próprio
- Configure tolerância de evaporação corretamente (combustível tem perda física natural)

---

## 8. Próximos passos

- Q3: adicionar 2 bases regionais (mesma arquitetura)
- Q4: integração com B2B do cliente (postos finais consultam comprovante)
- 2027: ML para detectar padrões de evaporação anormal (possível desvio)

---

## 9. Permissões

- [x] Versão anonimizada
- [x] Números absolutos
- [x] Percentuais

---

**Disclaimer**: caso ilustrativo baseado em padrões reais.
