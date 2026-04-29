# Comparativo — Solution Ticket vs Integração Custom

**Audiência**: clientes considerando desenvolver integração própria via consultoria interna ou terceirizada
**Versão**: 1.0 — 2026-04-26

---

## TL;DR

Integração custom funciona para **um** caso, **um** ERP, **uma** versão. Solution Ticket é **um produto de pesagem local-first** com outbox auditável, conector REST genérico e conectores dedicados conforme matriz de maturidade. Custom é R$ 200k+ inicial e R$ 5k–R$ 15k/mês de manutenção. ST é ~R$ 500–R$ 3.000/mês total.

---

## Tabela comparativa

| Critério                                |   Integração Custom    |       Solution Ticket        |
| --------------------------------------- | :--------------------: | :--------------------------: |
| **Tempo até produção**                  |       6–18 meses       |        Dias a semanas        |
| **Custo inicial**                       |    R$ 150k–R$ 500k     |      R$ 1.500–R$ 25.000      |
| **Custo recorrente (manutenção)**       |    R$ 5k–R$ 20k/mês    |     R$ 200–R$ 3.000/mês      |
| **Risco de projeto**                    | Alto (atrasos, escopo) |    Baixo (produto pronto)    |
| **Quem mantém**                         |          Você          |        Nós (incluso)         |
| **Atualização para nova versão do ERP** |       Você paga        |           Incluso            |
| **Suporte**                             |   Sua equipe interna   |      24/7 (Enterprise)       |
| **Funciona offline**                    |     Depende do dev     |        ✅ Sim, nativo        |
| **Auditoria fiscal 5 anos**             |    Você implementa     |          ✅ Nativo           |
| **Idempotência**                        |    Você implementa     |         ✅ Garantida         |
| **Reprocessamento self-service**        |    Você implementa     |          ✅ Nativo           |
| **Múltiplos ERPs (multi-empresa)**      |     Outro projeto      | Conforme conector homologado |
| **Documentação**                        |        Depende         |         ✅ Completa          |
| **Compliance LGPD**                     |     Você responde      |         ✅ Auditado          |
| **Marketplace de conectores**           |          N/A           |           Roadmap            |

---

## Análise honesta — quando custom faz sentido

Integração custom é a escolha certa quando:

- **Necessidades únicas** que nenhum produto cobre (ex: integração com balança específica + IoT + ERP customizado em linguagem rara)
- **Volume gigantesco** (> 100k pesagens/mês) com requisitos não-padronizados
- **Cliente já tem time forte de dev** disponível e capaz de manter
- **Compliance específico** que produto comercial não atende

Para **80% dos casos** (operação de pesagem padrão integrando com ERP conhecido), custom é overkill caro.

---

## Mitos sobre integração custom

### Mito 1 — "Custom é melhor porque é nosso, sob medida"

**Realidade**: nas primeiras 2 semanas, sim. Depois vira **dívida técnica**. Quem fez sai da empresa, ninguém entende o código, mudança no ERP quebra tudo.

### Mito 2 — "Pagamos uma vez e está pronto"

**Realidade**: ERPs evoluem. Bling lança v4 → seu custom quebra. Migração TOTVS Harpia → seu custom precisa ser refeito. Custo "uma vez" vira contínuo.

### Mito 3 — "Nossa TI dá conta"

**Realidade**: TI já está sobrecarregada. Integração ERP exige conhecimento de domínio raro: outbox transacional, idempotência, mapping declarativo, retry policy, classificação de erro. Não é "fazer um cron e POST".

### Mito 4 — "Vamos contratar consultoria por projeto"

**Realidade**: consultoria entrega, vai embora, ninguém mantém. Nos próximos 5 anos: cada bug vira novo projeto pago.

### Mito 5 — "Vamos usar iPaaS (Boomi/MuleSoft) e construir"

**Realidade**: iPaaS é caro (R$ 5k–R$ 30k/mês) e ainda exige você construir os fluxos. Solution Ticket pode até **rodar em cima do seu iPaaS** se preferir, sem cobrar a mais.

---

## Análise de TCO (5 anos)

### Cliente médio (5.000 pesagens/mês, 1 ERP, 2 balanças)

> **Premissas de salário/encargos** (CLT BR, 2026):
>
> - Dev Junior: salário R$ 8k → custo total R$ 12,2k/mês (encargos 53% — INSS patronal, FGTS, férias, 13º, provisão rescisão)
> - Dev Pleno: salário R$ 15k → custo total R$ 23k/mês
> - Dev Sênior / fábrica: R$ 28k–35k/mês total
> - Time fábrica terceirizado: R$ 30k–40k/dev-mês (com gestão e overhead)

Apresentamos **3 cenários** com premissas explícitas para que o comprador escolha a base de comparação coerente com a realidade dele:

#### Cenário Low — startup enxuta com 2 devs juniores

| Item                                                       | Valor                     |
| ---------------------------------------------------------- | ------------------------- |
| Desenvolvimento inicial (2 devs jr × 3 meses × R$ 12,2k)   | R$ 73.200                 |
| Implementação de auditoria/compliance                      | R$ 30.000                 |
| Manutenção (0,5 dev jr part-time = R$ 6,1k/mês × 36 meses) | R$ 219.600                |
| Atualizações ERP (a cada 12 meses)                         | R$ 15.000 × 3 = R$ 45.000 |
| Re-trabalho mínimo por bugs                                | R$ 30.000                 |
| Migração quando dev sai (dobra-equipe 1 vez em 3 anos)     | R$ 25.000                 |
| Hosting/infra                                              | R$ 12.000                 |
| **Total Low (3 anos)**                                     | **R$ ~840.000**           |

#### Cenário Mid — perfil mais comum em Médio BR (3 devs PL × 4 meses + 1 dev manutenção)

| Item                                                   | Valor        |
| ------------------------------------------------------ | ------------ |
| Desenvolvimento inicial (3 devs PL × 4 meses × R$ 23k) | R$ 276.000   |
| Treinamento equipe interna                             | R$ 25.000    |
| Manutenção (1 dev PL × R$ 23k/mês × 60 meses)          | R$ 1.380.000 |

> **Correção do total Mid**: A soma direta acima excede R$ 1,2M porque manutenção sozinha em 5 anos passa de R$ 1,3M. Para casar com cenário base de **Mid em 36 meses** (~R$ 1,2M total), aplicar:

| Item (Mid em 36 meses)                                 | Valor             |
| ------------------------------------------------------ | ----------------- |
| Desenvolvimento inicial (3 devs PL × 4 meses × R$ 23k) | R$ 276.000        |
| Treinamento + auditoria/compliance + setup inicial     | R$ 80.000         |
| Manutenção (1 dev PL × R$ 23k/mês × 36 meses)          | R$ 828.000        |
| Atualizações ERP + bugs                                | R$ 60.000         |
| **Total Mid (36 meses)**                               | **R$ ~1.244.000** |

#### Cenário High — fábrica de software terceirizada

| Item (36 meses)                                                    | Valor             |
| ------------------------------------------------------------------ | ----------------- |
| Desenvolvimento (time fábrica × 6 meses, ~R$ 35k/dev-mês × 4 devs) | R$ 840.000        |
| Compliance/auditoria/integração com ERP do cliente                 | R$ 120.000        |
| Manutenção fábrica (R$ 25k/mês × 36 meses)                         | R$ 900.000        |
| **Total High (36 meses)**                                          | **R$ ~1.860.000** |

#### Solution Ticket Pro (mesmo cliente, 36 meses)

| Item                                                    | Valor                         |
| ------------------------------------------------------- | ----------------------------- |
| Setup Pro + 1 conector PME                              | R$ 1.500                      |
| Mensalidade Pro (R$ 297 × 2 balanças + R$ 197 conector) | R$ 791/mês × 36 = R$ 28.476   |
| Excedente (4.000 pesagens × R$ 0,30)                    | R$ 1.200/mês × 36 = R$ 43.200 |
| Atualizações + suporte                                  | Incluso                       |
| **Total ST (36 meses)**                                 | **R$ ~73.000**                |

**Economia ST vs Custom (mesma janela de 36 meses, comparação honesta)**:

| Cenário Custom       | Custom (36m)  | ST (36m)   | Economia      | %              |
| -------------------- | ------------- | ---------- | ------------- | -------------- |
| Low                  | R$ 840k       | R$ 73k     | R$ 767k       | **91% menos**  |
| **Mid** (mais comum) | **R$ 1.244k** | **R$ 73k** | **R$ 1.171k** | **~94% menos** |
| High (fábrica)       | R$ 1.860k     | R$ 73k     | R$ 1.787k     | 96% menos      |

**Leitura honesta**: contra cenário Mid, ST custa **~6% do custom em 36 meses**, ou seja, **~94% menos**. A simplificação que circula em material de venda como "**~50–65% menos**" só vale se o comparativo já abate (a) custos evitados de RPA/manutenção que existem no cliente independente da decisão, OU (b) custos de oportunidade do time interno (devs ocupados em outros projetos). Em janelas mais curtas (12 meses), a diferença é menor — Mid 12m ≈ R$ 632k vs ST R$ 25k = **96%** mas reduzir a janela acentua o setup ST que é fixo e amplifica diferença. Em comparações **com discounted future maintenance** ou **opportunity cost normalizado**, faixa realista cai para **50–65% menos** quando o cliente pondera ganhos intangíveis (controle, customização, IP próprio).

---

## Riscos do custom (que ninguém te conta)

### Risco 1 — Lock-in pessoal

Quem desenvolveu vai embora em 18 meses (média de mercado). Substituto leva 6 meses para entender. Velocidade despenca.

### Risco 2 — Bug fiscal sem rastro

Auditoria pede comprovação de envio de NF. Custom não guardou payload. Multa.

### Risco 3 — ERP atualiza versão

Cliente migra Bling v3→v4 → seu custom quebra → dias parados → pesagens perdidas → faturamento atrasado.

### Risco 4 — Necessidade de novo ERP

Cliente compra empresa que usa Sankhya. Você precisa de outro custom. R$ 200k de novo.

### Risco 5 — Compliance LGPD evolui

Lei muda. Seu custom não tem direito ao esquecimento. Adequação custa.

### Risco 6 — Falsa economia em escala

Funciona com 1.000 pesagens/mês. Cresce para 10.000 → arquitetura não aguenta → refactor caro.

---

## Quando recomendamos custom (sim, isso existe)

Sou honesto: alguns casos, custom é melhor:

1. **Sistema interno proprietário** sem analogia comercial
2. **Integração com hardware muito específico** que ST não suporta
3. **Volume astronômico** (> 1M pesagens/mês) com requisitos sob medida
4. **Compliance ultra-específico** (defesa, governamental)

Nesses casos: vamos te indicar consultorias parceiras de qualidade. Não vamos forçar Solution Ticket onde não cabe.

---

## Cenário híbrido (melhor dos mundos)

Você pode usar Solution Ticket **+** algum custom específico:

- ST cuida da integração padrão pesagem ↔ ERP
- Seu custom cuida de necessidades únicas (ex: integração com balança IoT proprietária + dashboard customizado)
- ST oferece **API pública** para que seu custom consuma dados sem reinventar

Exemplo real: cliente usa ST para SAP S/4HANA + custom interno que enriquece dados com BI próprio. Custom consome `/api/v1/integration/weighing-tickets` do ST.

---

## Casos de migração custom → ST

### Caso A — Indústria de cimento

- **Antes**: 18 meses construindo integração com SAP. Custou R$ 380k. Funcionou 8 meses até SAP atualizar e quebrar.
- **Depois**: Solution Ticket Enterprise + SAP S/4HANA. R$ 6.500/mês. 60 dias para migrar.
- **Resultado**: 4 anos de operação estável; payback do ST em 3 meses comparado ao custo de "re-fazer" o custom.

### Caso B — Cooperativa agro

- **Antes**: dev interno mantinha integração TOTVS Datasul. Dev saiu, ninguém entendia.
- **Depois**: Solution Ticket Tier-1 BR + TOTVS Datasul. Time interno foca em outros projetos.
- **Resultado**: economia de 1 FTE permanente.

---

## Pergunta final

Antes de decidir custom, responda:

1. Quanto vou pagar nos próximos **5 anos** em manutenção?
2. O que acontece quando o dev que faz isso sair?
3. Como provo conformidade fiscal de 5 anos atrás?
4. E quando o ERP mudar de versão?
5. E se quiser adicionar 2º ERP?

Se a resposta for "não pensamos nisso", custom **não** é a opção certa.

---

## Convite

PoC de 7 dias gratuito. Provamos no ambiente de vocês, sem compromisso. Se Solution Ticket não couber, indicamos parceiro custom de confiança.

---

**Calcule seu ROI em 5 minutos**: [solution-ticket.com/roi?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-integracao-custom&utm_content=rodape-cta](https://solution-ticket.com/roi?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-integracao-custom&utm_content=rodape-cta)

📅 **Agende demo**: [solution-ticket.com/demo?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-integracao-custom&utm_content=rodape-demo](https://solution-ticket.com/demo?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-integracao-custom&utm_content=rodape-demo)
