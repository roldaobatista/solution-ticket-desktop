# Templates de E-mail — Comercial e Suporte

**Versão**: 1.0 — 2026-04-26
**Audiência**: Inside sales, Sales sênior, Customer Success, Suporte

Tom geral: direto, sem exagero, focado no problema do cliente. Personalizar nome/empresa/contexto sempre.

---

## 1. Outbound — Cold

### 1.1 Cold inicial — segmento agro

**Assunto**: Pesagens da {Empresa} prontas para integração REST com ERP

```
{Nome},

Conversei com 3 cooperativas do {Estado} esse mês — todas reclamam da
mesma coisa: digitar ticket de balança no Protheus toma 4h/dia em pico
de safra, e 1 em cada 20 sai com divergência fiscal.

Desenvolvemos um produto que conecta balança a um outbox local com API
REST genérica: o ticket fecha, fica auditável e pode ser integrado ao
ERP por projeto homologado, com escopo e aceite técnico. Conectores
nativos específicos, como Protheus, só devem ser propostos quando já
homologados para o cliente.

Vale 15 minutos para mostrar como funciona?

{link Calendly}

Att,
{Seu nome}
{Cargo} — Solution Ticket
```

### 1.2 Cold inicial — indústria

**Assunto**: {Empresa} já calculou o custo de balança parada por ERP fora?

```
{Nome},

Indústrias com balança rodoviária e ERP SAP/TOTVS perdem em
média 8h/mês por integração quebrada. Considerando R$ 1.500/h de
faturamento da linha, são R$ 12k/mês jogados fora — sem ninguém
perceber porque é pulverizado em pequenas paradas.

Nossa solução reduz esse risco com fila local e conector REST genérico:
balança continua operando mesmo se o ERP cair, e a sincronização entra
no escopo de integração homologado com o cliente.

15 minutos para mostrar caso real de cliente similar à {Empresa}?

{link Calendly}

{Seu nome}
```

### 1.3 Follow-up 1 (3 dias depois)

**Assunto**: RE: {assunto original}

```
{Nome}, segue acima.

Sei que e-mails se perdem. Se este é prioridade média, ignore. Se
quer entender em 2 minutos sem reunião, segue link de demo gravada:

{link demo}

E o ROI calculator (planilha) da {Empresa}, considerando volume típico
do segmento de {empresa}:

{anexo ou link ROI}

Abraço,
{Seu nome}
```

### 1.4 Follow-up 2 (7 dias depois) — break-up

**Assunto**: Posso parar?

```
{Nome},

Não tive retorno. Imagino que ou (a) não é prioridade agora, ou (b)
algo bloqueou.

Se for (a), tudo bem — guardo o contato para retomar em 6 meses.
Se for (b), me conta o quê? Talvez consigamos destravar.

Se não responder, paro de mandar e-mail. 🙏

{Seu nome}
```

---

## 2. Pós-demo

### 2.1 Resumo da reunião

**Assunto**: Resumo do que conversamos hoje + próximos passos

```
{Nome}, obrigado pelo tempo hoje.

**Recapitulando o que entendi sobre a {Empresa}**:
- {N} balanças, {ERP}, ~{X} pesagens/mês
- Hoje a integração é via {RPA / planilha / custom / digitação}
- Principais dores: {dor 1, dor 2, dor 3}
- Decisor técnico: {nome}; financeiro: {nome}

**O que mostrei do Solution Ticket**:
- Conector nativo {ERP do cliente}
- Fila local com retry (operação não para se ERP cair)
- Rastreabilidade auditável do ticket e da integração; retenção fiscal estendida depende do plano/contrato
- {feature específica relevante}

**Próximos passos acordados**:
1. Envio ROI personalizado até {data}
2. PoC de 7 dias no ambiente de homologação de vocês — possível início {data}
3. Reunião com {decisor} no dia {data}

Anexei:
- Slides da apresentação
- Comparativo Solution Ticket × {alternativa que estavam considerando}
- Case anonimizado de cliente similar

Qualquer dúvida, fale comigo direto: {WhatsApp / telefone}.

{Seu nome}
```

### 2.2 Envio de proposta

**Assunto**: Proposta Solution Ticket — {Empresa}

```
{Nome},

Conforme conversamos, segue proposta para a {Empresa}.

**Resumo**:
- Plano: {Pro/Enterprise}
- Conectores: {lista}
- Setup fee: R$ {X} (one-time)
- Mensalidade: R$ {Y}
- Volume incluso: {Z} pesagens/mês
- ROI projetado: payback em {N} dias

**Validade**: 30 dias (até {data}).

**O que está incluso**:
- Onboarding técnico (Discovery + Mapping inicial)
- Treinamento de equipe (4h)
- Homologação assistida (2 semanas)
- Suporte conforme SLA
- Atualizações e novos conectores na mesma família

**Cláusula de garantia**:
Se em 60 dias o conector não estiver em produção por motivo técnico
nosso, devolvemos 100% do setup.

Reservei vaga de implantação para iniciar em {data}. Confirma até {data}?

{Seu nome}
```

---

## 3. Onboarding (cliente fechou)

### 3.1 Boas-vindas

**Assunto**: Bem-vindos ao Solution Ticket! Próximos passos

```
{Nome}, bem-vindos!

Estou animado para começar. Aqui está o que acontece nas próximas
semanas:

**Semana 1**: Discovery técnico
- Reunião de kickoff em {data}
- Coletamos detalhes do {ERP} de vocês
- Mapeamos regras de negócio específicas

**Semana 2–3**: Implementação e mapping
- Configuramos perfil de integração
- Customizamos mapping
- Testes em sandbox

**Semana 4–5**: Homologação
- Vocês executam cenários
- Treinamento da equipe (4h presencial ou remoto)
- Termo de aceite de pré-produção

**Semana 6–7**: Modo Sombra + GA
- Comparação ao vivo com processo antigo
- Virada para modo ativo
- Acompanhamento intensivo

**Quem vocês falam**:
- Account Manager: eu — {nome / contato}
- Tech Lead: {nome / contato}
- Suporte: suporte@solution-ticket.com

Reunião de kickoff agendada para {data} — chama no calendário. Já
preparem:
- Acesso ao ambiente de homologação do {ERP}
- 1 técnico de TI dedicado por 2h/semana
- 1 operador de balança para fase de homologação

Vamos juntos!

{Seu nome}
```

---

## 4. Suporte

### 4.1 Resposta a chamado P0 (sistema parado)

**Assunto**: [P0] Investigando agora — {Empresa}

```
{Nome},

Recebi seu chamado. Estamos investigando.

**O que sabemos até agora**:
- Sintoma: {descrição}
- Início aproximado: {hora}
- Impacto: {N} pesagens afetadas

**O que estamos fazendo**:
- {ação imediata 1}
- {ação imediata 2}

**Importante**: a operação local da balança não é afetada — pesagem
continua fechando normalmente. A sincronia retoma assim que
resolvermos.

Próxima atualização em 30 minutos.

{Seu nome}
Suporte Solution Ticket
```

### 4.2 Pós-incidente

**Assunto**: Resolvido + post-mortem — incidente {data}

```
{Nome},

O incidente foi resolvido às {hora}. Tudo de volta ao normal.

**O que aconteceu**:
{Descrição em 2-3 frases}

**Causa raiz**:
{Explicação simples sem culpar nada/ninguém}

**Impacto real**:
- {N} pesagens em fila durante o período
- 0 pesagens perdidas (outbox absorveu)
- Latência adicional de {X} minutos

**O que fizemos para evitar repetir**:
- {ação corretiva 1}
- {ação corretiva 2}

**Crédito SLA aplicável**: {valor ou "N/A"}

Documento completo de post-mortem disponível em {link} se quiserem ver.

Qualquer pergunta, sou todo seu.

{Seu nome}
```

### 4.3 Resposta padrão para erro de cadastro do cliente

**Assunto**: Sobre o ticket {número} — ação necessária

```
{Nome},

Investiguei o ticket {número}. O envio falhou porque o cliente CNPJ
{XXX} não tem cadastro no {ERP}. Não é problema técnico — é
necessidade de cadastro.

**O que fazer**:
1. Cadastrar cliente no {ERP}
2. Aguardar 5 minutos (sincronização automática) ou clicar em
   "Sincronizar contatos" na tela Conectores
3. Tela Eventos → ticket {número} → "Reprocessar"

Se o cadastro estiver bloqueado por motivo administrativo, me avise
que ajusto a configuração para esses casos.

Abraço,
{Seu nome}
```

### 4.4 Resposta padrão para "como eu faço X" (educação)

**Assunto**: Como {fazer X} no Solution Ticket

```
{Nome},

Para {fazer X}, siga estes passos:

1. {passo 1}
2. {passo 2}
3. {passo 3}

Vídeo curto (3 min) mostrando: {link}

Documentação completa: {link}

Se tiver outras dúvidas similares, sugiro este vídeo geral de
operação (12 min) que cobre os principais cenários: {link}

Feliz em ajudar!

{Seu nome}
```

---

## 5. Customer Success

### 5.1 Check-in mensal

**Assunto**: Check-in mensal — {Empresa}

```
{Nome},

Hora do nosso check-in mensal. Olhando os números do mês:

**Operação**:
- Pesagens processadas: {N}
- Disponibilidade do hub: {X}%
- DLQ atual: {N} itens

**Onde está bom**:
- {ponto positivo 1}
- {ponto positivo 2}

**Pontos de atenção**:
- {item se houver}

**Novidades do produto** que podem interessar:
- {feature lançada relevante}

**Pergunta**: tem alguma dor não resolvida que poderíamos endereçar?

Se quiser conversar 15 min, marca aqui: {Calendly}

{Seu nome}
Customer Success — Solution Ticket
```

### 5.2 Aviso de upsell (cliente Pro maduro)

**Assunto**: {Empresa} pode estar pronta para Enterprise

```
{Nome},

Olhando o uso de vocês:
- {N} balanças (acima da média do plano Pro)
- {Y}k pesagens/mês (no excedente)
- Solicitação recente de {feature Enterprise}

Vale conversar sobre upgrade para Enterprise? Ganhos:
- SLA contratual (99.5% + suporte 24/7)
- Account Manager dedicado (eu, formalmente)
- Suporte a múltiplos conectores
- Reconciliação avançada
- Custo total reduz porque excedente sai mais barato

Reunião de 20 min para mostrar números: {Calendly}

{Seu nome}
```

### 5.3 Win-back (cliente cancelou)

**Assunto**: Sentimos falta da {Empresa}

```
{Nome},

Faz {N} meses que vocês saíram. Espero que tenham encontrado solução
que atenda.

Pergunta honesta: o que decidiu vocês a sair? Custos, funcionalidade,
suporte, time interno? Quero entender para não cometer o mesmo erro
com outros clientes.

Se quiserem 5 minutos, agradeço muito o feedback: {Calendly}

E claro, se em algum momento quiserem voltar, mantemos seu setup
prévio sem cobrar de novo.

Obrigado,
{Seu nome}
```

---

## 6. Notas de uso

- **Sempre personalizar**: nome, empresa, segmento, contexto
- **Evitar emoji em B2B conservador** (Tier-1, indústria pesada)
- **Limite 200 palavras** em cold; 300 em pós-demo
- **Sempre incluir CTA específico** (link, data, ação)
- **Assinatura completa** com nome, cargo, contato direto
- **Validar com Compliance** templates de incidente/SLA antes de usar
- **Variar assuntos** para evitar filtro de spam

## Métricas para acompanhar

| Template           | Métrica-alvo             |
| ------------------ | ------------------------ |
| Cold inicial       | Taxa de resposta > 8%    |
| Follow-up 1        | Resposta adicional > 15% |
| Follow-up break-up | Resposta > 25% (alta)    |
| Pós-demo           | Move para proposta > 50% |
| Proposta           | Fechamento > 30%         |
| Onboarding         | NPS pós-go-live > 50     |
| Check-in mensal    | Retenção > 95%           |
