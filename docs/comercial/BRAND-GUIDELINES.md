# Brand Guidelines — Solution Ticket

**Versão**: 1.0 — 2026-04-27
**Resolve**: Auditoria Rodada 5 — Agente 8 — "Sem brand book / posicionamento"
**Audiência**: Marketing, Vendas, Designers parceiros, Conteúdo

---

## 1. Posicionamento

> **"Integração ERP confiável e auditável para empresas com balança crítica."**

- **Promessa central**: zero perda de ticket fiscal, rastro de 5 anos, operação não para se ERP cair.
- **Não somos**: RPA, planilha, consultoria custom.
- **Somos**: produto pronto de pesagem local-first, com outbox auditável e conector REST genérico; conectores nativos por ERP seguem a matriz de maturidade.

---

## 2. Persona alvo (primária)

**CFO ou Diretor de Operações** de empresa **Médio BR** (faturamento R$ 50M–R$ 500M/ano).

### Demografia

- 35–55 anos, formado em engenharia, administração ou contábeis.
- 5–15 anos na empresa atual.
- Reporta direto ao CEO; senta em comitê de gestão.
- Já passou por 1+ auditoria fiscal com achados.

### Dores

- "Toda safra/pico, a digitação manual atrasa fechamento."
- "RPA do ano passado quebrou de novo."
- "Auditor pediu rastro de 3 anos atrás e não tenho."
- "Custom interno virou caixa-preta — quem fez saiu."

### Como ele compra

- Lê whitepaper, baixa ROI calc, consulta blog técnico (1ª semana).
- Pede demo + envolve TI (2ª–4ª semana).
- POC com critérios técnicos claros (mês 2).
- Decisão envolve CEO/CFO, TI, fiscal/contábil (mês 2–3).

### Personas secundárias (mencionadas em conteúdo, não foco principal)

- **Diretor de TI** Tier-1: pesa risco técnico, due diligence segurança/LGPD.
- **Gerente fiscal**: foca compliance e rastreabilidade.
- **Sócio PME agro**: foca preço e simplicidade — atendido via auto-serviço.

---

## 3. Tom de voz

**Técnico-conservador. Dados antes de drama. Simetria honesta entre vantagens da Solution Ticket e desvantagens das alternativas.**

### Faça

- Use números com fonte ou disclaimer ("estimativa interna pendente de survey").
- Reconheça quando a alternativa é a escolha certa (ex: RPA para ERP sem API alguma).
- Linguagem técnica precisa (outbox, idempotência, conector) — explicada na primeira menção.
- Voz ativa, frases curtas (≤ 25 palavras na média).

### Evite

- Superlativos sem prova: "revolucionário", "líder absoluto", "o melhor do mercado".
- Promessas de ROI sem case ou disclaimer claro.
- Comparação **nominal** com concorrente sem citar dado público verificável.
- Marketing-speak vazio ("solução end-to-end best-in-class").
- Tom emocional em material executivo (deixar emoção para case de cliente, com aspas).

### Exemplos

- ❌ "A Solution Ticket revolucionou a integração ERP no Brasil."
- ✅ "Solution Ticket entrega outbox transacional auditável e conector REST genérico; conectores nativos só entram na proposta quando homologados."

- ❌ "ROI de 1500% em 3 meses, garantido."
- ✅ "Em cenário típico (cooperativa agro 6.500 pesagens/mês), payback estimado de 5 meses — variável por operação."

---

## 4. Faixa de preço-percepção

**Premium-acessível.**

- Não somos **barato** (não competimos com export CSV grátis).
- Não somos **enterprise corporativo** (não R$ 50k/mês de iPaaS Boomi/MuleSoft).
- Posição: produto profissional acessível para Médio BR, com path natural para Enterprise.

Ancoragem visual: design sóbrio, tipografia limpa, paleta restrita. Evitar visual "barato" (templates Shopify) e "agência luxo" (gradientes excessivos).

---

## 5. Don'ts

| Não fazer                                                                        | Por quê                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------- |
| Prometer ROI sem case                                                            | Risco regulatório + erosão de credibilidade |
| Usar superlativos ("revolucionário", "líder absoluto", "único")                  | Tom de voz técnico-conservador              |
| Comparar nominalmente com concorrente sem dado público                           | Risco jurídico + dano reputacional          |
| Citar cliente real sem autorização escrita                                       | LGPD + contrato                             |
| Mostrar logo de cliente real sem case fechado                                    | Falsa social proof                          |
| Usar emojis em material executivo (one-pager, whitepaper, RFP)                   | Tom técnico-conservador                     |
| Inflar números (5,4× mais barato, 89% economia) sem rodapé "cenário ilustrativo" | Findings da auditoria 10-agentes            |

---

## 6. Identidade visual (placeholder para designer)

> Esta seção é **placeholder** — designer profissional definirá guia visual completo no Q3/26.

### Paleta provisória

- **Primária**: azul corporativo (a definir entre `#1A4D7A` e `#2563EB`).
- **Secundária**: verde sucesso para "depois/resultado" (`#10B981` provisório).
- **Atenção**: vermelho discreto para "antes/dor" (`#DC2626` provisório).
- **Neutros**: cinza escala 50→900 (Tailwind padrão).

### Tipografia provisória

- **Títulos**: sans-serif moderna (Inter, Manrope ou Sora).
- **Corpo**: mesma família, peso 400; tamanho mínimo 14px web, 10pt impresso.
- **Mono** (códigos, IDs): JetBrains Mono ou Fira Code.

### Logo

- Versão horizontal (header) + ícone isolado (favicon, app icon).
- Fundo claro e fundo escuro.
- Espaço de proteção: altura do "S" em volta do logo.

---

## 7. Aplicação por material

| Material              | Tom                  | Densidade técnica |
| --------------------- | -------------------- | ----------------- |
| One-pager executivo   | Sério, dados grandes | Baixa             |
| Whitepaper            | Técnico-conservador  | Alta              |
| Blog SEO              | Didático             | Média             |
| Webinar slides        | Conversacional       | Média             |
| Pitch deck investidor | Visionário sóbrio    | Baixa             |
| RFP / due diligence   | Técnico exaustivo    | Muito alta        |
| Redes sociais         | Curto, dados visuais | Baixa             |

---

## 8. Aprovação e revisão

- Toda peça externa passa por revisão de **1 par** (marketing) + **1 técnico** (PM ou Eng) antes de publicar.
- Revisão de tom de voz: sample mensal de 3 peças, ajustar guideline se desvio.
- Revisão visual completa: a cada 6 meses ou em rebrand.
