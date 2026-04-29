# Playbook — Segmento Médio BR (Doce-Spot Comercial)

**Versão**: 1.0 — 2026-04-27
**Audiência**: Inside Sales, Sales Sênior, PM
**Resolve**: achado da auditoria — segmento Médio sem playbook próprio

> **Nota sobre PME e Tier-1**: este playbook cobre **Médio BR** em profundidade. Playbooks dedicados para **PME** (ciclo curto, self-service, ticket R$ 944/mês) e **Tier-1/Enterprise** (ciclo longo, ABM, ticket R$ 3.479–7.920/mês) estão em **rascunho — entrega prevista Q3/26**. Enquanto isso, equipe de vendas pode usar este playbook como referência base, ajustando ciclo e qualificação conforme tabela de segmentos em `PROJECAO-COMERCIAL-RECALIBRADA.md`.

---

## Por que Médio é o doce-spot

Análise pós-auditoria comercial:

| Categoria  | LTV/CAC | Ciclo de vendas | MRR/cliente  | Cash flow                |
| ---------- | ------- | --------------- | ------------ | ------------------------ |
| PME        | 10x     | dias            | R$ 944       | rápido, mas valor baixo  |
| **Médio**  | **8x**  | **30–60d**      | **R$ 2.488** | ⭐ **melhor combinação** |
| Tier-1 BR  | 3x      | 90–180d         | R$ 3.479     | longo, margem apertada   |
| Enterprise | 4x      | 180–365d        | R$ 7.920     | muito longo, alto valor  |

**Médio combina LTV alto + ciclo médio**. PME tem volume mas margem baixa; Enterprise tem ticket mas demora ano para fechar.

---

## ICP — Cliente médio brasileiro ideal

### Firmographics

- **Faturamento**: R$ 50M – R$ 500M/ano
- **Funcionários**: 50 – 500
- **Setor**: indústria leve, agro (cooperativa pequena/média), distribuição, transporte
- **Região**: Sul, Sudeste, Centro-Oeste (Norte/Nordeste sob demanda)
- **Balanças**: 2 – 6
- **Pesagens/mês**: 3.000 – 15.000

### Tecnologia

- **ERP**: Sankhya, Senior, TOTVS RM, TOTVS Datasul, TOTVS Protheus médio
- **TI interna**: 1 – 5 pessoas
- **Tem consultoria ERP** terceirizada
- **Tolerância a SaaS**: alta (já usa Conta Azul, Bling, GitHub)

### Sinais de qualificação (positivo)

- Cresceu 20%+ no último ano
- Operação de balança crítica (não auxiliar)
- Auditoria fiscal recente identificou divergências
- Trocou de ERP nos últimos 24 meses ou planeja trocar
- Já tentou integração custom/RPA e não funcionou

### Sinais de descarte

- < 1.000 pesagens/mês (PME, vai cair em Pro básico)
- > 30.000 pesagens/mês (Tier-1, ciclo diferente)
- Sem TI interna nenhuma (vai precisar muito hand-holding)
- ERP altamente customizado sem documentação (risco implementação)

---

## Buyer persona — "Diretor de TI Médio Brasileiro"

### Perfil

- **Idade**: 35–50 anos
- **Cargo**: Diretor TI / CIO / Coordenador TI Sênior
- **Experiência**: 10–20 anos em TI corporativa
- **Quem reporta**: 1–5 pessoas
- **Quem reporta para**: Diretor Financeiro ou CEO direto

### Dores principais (em ordem)

1. **"Operação reclama de TI"** — operadores frustrados com processo manual
2. **"Não tenho headcount para refazer integração"** — TI sobrecarregada
3. **"Auditoria fiscal levantou X divergências"** — pressão do CFO
4. **"Última atualização do ERP quebrou tudo"** — medo de mudança
5. **"Não quero contratar consultoria de R$ 200k/ano"** — orçamento apertado

### Jobs to be done

- Resolver pesagem ↔ ERP **sem virar projeto de 6 meses**
- Ter **rastro fiscal** para Receita Federal sem dor
- Liberar TI para **outros projetos** estratégicos
- Não ser o cara que "comprou solução cara que não funcionou"

### Canais

- LinkedIn (alta atividade)
- Webinars técnicos (1–2/mês quando relevante)
- Indicação de pares (cooperativa indica cooperativa)
- Eventos: Agrishow, Coopavel, ExpoLogística, encontros TOTVS/Sankhya

### Gatilhos de decisão

- Caso real de empresa similar (cooperativa indicando cooperativa)
- ROI claro em < 6 meses
- POC de 7-15 dias antes de comprar
- Suporte responsivo em fase de avaliação

### Objeções típicas

1. **"Já tentamos algo parecido e não funcionou"** → mostrar arquitetura local-first vs RPA quebrado
2. **"Vou esperar o próximo orçamento"** → desconto agressivo + payback < 60d
3. **"Preciso falar com TOTVS/Sankhya"** → oferecer co-call com partner técnico
4. **"E se vocês quebrarem em 6 meses?"** → contrato de transferência de código + dados próprios
5. **"Caro"** → ROI calculator com números do próprio cliente
6. **"Bling/Omie quebrar não é meu custo"** → resposta documentada no contrato:
   - **SLA do conector**: disponibilidade do hub Solution Ticket **99% mensal** (linha do hub, não do ERP cloud do cliente).
   - **Retry automático com backoff exponencial**: ticket fica em outbox e re-envia quando ERP cloud volta. Cliente NÃO perde ticket por indisponibilidade do ERP.
   - **Créditos proporcionais em downtime do ERP cloud > 2h**: quando indisponibilidade comprovada do ERP cloud (Bling/Omie/ContaAzul) supera **2h em janela de 24h**, aplicamos crédito proporcional na mensalidade do conector ERP (não da mensalidade base ST), reconhecendo que cliente paga conector sem poder operar.
   - **Auditoria completa do incidente**: registro de cada tentativa, payload e resposta — cliente apresenta para próprio ERP cloud na renegociação contratual.

---

## Pricing recomendado para o segmento

| Item                       | Valor                                              |
| -------------------------- | -------------------------------------------------- |
| Plano                      | Pro (R$ 297/balança) ou Pro Plus (a criar)         |
| Conector                   | Sankhya / Senior / TOTVS RM (R$ 397/mês adicional) |
| Setup                      | R$ 4.500 padrão; até R$ 8.000 com customização     |
| Onboarding técnico         | R$ 6.000 (3 semanas)                               |
| Volume incluso recomendado | 5.000 pesagens/mês (negociar)                      |
| Excedente                  | R$ 0,15/pesagem (não R$ 0,30 do PME)               |
| Contrato mínimo            | 12 meses                                           |

**Ticket médio MRR**: R$ 2.500 – R$ 4.000

---

## Discovery customizado para Médio

### Perguntas-chave (15 min)

#### Operação

1. Quantas balanças? (esperado 2-6)
2. Pesagens/mês média e em pico?
3. Operação 24/7 ou comercial?
4. Multi-unidade?

#### ERP

5. Qual ERP? Versão? Cloud ou on-premise?
6. Quem é o partner de implantação?
7. Quanta customização ele tem?
8. Última atualização foi quando?

#### Dor

9. Como o ticket vira lançamento hoje?
10. Quanto tempo TI gasta com isso/mês?
11. Tiveram problema fiscal? Quando? Quanto custou?
12. Quantas vezes o sistema travou no último ano?

#### Decisão

13. Quem decide? CFO ou CEO?
14. Tem budget alocado?
15. Prazo para resolver?

---

## Cadência de vendas (Médio = 30-60 dias)

| Dia | Ação                                          |
| --- | --------------------------------------------- |
| 1   | Cold outbound (e-mail personalizado)          |
| 3   | Follow-up com case do segmento                |
| 7   | Discovery call (45 min)                       |
| 9   | ROI calculator personalizado enviado          |
| 14  | Demo técnica (60 min, com TI do cliente)      |
| 16  | Proposta enviada                              |
| 21  | Q&A com partner ERP do cliente (se aplicável) |
| 28  | Negociação (preço, contrato, SLA)             |
| 35  | Assinatura                                    |
| 42  | Kickoff técnico                               |

---

## Parcerias que aceleram

### TOTVS Partner

- Co-marketing em eventos TOTVS
- Lead share com partners locais
- Comissão de 10% para partner que indica deal fechado

### Sankhya Partner

- Mesma estrutura
- Sankhya tem programa formal mais ágil que TOTVS

### Senior Partner

- Mais difícil de entrar
- Quando entra, tem volume garantido

### Consultorias regionais

- Identificar 5 consultorias regionais por estado-alvo
- Programa "Indique e Ganhe" (5% recorrente)

---

## Material específico para Médio

### TOFU

- Whitepaper "Integração Sankhya/Senior/TOTVS RM em 30 dias"
- Webinar "5 erros de integração ERP em médias empresas" (mensal)
- Posts LinkedIn: 1/semana com case do segmento

### MOFU

- ROI calculator com presets para Sankhya/Senior/TOTVS RM
- Comparativo vs custom (R$ 200k+ de consultoria)
- 3 cases de cooperativas/indústrias médias

### BOFU

- POC 7 dias com sandbox cliente
- Proposta com lock de pricing por 90 dias
- Garantia de reembolso 60 dias

---

## Métricas-alvo do playbook

| Métrica                        | Meta mês 6 | Meta mês 12 | Meta mês 18 |
| ------------------------------ | ---------- | ----------- | ----------- |
| Clientes Médio ativos          | 2          | 12          | 30          |
| Pipeline Médio (qualified)     | 10         | 40          | 80          |
| Win rate (qualified → fechado) | 25%        | 35%         | 45%         |
| Ciclo médio                    | 60 dias    | 50 dias     | 40 dias     |
| MRR Médio                      | R$ 5k      | R$ 30k      | R$ 75k      |
| % MRR total do módulo          | 40%        | 38%         | 33%         |

---

## Owner

- **Sales Sênior dedicado** ao segmento (1 FTE a partir do mês 6)
- **Inside sales** apoia geração de pipeline
- **PM acompanha** para feedback de produto
- **Marketing** entrega 5 leads qualificados/semana

> **Quantificação da meta "5 leads qualificados (SQL)/semana"**:
>
> - Estrutura: **2 SDRs full-time** dedicados ao segmento Médio.
> - Atividade: **80 calls/dia × 5 dias = 400 calls/semana por SDR** = 800 calls/semana no total.
> - Conversão call → conexão (alguém atende e qualifica): **~25%** = 200 conexões/semana.
> - Conversão conexão → MQL (perfil ICP + dor confirmada): **~30%** = ~60 MQLs/semana (ou ~12 MQLs/SDR/semana).
> - Conversão MQL → SQL (handoff aceito por AE, com discovery agendado): **~40%** ≈ **24 SQLs/semana**.
> - Meta conservadora oficial: **5 SQLs/semana entregues ao AE de Médio BR** (margem de 3–4× sobre cálculo teórico para absorver sazonalidade, qualidade de lista e variação de SDR).
> - Inputs adicionais (inbound, eventos TOTVS/Sankhya, indicação) somam ao funil de SDR — não são contados separadamente nessa meta.

---

## Referências

- `comercial/PROJECAO-COMERCIAL-RECALIBRADA.md` — análise que identificou o doce-spot
- `comercial/SALES-TRAINING.md` — playbook geral
- `integracao/contratos/sankhya.md` — conector principal do segmento
