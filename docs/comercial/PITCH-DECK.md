# Pitch Deck — Solution Ticket Integration Hub

**Formato**: outline em markdown para conversão posterior em PowerPoint/Keynote/Google Slides
**Duração-alvo**: 15–20 minutos + 10 min Q&A
**Audiência**: decisores técnicos e financeiros de empresas com balança e ERP
**Versão**: 1.0 — 2026-04-26

---

## Slide 1 — Capa

**Visual**: logo + balança + ERPs (SAP, TOTVS, Bling, Sankhya) conectados por linha

**Título**: Solution Ticket Integration Hub
**Subtítulo**: A única integração de pesagem ERP que **nunca perde um ticket**
**Rodapé**: {Apresentador} | {Empresa cliente} | {Data}

**Notas do apresentador**: cumprimento + 30s de small talk. Pergunta inicial: "Quantos tickets de pesagem vocês perdem ou retrabalham por mês?"

---

## Slide 2 — O problema

**Título**: O custo invisível da integração quebrada

**Conteúdo**:

- ❌ Operador digita ticket no ERP duas vezes
- ❌ ERP cai e a balança para de operar
- ❌ Divergência entre peso pesado e quantidade faturada
- ❌ Auditoria fiscal não consegue rastrear ticket
- ❌ Cliente reclama, retrabalho aumenta, faturamento atrasa

**Stat de impacto**: perdas de receita por divergência fiscal e retrabalho são reportadas em diagnósticos de mercado em integrações ERP/operacionais; **a quantificação por cliente requer baseline próprio** medido em discovery — não apresentamos número genérico sem o dado do prospect.

**Notas**: cite dado real do cliente se já tiver — "vocês me disseram que..."

---

## Slide 3 — Por que isso acontece

**Título**: Integrações tradicionais foram desenhadas para o cenário ideal

**Conteúdo**:

- Integração síncrona: balança espera resposta do ERP
- Sem fila: se ERP cai, ticket é perdido
- Sem retry inteligente: erro técnico vira erro de negócio
- Sem auditoria: ninguém sabe o que aconteceu
- Cada cliente recebe código customizado: manutenção cara

**Imagem**: linha do tempo mostrando "ticket fecha → ERP cai → ticket perdido"

---

## Slide 4 — Nossa abordagem

**Título**: Hub de Integração Local-First

**Visual**: diagrama da arquitetura (versão simplificada do `001-arquitetura-integration-hub.md`)

**3 pilares**:

1. **Operação não para** — pesagem fecha mesmo com ERP fora
2. **Zero perda fiscal** — outbox transacional + auditoria 5 anos
3. **Conector certo para cada ERP** — 20 ERPs suportados ou via API genérica

---

## Slide 5 — Como funciona

**Título**: O ciclo de vida do ticket

**Visual**: 6 passos com setas

1. Operador fecha pesagem → ticket grava local
2. Outbox grava evento na **mesma transação**
3. Worker assíncrono envia ao ERP
4. Sucesso → ERP confirma, vínculo registrado
5. Falha técnica → retry automático com backoff
6. Falha de negócio → suporte resolve via dashboard

**Mensagem-chave**: "Você não precisa entender. Tudo é automático e auditável."

---

## Slide 6 — Diferenciais técnicos

**Título**: O que ninguém mais oferece

| Feature                      | Solution Ticket | RPA / planilha | Integração custom |
| ---------------------------- | :-------------: | :------------: | :---------------: |
| Funciona offline             |       ✅        |       ❌       |        ❌         |
| Zero perda garantida         |       ✅        |       ❌       |      depende      |
| Auditoria 5 anos             |       ✅        |       ❌       |      depende      |
| Reprocessamento self-service |       ✅        |       ❌       |        ❌         |
| Suporte a 20+ ERPs           |       ✅        |       ❌       |        ❌         |
| Tempo de setup               |      dias       |    semanas     |       meses       |
| Custo                        |      R$$$       |      R$$       |      R$$$$$       |

---

## Slide 7 — ERPs suportados

**Título**: Conectamos com o ERP que você já usa

**Visual**: grid com logos:

**Brasil PME**: Bling, Omie, ContaAzul, Tiny
**Brasil Médio/Grande**: TOTVS Protheus/RM/Datasul, Sankhya, Senior, Benner, CIGAM, Mega
**Global**: SAP, Microsoft Dynamics, NetSuite, Oracle, Infor, Epicor, IFS
**Long tail**: via conector genérico REST/CSV/SFTP

**Footer**: "Não está na lista? Conector genérico cobre 80% dos casos. Para o resto, oferecemos conector custom."

---

## Slide 8 — Caso real

> **⚠ ILUSTRATIVO até primeiro case auditado** — números abaixo refletem expectativa da arquitetura local-first; SEM cliente real publicado até 2026-Q4. Substituir por case auditado quando disponível.

**Título**: Caso ilustrativo (sem cliente real) — projeção de redução de retrabalho

**Antes (perfil hipotético de Médio BR)**:

- 2 operadores digitando ticket no ERP
- 8% de divergência mensal
- 1 dia/mês de balança parada por falha de integração
- Auditoria fiscal manual demorava 3 dias

**Depois (60 dias com Solution Ticket — projeção de arquitetura)**:

- 0 operador digitando — automático
- 0,3% de divergência (rastreada e corrigida) [meta]
- 0 minutos parados — operação 100% [meta]
- Auditoria fiscal: 1 clique, 5 minutos

**ROI projetado**: payback ~73 dias (caso ilustrativo, não cliente real)

---

## Slide 9 — ROI calculator (preview)

**Título**: Quanto vocês economizam por mês

**Visual**: planilha simplificada (3 inputs, 2 outputs)

| Input                      | Valor exemplo |
| -------------------------- | ------------- |
| Pesagens/mês               | 5.000         |
| % retrabalho atual         | 5%            |
| Custo médio por retrabalho | R$ 80         |

| Output                       | Valor             |
| ---------------------------- | ----------------- |
| Custo atual de retrabalho    | R$ 20.000/mês     |
| Investimento Solution Ticket | R$ 3.500/mês      |
| **Economia líquida**         | **R$ 16.500/mês** |
| Payback                      | < 90 dias         |

**CTA**: "Vou enviar o cálculo personalizado para vocês após esta reunião."

---

## Slide 10 — Pricing transparente

**Título**: Planos simples, sem surpresa

|                      | **Standard** | **Pro**        | **Enterprise**            |
| -------------------- | ------------ | -------------- | ------------------------- |
| Preço base           | já incluído  | R$ 297/balança | R$ 1.497 + R$ 197/balança |
| Conectores nativos   | 0            | 1              | 3+                        |
| API REST             | só leitura   | completa       | completa                  |
| iPaaS / SOAP / OData | ❌           | ❌             | ✅                        |
| SLA                  | best-effort  | business hours | 99.5% + 24/7              |
| Suporte              | comunidade   | e-mail         | account manager           |

Detalhes completos em `PLANO-COMERCIAL.md`. Setup fee one-time conforme categoria do conector.

---

## Slide 11 — Segurança e compliance

**Título**: Nível bancário, auditoria fiscal completa

- Credenciais protegidas via Windows DPAPI (criptografia nativa)
- TLS 1.3 obrigatório
- LGPD compliant (DPA, retenção configurável, direito ao esquecimento)
- Auditoria fiscal de **5 anos** (atende Receita Federal)
- Logs com correlation ID — rastreabilidade total
- Backend nunca exposto na internet (zero risco de invasão)
- Permissões granulares — quem fez o quê fica registrado

---

## Slide 12 — Resiliência operacional

**Título**: Quando algo dá errado, vocês descobrem em < 10 minutos

**Visual**: print da tela de Eventos do Solution Ticket

**Suporte L1 do cliente consegue responder**:

- Qual ticket falhou?
- Qual ERP recebeu?
- Qual payload foi enviado?
- Qual resposta voltou?
- Foi erro técnico (resolve sozinho) ou de negócio (precisa ação)?
- Quantas tentativas ocorreram?

Sem isso, integração quebrada vira mistério. Com isso, vira to-do.

---

## Slide 13 — Roadmap

**Título**: Onde estamos e para onde vamos

**Visual**: linha do tempo (somente o que interessa ao cliente)

- **Q2 2026**: Bling, Omie, ContaAzul, Sankhya em produção
- **Q3 2026**: TOTVS Protheus, RM, Datasul, Senior
- **Q4 2026**: SAP S/4HANA, Microsoft Dynamics 365, NetSuite
- **2027**: Marketplace de conectores parceiros + SDK público

---

## Slide 14 — Por que decidir agora

**Título**: A janela está aberta

- Quem integrar agora cria **barreira competitiva** vs concorrentes que ainda digitam manual
- Setup com **30% off para fechamentos no mês corrente** (válido até {data})
- Cliente piloto recebe **2 meses grátis** + acesso prioritário a novos conectores
- Próxima vaga de implantação: **{data}**

---

## Slide 15 — Próximos passos

**Título**: Como avançamos

1. **Esta semana**: enviamos ROI personalizado + proposta comercial
2. **Próxima semana**: PoC de 7 dias no ambiente de homologação de vocês
3. **Em 30 dias**: piloto em uma balança
4. **Em 60 dias**: rollout completo

**Pergunta para fechar**: "Quem dentro da equipe de vocês toma essa decisão? Posso falar diretamente com essa pessoa?"

---

## Slide 16 — Obrigado

**Visual**: foto da equipe + logos de clientes (com permissão)

**Contatos**:

- {Nome do apresentador} — {e-mail} — {telefone}
- Site: solution-ticket.com
- Demo online: solution-ticket.com/demo

**Materiais que enviarei**:

- ROI calculator personalizado
- Comparativo Solution Ticket vs alternativas
- 2 cases de cliente
- Proposta comercial

---

## Anexos (sob demanda — slides ocultos)

### A1. Arquitetura técnica detalhada

Para CTO/Arquiteto. Versão completa do diagrama do `001-arquitetura-integration-hub.md`.

### A2. Comparativo com RPA

RPA: frágil, quebra com mudança de UI, sem rastreabilidade, custo alto de manutenção. ST: API-first, robusto, auditável.

### A3. Comparativo com integração custom

Custom: 6–18 meses de desenvolvimento, R$ 200k+ inicial, manutenção contínua. ST: dias para subir, R$ baixo, manutenção incluída.

### A4. Implantação detalhada

Cronograma típico de 30/60 dias para Pro, 60/90 dias para Enterprise.

### A5. Termos de SLA

Para discussões com Jurídico/Compliance.

### A6. LGPD e segurança

Para discussões com DPO/Compliance.

---

## Notas de uso

- **Adaptar slide 8 (caso real)** ao segmento do cliente (agro, indústria, distribuição)
- **Adaptar slide 9 (ROI)** com números do próprio cliente quando possível
- **Slide 7 (ERPs)** — destacar o ERP do cliente em destaque visual
- **Slide 14 (decisão)** — só usar urgência quando real (ex: campanha de fim de mês)
- **Não usar emoji em ambiente conservador** (Tier-1 BR enterprise)
- **Sempre encerrar com CTA específico** (slide 15)

## Conversão para slides

Recomendado:

- Google Slides ou PowerPoint
- 1 slide = 1 ideia
- Máximo 30 palavras por slide
- Imagens > texto
- Fontes: 32pt+ (legível em projetor)
