# Comparativo — Solution Ticket vs RPA

**Audiência**: clientes considerando RPA (Automation Anywhere, UiPath, Blue Prism) para integração de pesagem com ERP
**Versão**: 1.0 — 2026-04-26

---

## TL;DR

RPA simula um operador clicando na tela do ERP. Funciona até o ERP mudar uma tela, atualizar versão, ou ficar lento. Solution Ticket usa **API oficial** do ERP — robusto, auditável, sem dependência de UI.

---

## Tabela comparativa

| Critério                                 |           RPA            |     Solution Ticket      |
| ---------------------------------------- | :----------------------: | :----------------------: |
| **Funciona offline (balança)**           |          ❌ Não          |  ✅ Sim — outbox local   |
| **Sobrevive a mudança de tela do ERP**   |        ❌ Quebra         |     ✅ Sim — usa API     |
| **Sobrevive a upgrade de versão do ERP** |        ❌ Quebra         |    ✅ Sim na maioria     |
| **Auditoria fiscal de 5 anos**           |        ❌ Difícil        |        ✅ Nativo         |
| **Idempotência (sem duplicidade)**       |        ❌ Frágil         |       ✅ Garantida       |
| **Reprocessamento self-service**         |          ❌ Não          |      ✅ Sim, via UI      |
| **Diagnóstico de falha**                 |      ❌ Tela morta       | ✅ Correlation ID + logs |
| **Performance (pesagens/min)**           |          ⚠️ 1–5          |         ✅ 100+          |
| **Tempo de setup**                       |        2–6 meses         |      Dias a semanas      |
| **Custo licença**                        | R$ 5k–R$ 50k/mês por bot | R$ 197–R$ 1.497/balança  |
| **Custo de manutenção**                  |  Alto (re-treinar bot)   |   Baixo (API estável)    |
| **Roda em paralelo (escalável)**         |   ⚠️ Só com mais bots    |        ✅ Nativo         |
| **Suporta múltiplos ERPs**               |        ❌ Por bot        |  ✅ 1 hub, N conectores  |
| **Suporta webhook do ERP**               |          ❌ Não          |    ✅ Sim, via relay     |
| **Compatível com ERP cloud**             |        ⚠️ Difícil        |        ✅ Nativo         |
| **Compatível com SAP/TOTVS/etc**         |   ✅ Sim (qualquer UI)   |     ✅ Sim (via API)     |

---

## Quando RPA faz sentido

RPA é a opção certa quando:

- ERP **não tem API alguma** (raro hoje)
- Não há banco staging acessível
- Solução é **temporária** (3–6 meses) enquanto ERP é substituído
- Volume é **baixo** (< 100 pesagens/dia)

Para tudo o mais, integração via API é melhor.

---

## Por que RPA quebra na prática

### Cenário típico

Cliente compra RPA. Bot clica em "Novo pedido" no ERP, preenche campos, salva. Funciona perfeito por 3 meses. Então:

1. **Mês 4**: ERP atualiza versão. Botão muda de posição. Bot quebra. 2 dias parado até reconfigurar.
2. **Mês 6**: TI do cliente bloqueia bot por security review. 1 semana negociando.
3. **Mês 8**: ERP fica lento em pico de safra. Bot dá timeout. Tickets perdidos.
4. **Mês 10**: Auditoria fiscal pede rastro. Bot não tem. Multa.
5. **Mês 12**: Renegociação contratual de RPA — preço dobra.

### Cenário com Solution Ticket

1. **Sempre**: API estável, contratual.
2. **Upgrade do ERP**: testes de contrato detectam, hotfix em 24h.
3. **Pico**: outbox absorve, retomamos sozinho.
4. **Auditoria**: rastro de 5 anos out-of-the-box.

---

## Análise de TCO (Total Cost of Ownership) — 24 meses

### Cliente médio (3.000 pesagens/mês, 1 ERP) — faixa de licença com fonte

> **Pricing UiPath é faixa, não valor único**. Licenças se compõem por modalidade (Attended Bot, Studio, Orchestrator, Enterprise CC) e tier de contrato (lista pública vs negociado).
>
> Referências de lista pública (UiPath, último acesso 2026-Q2 — confirmar em `uipath.com/pricing` antes de citar):
>
> - **Attended Bot**: ~US$ 420/mês ≈ **R$ 2.100/mês** (câmbio R$ 5/US$).
> - **Studio (licença adicional para desenvolvedor)**: faixa adicional de US$ 200–500/mês por dev.
> - **Enterprise / Unattended CC**: ~US$ 2.000+/mês por bot.
>
> **Valor exato depende do tier negociado**. Cliente Médio brasileiro tipicamente fecha em pacote Attended Bot + Studio em ~R$ 2.000–4.000/mês total (faixa). Enterprise CC entra em Tier-1+.

#### RPA (UiPath Attended/Studio — faixa Médio BR)

| Item                                                                   | Valor (faixa)                            |
| ---------------------------------------------------------------------- | ---------------------------------------- |
| Licença RPA (Attended Bot ~R$ 2.100 + Studio adicional R$ 1.000–1.900) | R$ 2.100–4.000/mês × 24 = **R$ 50k–96k** |
| Implementação inicial (consultoria)                                    | R$ 35.000                                |
| Manutenção (re-treinar a cada quebra)                                  | R$ 2.500/mês × 24 = R$ 60.000            |
| Tempo parado por falha de bot (5h/mês × R$ 800/h)                      | R$ 4.000/mês × 24 = R$ 96.000            |
| Auditoria fiscal manual                                                | R$ 800/mês × 24 = R$ 19.200              |
| **Total 24 meses (faixa)**                                             | **R$ 260k–306k**                         |

#### Solution Ticket Pro (mesmo cliente)

| Item                                                                                   | Valor                                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------ |
| Pro + 1 conector PME (R$ 297 + R$ 197)                                                 | R$ 494/mês × 24 = R$ 11.856                |
| Excedente (2k pesagens × R$ 0,30)                                                      | R$ 600/mês × 24 = R$ 14.400                |
| Setup fee                                                                              | R$ 1.500                                   |
| Manutenção                                                                             | Incluso                                    |
| Tempo parado (mesma faixa de baseline operacional do mercado, residual 20% — ver nota) | R$ 800/mês (20% residual) × 24 = R$ 19.200 |
| Auditoria                                                                              | R$ 400/mês (50% residual) × 24 = R$ 9.600  |
| **Total 24 meses**                                                                     | **R$ 56.556**                              |

**Comparação realista**: Solution Ticket fica em **~R$ 56k/24m** vs RPA na faixa **R$ 260–306k/24m** = **diferença 4,5–5,4× menos** no extremo superior, mas a leitura honesta usa a **mediana da faixa**: RPA ~R$ 280k vs ST R$ 56k → **diferença ~5×** no cenário central da faixa, **~2,5–3× no cenário onde o cliente já tem RPA Standard único barato e pouca quebra**.

> **Nota sobre custo de parada**: usado em ambas as colunas o mesmo baseline operacional do mercado (R$ 800/h × 5h/mês = R$ 4.000/mês para RPA quebrado vs 20% residual = R$ 800/mês com ST). O **diferencial real está em manutenção (re-treinar bot vs API estável) e robustez (UI fragility vs contrato API)**, não em "RPA fica parado o tempo todo". Apresentar nesta forma evita exagero no pitch.

> **Cenário Tier-1+**: RPA Enterprise CC (UiPath Unattended ~US$ 2.000/mês ≈ R$ 10k/mês ou Automation Anywhere Enterprise) entra no comparativo a partir de Tier-1 BR. Aí a diferença com ST volta a ser maior, mas é segmento diferente.

---

## Objeções comuns (e respostas)

### "RPA é mais flexível, faz qualquer coisa"

Verdade — e é por isso que quebra. Flexibilidade vem de scripts frágeis. Solution Ticket faz **menos coisas, mas perfeitamente**: integrar pesagem com ERP. Para o problema certo, foco vence flexibilidade.

### "Já investimos em RPA, não vamos jogar fora"

Não precisa. RPA pode continuar fazendo o que faz bem (ex: relatórios manuais, conciliação financeira). Solution Ticket cobre só pesagem ↔ ERP, libera RPA para o resto.

### "Nosso ERP não tem API decente"

Quase sempre é mito. ERPs Tier-1 (SAP, TOTVS, Oracle, Microsoft) têm APIs maduras. Mesmo TOTVS Protheus customizado tem REST/SOAP. Caso real sem API: oferecemos conector via banco staging ou CSV/SFTP.

### "RPA é mais barato no início"

Curto prazo sim. Médio prazo (12+ meses): RPA fica 50× mais caro por causa de manutenção e quebras.

### "Já temos consultoria RPA contratada"

Pergunte à consultoria: quantas vezes o bot quebrou nos últimos 6 meses? Quantas horas você pagou para arrumar? É exatamente o ciclo que evitamos.

---

## Casos de migração

### Caso A — Cooperativa agro

- **Antes**: 2 bots RPA simulando entrada no Protheus, R$ 18k/mês, 12h/mês paradas
- **Depois**: Solution Ticket Pro + Protheus, R$ 1.094/mês, 0h paradas
- **Migração**: 45 dias

### Caso B — Distribuidora de combustível

- **Antes**: 1 bot RPA + planilha de conciliação, R$ 12k/mês
- **Depois**: Solution Ticket Pro + SAP B1, R$ 2.244/mês
- **Migração**: 30 dias

(Casos baseados em padrões reais; nomes anonimizados.)

---

## Conclusão

|                         | Quando                                                 |
| ----------------------- | ------------------------------------------------------ |
| **Use RPA**             | ERP sem API alguma + volume baixo + solução temporária |
| **Use Solution Ticket** | Praticamente todos os outros casos                     |

**Convide-nos para um PoC de 7 dias**: provamos no ambiente de vocês.

---

**Calcule seu ROI em 5 minutos**: [solution-ticket.com/roi?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-rpa&utm_content=rodape-cta](https://solution-ticket.com/roi?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-rpa&utm_content=rodape-cta)

📅 **Agende demo**: [solution-ticket.com/demo?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-rpa&utm_content=rodape-demo](https://solution-ticket.com/demo?utm_source=comparativo&utm_medium=doc&utm_campaign=vs-rpa&utm_content=rodape-demo)
