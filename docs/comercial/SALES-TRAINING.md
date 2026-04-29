# Material de Treinamento — Inside Sales

**Versão**: 1.0 — 2026-04-26
**Audiência**: novos inside sales (treinamento inicial 2 dias) + reciclagem trimestral
**Pré-requisito**: ter lido `PLANO-COMERCIAL.md`, `PITCH-DECK.md`, `ROI-CALCULATOR.md`

---

## 1. O que vendemos

**Em 1 frase**: hub de integração que conecta balança veicular ao ERP do cliente sem perder ticket.

**Em 30 segundos** (elevator pitch):

> Toda empresa que pesa caminhão tem o mesmo problema: ticket fecha na balança e precisa virar lançamento no ERP. Hoje fazem manual ou com bot RPA que quebra. A gente resolve com produto: conector nativo, fila local que não para se ERP cair, auditoria fiscal de 5 anos. Setup em dias, payback em meses.

---

## 2. Discovery — perguntas obrigatórias

### Bloco A — Operação

1. Quantas balanças vocês operam?
2. Quantas pesagens por mês? E em pico?
3. Qual ERP usam? Versão? Cloud ou on-premise?
4. Quem opera a balança hoje?
5. Vocês têm operação em quantas unidades/filiais?

### Bloco B — Dor atual

6. Como o ticket vira lançamento no ERP hoje?
7. Quanto tempo gasta nessa operação?
8. Já tiveram problema fiscal por divergência de pesagem? Quanto custou?
9. Quantas vezes o sistema travou no último ano?
10. Quem é responsável quando dá problema?

### Bloco C — Decisão

11. Quem decide tecnicamente?
12. Quem decide financeiramente?
13. Quanto tempo costuma levar para fechar uma compra desse tipo?
14. Existe budget alocado? Quando renova?
15. Qual o critério de decisão? (preço, suporte, segurança, prazo)

### Bloco D — Contexto

16. Por que decidiram olhar isso agora?
17. Já avaliaram outras soluções? Quais?
18. Tem prazo para resolver?
19. O que aconteceria se não fizessem nada por 6 meses?

**Regra**: nunca fechar venda sem responder às 19 perguntas.

---

## 3. Qualificação BANT

| Critério      | Pergunta                            | Resposta esperada    |
| ------------- | ----------------------------------- | -------------------- |
| **B**udget    | "Tem budget para isso este ano?"    | Sim ou "vai aprovar" |
| **A**uthority | "Quem assina?"                      | Identificar decisor  |
| **N**eed      | "Que dor isso resolve?"             | Quantificar em R$    |
| **T**iming    | "Quando precisa estar funcionando?" | Prazo claro          |

Se 3+ vermelhos: **deferir**, não forçar.

---

## 4. Categorização do prospect

| Categoria        | Sinais                                | Tratamento                       |
| ---------------- | ------------------------------------- | -------------------------------- |
| **Hot**          | BANT 4/4 + dor clara                  | Ciclo rápido, demo direta        |
| **Warm**         | BANT 3/4                              | Educar + nutrir + demo           |
| **Cool**         | BANT 2/4 ou avaliando longo prazo     | Newsletter + check-in trimestral |
| **Disqualified** | Sem balança / sem ERP / muito pequeno | Polite no, sem perder tempo      |

---

## 5. Objeções — drill de respostas

Para cada objeção, treine resposta de **30 segundos**.

### "É caro"

> "Caro comparado ao quê? Se hoje vocês perdem R$ X em retrabalho, R$ Y em multa, R$ Z em balança parada — somando dá R$ {soma}. Nosso plano custa R$ {valor}. Payback em {meses}. Posso te enviar o cálculo personalizado em 1 hora."

### "Já temos integração"

> "Bacana. Posso fazer 2 perguntas? (1) Quantas vezes ela quebrou no último ano? (2) Quem mantém? — {pausa} — Nosso diferencial não é só fazer integração, é garantir que ela funcione mesmo quando ERP/internet/token falham. E vem com manutenção contínua."

### "Não confio em hub local"

> "Entendo. 100% da pesagem fica na máquina de vocês — nada vai para nuvem. Auditoria fiscal de 5 anos garantida em SQLite local. Se quiser, mostro o relatório de incidentes do produto: zero perda de ticket em produção."

### "Vamos esperar"

> "Sem pressão. Só uma pergunta — esperar resolve algum bloqueio específico, ou é mais 'vamos pensar'? Se for o segundo, posso te dar 2 datas: (a) reunião de 20 min em 30 dias para revisitar; (b) PoC gratuita de 7 dias para vocês testarem sem compromisso."

### "Nosso ERP não está na lista"

> "Conector genérico REST/CSV cobre 80% dos casos. Em paralelo, podemos avaliar conector dedicado — depende do volume e do ERP. Posso pesquisar a viabilidade técnica em 48h e te trazer custo. Ok?"

### "RPA é mais flexível"

> "Verdade — flexível para quebrar com mudança de tela. Nosso foco é fazer integração ERP **bem feita**, não tudo. RPA pode continuar fazendo o que faz bem. Solution Ticket entra só onde RPA quebra: pesagem ↔ ERP."

### "Vamos comprar quando crescer"

> "Faz sentido. Curiosidade: 'crescer' significa quê pra vocês? Geralmente quando crescer, vão precisar com urgência e não vão ter tempo de implantar. Investir agora é mais barato e fica pronto para escalar."

### "Preciso falar com TI/Diretor"

> "Claro. Posso ajudar com isso? Levo material técnico que TI gosta de ver: arquitetura, segurança, ADRs. Se você marcar reunião com {decisor}, eu vou e respondo as perguntas técnicas. Vocês ganham tempo."

---

## 6. Demo — guion padrão (45 min)

### Setup pré-demo (preparar 1h antes)

- [ ] Confirmar nome, cargo, empresa de cada participante
- [ ] Ambiente de demo no Solution Ticket com dados do segmento do cliente
- [ ] Slides da apresentação prontos
- [ ] ROI calculator com inputs aproximados do cliente
- [ ] Tela compartilhada testada
- [ ] Câmera/mic OK

### Roteiro

#### 0–5 min — Quebra-gelo + agenda

"Antes de começar, recapitule: vocês me disseram que têm {X balanças}, usam {ERP}, e a dor maior é {Y}. Está certo?"

Se cliente corrige → ouvir e ajustar.

#### 5–15 min — Contexto e arquitetura

- Slide 2 (problema)
- Slide 4 (solução high-level)
- Slide 5 (ciclo de vida do ticket)

**Foco**: deixar claro que **operação não para**.

#### 15–35 min — Demo ao vivo (20 min)

1. Mostrar Tela Conectores → conector configurado
2. Fechar pesagem → mostrar evento na outbox
3. Worker processa → ver no ERP (sandbox)
4. **Cenário de erro**: simular ERP fora → mostrar fila acumular → simular volta → mostrar retomada automática
5. Mostrar Tela Eventos → reprocessar evento
6. Mostrar Tela Reconciliação → divergências detectadas
7. Mostrar Support Bundle → exportar diagnóstico

**Foco**: mostrar **resiliência** + **transparência**.

#### 35–40 min — ROI + pricing

- Slide 9 (ROI) com números do cliente
- Slide 10 (pricing)
- Mencionar setup fee + mensalidade + payback

#### 40–45 min — Q&A + próximos passos

- "Que perguntas vocês têm?"
- "Vou enviar: ROI personalizado + comparativo + case do {segmento}"
- "Próxima reunião com {decisor}: que dia?"

---

## 7. Cálculo rápido de mental ROI

Truque mental para qualificar em 30 segundos:

```
Pesagens/mês × 5% retrabalho × R$ 80/erro = custo mensal hoje
÷ R$ 1.000 (pricing médio Pro) = múltiplo de payback
```

Exemplos:

- 1.000 pesagens × 5% × R$ 80 = R$ 4.000/mês de dor → 4× pricing → ROI claro
- 5.000 × 5% × R$ 80 = R$ 20.000/mês → 20× pricing → no-brainer
- 200 × 5% × R$ 80 = R$ 800/mês → 0.8× → cliente pequeno demais para Pro, oferecer Standard ou plano PME minimal

---

## 8. Sinais de fechamento

**Verde (avançar)**:

- Pergunta sobre implementação ("quando começa?")
- Pergunta sobre contrato ("vocês têm modelo?")
- Convida outras pessoas para próxima reunião
- Pergunta sobre customização específica
- Pergunta sobre referência de cliente similar

**Amarelo (nutrir)**:

- "Vou apresentar internamente"
- "Vamos ver no próximo planejamento"
- "Interessante, manda mais material"

**Vermelho (mover para cool)**:

- Não responde follow-ups
- Cancela reuniões repetidamente
- "Não é prioridade agora" (sem prazo)
- Foca apenas em preço sem entender valor

---

## 9. Métricas de inside sales

| KPI                    | Meta mensal               |
| ---------------------- | ------------------------- |
| Cold e-mails enviados  | 200                       |
| Taxa de resposta       | > 8%                      |
| Reuniões agendadas     | 25                        |
| Demos realizadas       | 18                        |
| Demos → proposta       | > 50%                     |
| Propostas → fechamento | > 30%                     |
| Vendas mensais         | 5–8                       |
| Ticket médio           | R$ 30k (setup + 12 meses) |

---

## 10. Ferramentas a dominar

- **CRM**: HubSpot/Pipedrive (registrar TUDO)
- **Calendly**: agendamento
- **Loom**: vídeos curtos personalizados
- **LinkedIn Sales Navigator**: prospecção
- **ROI Calculator**: planilha pronta
- **Solution Ticket sandbox**: para demo ao vivo

---

## 11. Plano de treinamento (2 dias para novo SDR)

### Dia 1 — Produto e Mercado

- (manhã) Visão de produto + arquitetura básica + leitura de PITCH-DECK.md
- (tarde) Demo gravada × 3 (ver como veterano faz)

### Dia 2 — Vendas

- (manhã) Discovery + objeções (role-play 6 cenários)
- (tarde) Acompanhar 3 reuniões reais (observador)

### Semana 2 — Prática

- 5 cold e-mails enviados/dia
- Acompanhar 1 demo/dia
- Fazer primeira demo sob supervisão no fim da semana

### Reciclagem trimestral

- Revisar top 10 objeções (mudam)
- Atualizar pitch com novos cases
- Treinar features novas do produto
- Compartilhar best practices entre time

---

## 12. Material de apoio

- `docs/comercial/PITCH-DECK.md`
- `docs/comercial/ROI-CALCULATOR.md`
- `docs/comercial/EMAIL-TEMPLATES.md`
- `docs/comercial/comparativos/vs-rpa.md`
- `docs/comercial/comparativos/vs-integracao-custom.md`
- `docs/comercial/cases/EXEMPLO-CASE-AGRO-COOPERATIVA.md`
- `docs/comercial/marketing/WHITEPAPER-CONFIABILIDADE-FISCAL.md`

---

## 13. Princípios não-negociáveis

1. **Nunca prometer o que não faz** — gera churn e azedume
2. **Sempre quantificar a dor** — sem números, não vende
3. **Sempre confirmar entendimento** antes de propor
4. **Nunca falar mal de concorrente** — mostra fato, não opinião
5. **Sempre dar follow-up no prazo prometido** — ou avisar se atrasar
6. **Registrar tudo no CRM** — equipe não pode perder contexto
7. **Pedir referência** depois de cliente feliz — programa formal
8. **Buscar feedback** depois de "não" — aprende mais com perda do que com win
