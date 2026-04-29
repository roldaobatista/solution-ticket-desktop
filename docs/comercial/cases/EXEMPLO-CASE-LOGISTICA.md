> ⚠️ **DISCLAIMER — CASO FICTÍCIO**: este documento é ilustrativo, baseado em padrões de mercado. **Cliente, números e quotes não são reais.** Não utilizar como prova de cliente real em RFPs, propostas comerciais ou material público sem substituir por dados de cliente verdadeiro com permissão escrita.

# Caso — Operadora Logística (Exemplo Anonimizado)

**Status**: Ilustrativo — baseado em padrões do segmento
**Permissão**: ✅ Versão anonimizada
**Versão**: 1.0 — 2026-04-26

---

## 1. Resumo executivo

> "Reduzimos o tempo de emissão de CT-e de 8 minutos para 30 segundos. Em pico, conseguimos despachar 3x mais caminhões/hora."
> — Gerente de Operações, Operadora Logística do Sul

| Métrica                           | Antes  | Depois |
| --------------------------------- | ------ | ------ |
| Pesagens/mês                      | 12.000 | 12.000 |
| Tempo emissão CT-e                | 8 min  | 30s    |
| Caminhões despachados/hora (pico) | 12     | 36     |
| Erros em CT-e                     | 4,8%   | 0,2%   |
| Cancelamentos por erro fiscal/mês | 28     | 1      |

---

## 2. Sobre o cliente

| Item         | Valor                                   |
| ------------ | --------------------------------------- |
| Setor        | Logística e transporte (cargas pesadas) |
| Porte        | Médio-grande                            |
| Faturamento  | ~R$ 450 milhões/ano                     |
| Funcionários | 320                                     |
| Localização  | Sul (4 terminais)                       |
| ERP          | TOTVS RM + módulo TMS Linx              |
| Frota        | 180 caminhões próprios + 600 agregados  |

---

## 3. O desafio

### Contexto

Operadora movimenta cargas a granel (grãos, fertilizantes, minério) entre clientes industriais. Cada caminhão pesado precisa virar:

- Confirmação de carga no TMS
- CT-e (Conhecimento de Transporte) emitido
- MDF-e (Manifesto) atualizado
- Vinculação ao contrato de frete
- Liberação de portaria

### Problemas

- **Operador digitava ticket no TMS + emitia CT-e via outro sistema**: 8 minutos por caminhão
- **Em pico**: fila de 30+ caminhões esperando portaria, motoristas reclamando
- **CT-e com erro**: 4.8% por digitação errada de peso/CNPJ → cancelamento + re-emissão
- **Auditoria de frete cooperado**: 4 dias/mês para reconciliar
- **Impacto financeiro**: caminhão parado em fila = R$ 1.200/h de "fantasma" (frete + tempo motorista)

---

## 4. A solução

### Arquitetura

- **Plano**: Enterprise
- **Conectores**: TOTVS RM + Linx TMS (via API genérica REST)
- **Terminais**: 4
- **Balanças**: 8
- **Volume**: 12.000 pesagens/mês
- **Webhook entrante**: SEFAZ via relay cloud para status de CT-e

### Implementação

- **Início**: 2026-Q1
- **Discovery**: 3 semanas
- **Implementação**: 4 semanas (TOTVS RM customizado + integração Linx)
- **Homologação**: 4 semanas (validar emissão CT-e em produção)
- **Modo Sombra**: 2 semanas
- **GA**: 13 semanas

### Customizações

- Mapping para tipos de carga (granel sólido vs líquido vs unitizado)
- Cálculo automático de valor de frete por tabela ANTT
- Vinculação automática a contratos de cooperado
- Emissão automática de CT-e via TMS após pesagem fechada
- Liberação de portaria via integração com cancela eletrônica

---

## 5. Resultados (após 60 dias)

### Operacionais

| KPI                       | Antes         | Depois  | Variação |
| ------------------------- | ------------- | ------- | -------- |
| Tempo despacho/caminhão   | 8 min         | 30s     | -94%     |
| Caminhões/hora (pico)     | 12            | 36      | +200%    |
| CT-e com erro             | 4,8%          | 0,2%    | -96%     |
| Cancelamentos fiscais/mês | 28            | 1       | -96%     |
| Tempo motorista em fila   | ~25 min médio | < 5 min | -80%     |
| Reclamações motorista     | 12/dia        | 0       | -100%    |
| Tempo auditoria frete     | 4 dias/mês    | 2h      | -98%     |

### Financeiros

- Custo de "caminhão fantasma" (parado): de R$ 144k/mês para R$ 18k/mês = -R$ 126k/mês
- Custo de re-emissão CT-e: de R$ 8k/mês para R$ 200/mês
- Faturamento adicional por throughput: estimado em R$ 2.4M/ano (mais caminhões/dia)

### ROI

- Investimento ano 1: R$ 110k
- Economia + faturamento adicional: R$ ~3.7M/ano
- Payback: < 30 dias
- ROI ano 1: 3300%

### Intangíveis

- Reputação com cooperados melhorou (menos espera = mais frete)
- SLA contratual com clientes industriais cumprido (90% das janelas de carregamento)
- Auditoria fiscal SEFAZ passou sem ressalva pela primeira vez

---

## 6. Depoimentos

> "Antes eu pegava chamado todo dia: 'meu caminhão está parado há 1h na portaria'. Hoje? Zero."
> — Gerente Operações

> "CT-e errado é problema fiscal sério. Tivemos multa de R$ 32k em 2024. Em 2026, zero."
> — Coordenador Fiscal

> "Cooperado liga querendo saber comprovante. Em 5 segundos respondo com QR code do CT-e."
> — Atendimento cooperados

---

## 7. Lições aprendidas

### O que funcionou

- **Integração TMS + ERP juntos**: pesagem dispara CT-e automaticamente
- **Webhook SEFAZ via relay**: status de CT-e em tempo real
- **Liberação portaria automatizada**: experiência motorista melhorou
- **Modo Sombra reduzido (2 semanas)**: confiança alta após H4

### Desafios

- **Linx TMS exigiu API genérica REST**: não tinha conector nativo
- **Tabela ANTT muda por região**: mapping ficou complexo
- **Cancela eletrônica de fabricante diferente em cada terminal**: integração caso a caso

### Recomendações para logísticas similares

- Integre pesagem + TMS + portaria para ganho de throughput máximo
- Use webhook SEFAZ desde o início (latência crítica)
- Negocie integração com fabricante de cancela junto

---

## 8. Próximos passos

- Q3: integrar agregados com app mobile (motoristas terceirizados)
- Q4: dashboard de SLA por cliente industrial
- 2027: piloto de pesagem dinâmica (em movimento) + ML

---

## 9. Permissões

- [x] Versão anonimizada
- [x] Números absolutos
- [x] Percentuais

---

**Disclaimer**: caso ilustrativo baseado em padrões do segmento.
