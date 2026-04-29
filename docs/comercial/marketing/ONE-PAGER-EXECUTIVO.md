# One-Pager Executivo — Solution Ticket Integration Hub

**Formato**: especificação para PDF de 1 página, para envio em apresentações comerciais
**Audiência**: CEO, CFO, Diretor de TI, Diretor de Operações
**Versão**: 1.0 — 2026-04-26

---

## Layout do PDF (descrição visual)

### Topo (header — 15% da página)

- Logo Solution Ticket à esquerda
- Tagline à direita: **"O hub de integração ERP que nunca perde um ticket de pesagem"**
- Linha divisória sutil

---

### Bloco 1 — Problema (15% da página, fundo cinza claro)

**Título**: O custo invisível da integração quebrada

3 ícones com números grandes (rodapé com fonte: "Estimativas internas Solution Ticket; survey externa Q4/26. Cf. Sebrae 2024 / Fenacon."):

- 📉 **3-8%** das pesagens com divergência fiscal
- ⏱️ **6h/dia** de digitação manual em pico
- 💸 **R$ 80k/ano** de multas fiscais médias

---

### Bloco 2 — Solução (25% da página)

**Título**: Integração ERP **local-first**, robusta, auditável

**3 colunas**:

**Coluna 1 — Operação não para**

- Outbox transacional local
- Balança fecha mesmo com ERP fora
- Zero perda de ticket

**Coluna 2 — Auditoria operacional auditável**

- Eventos de ticket e integração com hash
- Histórico por usuário, tenant e ticket
- Base para reconciliação e auditoria

**Coluna 3 — Integração com status claro**

- Hoje: outbox + conector REST genérico
- Beta: conector dedicado com aceite técnico
- Roadmap: ERPs nativos por matriz de maturidade

---

### Bloco 3 — Resultados (25% da página, gráfico)

**Título**: Antes vs Depois — caso real (cooperativa agro)

| Métrica               | Antes    | Depois      |
| --------------------- | -------- | ----------- |
| Pesagens perdidas/mês | 12       | **0**       |
| Divergência fiscal    | 4,2%     | **0,3%**    |
| Tempo digitação ERP   | 4h/dia   | **0**       |
| Multas fiscais/ano    | R$ 22k   | **R$ 0**    |
| Custo retrabalho/mês  | R$ 18,5k | **R$ 1,2k** |

**Estatística em destaque (caixa azul)**:

> Pequenas e médias empresas brasileiras gastam em média **3 a 5 dias por mês** em fechamento contábil manual quando integração ERP-operacional é frágil. _Fonte: Fenacon / Sebrae 2024 (consolidado de pesquisas públicas sobre PME BR)._

---

### Bloco 4 — Diferenciais técnicos (15% da página)

**3 ícones + texto curto** (consolidado dos 5 originais):

🔒 **Segurança e compliance**: DPAPI, TLS 1.3, LGPD, auditoria fiscal 5 anos

🔄 **Resiliência local-first**: outbox + retry + DLQ + reconciliação automática

🌐 **Matriz honesta de integração**: REST genérico hoje; conectores nativos somente quando homologados

---

### Bloco 5 — Pricing (15% da página) — apenas faixas

**3 colunas — ranges resumidos**:

**Standard** — incluso na licença base (export CSV/XML manual, best-effort)

**Pro** — a partir de **R$ 297/balança/mês** + conector + setup PME/Médio (API REST, 1 conector nativo, dashboard, SLA 99%)

**Enterprise** — a partir de **R$ 1.497/mês** + balanças + 3+ conectores + setup Tier-1/Global (multi-empresa, SLA 99,5%, 24/7, account manager)

**Pricing completo e setup fees**: ver [`PLANO-COMERCIAL.md`](../PLANO-COMERCIAL.md) §3

---

### Rodapé (10% da página, fundo escuro)

**Próximos passos**:

- 🌐 solution-ticket.com/demo — Agende demo de 30 min
- 📧 contato@solution-ticket.com
- 📞 (XX) XXXX-XXXX
- 📄 Baixe whitepaper "Confiabilidade Fiscal" → solution-ticket.com/wp

---

## Especificação técnica para o designer

### Cores

- Primária: azul Solution Ticket (a definir)
- Secundária: verde para "depois/sucesso"
- Vermelho discreto para "antes/dor"
- Cinza claro para fundos
- Texto: escala de cinzas

### Tipografia

- Títulos: sans-serif moderna (Inter, Manrope)
- Corpo: legível em impressão (size 10pt+)
- Números grandes em destaque: bold, size 28pt+

### Tamanho

- A4 portrait
- Margens 15mm
- Cor para apresentação digital + versão P&B para impressão

### Versões

- Geral (este)
- Por segmento (agro, indústria, logística, distribuição) — adaptar bloco 3
- Em inglês (para Tier-1 global) — futuro

---

## Métricas de uso

- Distribuído em: feiras, eventos, primeira reunião comercial
- Backup digital: anexo de e-mail outbound
- Versão impressa: estoque de 500 unidades

## Atualização

- Trimestral (números de cases evoluem)
- Sincronizado com PLANO-COMERCIAL.md
