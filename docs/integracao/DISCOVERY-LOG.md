# Discovery Log — Modulo Integracao ERP

> Registro publico de entrevistas com clientes. Atualizar em <=48h apos a conversa.
> Cadencia e regras: DISCOVERY-CADENCE.md.

## Template

```markdown
### [YYYY-MM-DD] Cliente: <Nome ou COD-ANON-XX>

- **Vertical**: agro / mineracao / construcao / residuos / cooperativa
- **Porte**: <faixa funcionarios> / <faixa faturamento>
- **ERP**: <Bling/Omie/Sankhya/Protheus/SAP B1/...>
- **Tempo de uso do modulo**: <0-30d / 1-3m / 3-12m / >12m>
- **Entrevistador**: <PM nome>
- **Observador**: <Eng/Suporte nome>
- **Gravacao**: <link Drive ou "sem gravacao — consentimento negado">

**Contexto** (1-2 linhas sobre a empresa e o motivo da conversa)

**Perguntas + Respostas resumidas**

1. <pergunta abertura> -> <resumo da resposta, max 3 linhas>
2. ...

**Fechadas**

- NPS: X/10
- Etapa de maior dor: <comeco/meio/fim/fechamento>
- Tempo manual estimado: <faixa>

**Insights**

- <bullet 1>
- <bullet 2>

**Acoes propostas**

- [ ] <acao + responsavel + prazo>
```

## Entradas

### [2026-04-10] Cliente: COD-ANON-AGRO-01

- **Vertical**: agronegocio (cooperativa de soja)
- **Porte**: 180 funcionarios / R$ 220M faturamento
- **ERP**: TOTVS Agro Multicultivo
- **Tempo de uso**: 4 meses
- **Entrevistador**: PM Marina
- **Observador**: Eng Carlos
- **Gravacao**: drive://discovery/2026-04-10-agro01.mp4

**Contexto**: Cooperativa com 4 unidades recebedoras, ~3.200 pesagens/mes em safra. Integracao foi piloto Fase 1.

**Perguntas + Respostas resumidas**

1. Ultima conferencia ticket vs NFe? -> "Toda sexta o controller cruza romaneio com SPED. Ate fevereiro era 6h, agora caiu pra 1h porque a integracao puxa direto."
2. O que muda se a integracao cair 1h? -> "Em safra, fila de caminhao na portaria. Ja aconteceu em marco e perdemos 2 viagens (multa de R$ 800 cada)."
3. Processo manual que sobra? -> "Conferencia de classificacao de impureza — ainda digito no ERP. Queria que viesse junto."
4. Como descobre erro? -> "Operador da balanca grita. Nao tem alerta automatico ainda."
5. Pedido de feature? -> "Painel mensal pra mostrar pro presidente da coop. Hoje monto no Excel."

**Fechadas**: NPS 9/10 | Maior dor: fechamento mensal | Tempo manual: 1-5h.

**Insights**

- Alerta proativo de queda de integracao = dor real (perdeu R$ 1.600 em uma ocorrencia).
- Painel executivo mensal aparece como pedido recorrente (3a vez no log).
- Classificacao de impureza e gap especifico de agro — nao confundir com generico.

**Acoes propostas**

- [ ] Marina: cruzar com COD-ANON-AGRO-03 e AGRO-05 — se 2+ pediram painel, virar historia (RICE).
- [ ] Carlos: investigar custo de alerta proativo (heartbeat) para Fase 2.

---

### [2026-04-18] Cliente: COD-ANON-RESID-02

- **Vertical**: residuos solidos (gestao ambiental)
- **Porte**: 95 funcionarios / R$ 75M faturamento
- **ERP**: Sankhya
- **Tempo de uso**: 2 meses (onboarding)
- **Entrevistador**: PM Marina
- **Observador**: Suporte Joana
- **Gravacao**: drive://discovery/2026-04-18-resid02.mp4

**Contexto**: Gestora de aterro classe IIA, recebe residuo industrial de 40 clientes B2B. Onboarding ainda em ajuste fino.

**Perguntas + Respostas resumidas**

1. Ultima conferencia? -> "MTR do IBAMA tem que bater com peso. Hoje a auxiliar fiscal confere manualmente — 2h por dia."
2. Cai 1h? -> "Ruim mas nao para. Operador anota no caderno e digita depois."
3. Manual que sobra? -> "Geracao do CDF — Certificado de Destinacao Final. Cliente cobra todo mes."
4. Como descobre erro? -> "Cliente liga reclamando que CDF nao bate com nota."
5. Pedido? -> "CDF automatico. E integracao com sistema do IBAMA (SINIR)."

**Fechadas**: NPS 7/10 | Maior dor: fechamento mensal | Tempo manual: 5-20h.

**Insights**

- CDF automatico e dor especifica de residuos — verificar TAM (provavelmente <300 empresas BR).
- SINIR e API publica do IBAMA — investigar viabilidade tecnica.
- Cliente ainda nao percebeu valor pleno (NPS 7) — onboarding precisa de sessao de fechamento contabil.

**Acoes propostas**

- [ ] Joana: incluir sessao "primeiro fechamento mensal" no playbook de onboarding.
- [ ] Marina: levantar TAM de residuos solidos antes de promover CDF para backlog.
- [ ] Eng: spike de 2 dias sobre API SINIR.
