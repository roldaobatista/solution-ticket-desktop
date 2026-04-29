# Cadencia de Discovery — Modulo Integracao ERP

> Owner agentico: `DiscoveryResearchAgent`. Atualizacao mensal. Referencia: DISCOVERY-LOG.md, RICE-PRIORITIZATION.md, ICP-DEFINITION.md.

## 1. Objetivo

Manter linha continua de aprendizado com clientes reais para alimentar backlog, evitar construir solucoes para problemas inexistentes e validar premissas de produto/negocio.

## 2. Volume e Formato

- **4 a 6 sinais por mes** com clientes que ja integraram o modulo (ou estao em onboarding): entrevistas, formularios, tickets de suporte, CRM, telemetria ou transcricoes.
- Duracao: **15 a 30 minutos** cada — nunca mais.
- Formato preferencial: formulario/bot assíncrono ou videoconferencia gravada **com consentimento registrado** (politica de privacidade).
- Idioma: Portugues. Sem traducao tecnica para o cliente.
- `DiscoveryResearchAgent` conduz/coleta; `Support-Agent` ou `Commercial-Agent` revisa notas quando houver sinal qualitativo.

## 3. Estrutura da Entrevista

### Bloco abertas (5 perguntas, ~20 min)

1. Conta como foi a ultima vez que voce precisou conferir uma pesagem com a nota fiscal?
2. O que muda no seu dia se a integracao parar de funcionar por 1 hora?
3. Que processo manual voce ainda faz hoje que gostaria que a ferramenta fizesse?
4. Quando algo da errado, como voce descobre? Quem te avisa primeiro?
5. Se pudesse pedir uma coisa nova, sem pensar em prazo, o que pediria?

### Bloco fechadas (3 perguntas, ~5 min)

6. Numa escala 0-10, qual a chance de voce indicar para um colega? (NPS)
7. Em qual etapa do mes voce sente mais a dor da reconciliacao? (escolher: comeco, meio, fim, fechamento contabil)
8. Quanto tempo por mes voce estima gastar conferindo manualmente? (faixas: <1h, 1-5h, 5-20h, >20h)

### Regras de conducao

- Foco em **Jobs-To-Be-Done**: o que ele estava tentando "contratar" o produto para fazer.
- **Nunca virar demo** — se cliente pedir, agendar outra reuniao com SE.
- **Nunca validar ideia ja decidida** ("voce gostaria de feature X?") — perguntar sobre comportamento passado.
- **Nunca sugerir solucao** durante a fala do cliente.

## 4. Logging Publico

Toda entrevista vira entrada em `docs/integracao/DISCOVERY-LOG.md` em ate 48h.

Campos minimos: data, cliente (anonimizavel), vertical, contexto, perguntas+respostas resumidas, insights, acoes propostas.

Log e visivel para Eng, Comercial, Suporte e CFO. Nao e confidencial — exceto dados pessoais.

## 5. Cadencia de Sintese

| Frequencia     | Atividade                                | Output                                              |
| -------------- | ---------------------------------------- | --------------------------------------------------- |
| Semanal        | Triagem rapida das entrevistas da semana | 3-5 bullets de insights                             |
| Mensal         | Atualizacao da Opportunity Solution Tree | Arvore versionada no Miro/Figma                     |
| Inicio de Fase | Assumption Mapping completo              | Matriz risco x evidencia, top 5 premissas a validar |
| Trimestral     | Revisao do ICP e RICE                    | PRs em ICP-DEFINITION.md e RICE-PRIORITIZATION.md   |

## 6. Insights -> Backlog

Regra de promocao a historia de produto:

- **>=2 clientes distintos** mencionaram a mesma dor/desejo, OU
- **1 cliente do ICP primario** mencionou + a dor toca >=20% do SAM (estimativa PM), OU
- **Sinal forte**: cliente cancelou ou ameacou cancelar por causa do gap.

Insight isolado de 1 cliente fora do ICP: arquivar em "parking lot", nao virar historia.

## 7. Anti-Padroes (Causas Comuns de Discovery Inutil)

| Anti-padrao                         | Por que falha                                    | Correcao                                          |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Transformar entrevista em demo      | Cliente vira espectador, nao informa             | Demo separada com SE                              |
| Perguntar "voce gostaria de X?"     | Resposta sempre "sim" e nao prediz comportamento | Perguntar sobre acao passada concreta             |
| Entrevistar nao-cliente (lead frio) | Sem contexto de uso, opina em abstrato           | So entrevistar quem ja tentou resolver o problema |
| Um unico agente sem revisao         | Vies de confirmacao na nota                      | Revisao por `Commercial-Agent` ou `Support-Agent` |
| Nao publicar log                    | Conhecimento fica no PM                          | Log em 48h, sem excecao                           |
| Mais de 30 min                      | Cliente cansa, qualidade cai                     | Cortar em 30 min mesmo se bom                     |

## 8. Recrutamento de Entrevistados

- 60% clientes ativos (1+ mes de uso).
- 20% em onboarding (0-30 dias).
- 10% que cancelaram ou churned (lead saudavel — ouvir motivos).
- 10% prospects qualificados (SQL) que nao fecharam.

Compensacao: voucher R$ 100 ou doacao para ONG escolhida pelo entrevistado. Nunca dinheiro direto a funcionario PJ.
