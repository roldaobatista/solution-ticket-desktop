# Runbook — Conector TOTVS Protheus

**Versão**: 1.0 — 2026-04-26
**Conector**: `totvs-protheus` (Tier-1 BR)

> ⚠️ Cliente Protheus customizado: cada erro pode ter sabor próprio. Este runbook cobre os top 10 padrão.

---

## 1. Visão rápida

| Item       | Valor                                 |
| ---------- | ------------------------------------- |
| ERP        | TOTVS Protheus (12.1 / Harpia)        |
| Auth       | Token via login + escopo              |
| Webhook    | Sem nativo — polling com checkpoint   |
| Rate limit | Depende do dimensionamento do cliente |

---

## 2. Top 10 erros

### Erro 1 — "Cliente bloqueado (A1_MSBLQL=1)"

**Solução**: SA1 → desbloquear → reprocessar.

### Erro 2 — "Produto bloqueado (B1_MSBLQL=1)"

**Solução**: SB1 → desbloquear → reprocessar.

### Erro 3 — "Pedido encerrado"

**Causa**: SC7 (compra) ou SC5 (venda) com status fechado.
**Solução**: reabrir pedido OU cancelar evento ST.

### Erro 4 — "Saldo insuficiente em pedido"

**Causa**: quantidade ticket > saldo restante.
**Solução**: aumentar quantidade do PO OU dividir pesagem.

### Erro 5 — "Período fechado (MM_PERIODS)"

**Causa**: tentando lançar em período contábil já fechado.
**Solução**: financeiro reabre período; reprocessar.

### Erro 6 — "Lock de tabela"

**Causa**: outra transação bloqueou SD1/SD2.
**Solução**: retry automático normalmente resolve.

### Erro 7 — "Sessão expirada"

**Causa**: token Protheus expirou.
**Solução**: re-login automático; se falhar, validar credenciais.

### Erro 8 — "Validação ADVPL customizada"

**Causa**: cliente tem validação Z\* específica que rejeita movimento.
**Solução**: investigar regra com consultor Protheus; ajustar payload ou regra.

### Erro 9 — "Filial inválida"

**Causa**: D1_FILIAL não existe.
**Solução**: validar mapping `unit-protheus-filial`.

### Erro 10 — "Campo AD\_\* obrigatório vazio"

**Causa**: customização exige campo customizado.
**Solução**: adicionar ao mapping (ver contrato técnico do cliente).

---

## 3. Cenários de incidente Protheus-específicos

### 3.1 Protheus update (release nova) quebra integração

1. Suspender push automaticamente
2. Validar contratos via teste em sandbox
3. Ajustar mapping/client se mudou
4. Re-homologar parcial

### 3.2 Servidor Protheus do cliente lento (carga alta)

1. Aumentar timeout do conector
2. Reduzir concorrência de worker (de 10 para 5)
3. Negociar com cliente: avaliar dimensionamento

### 3.3 Customização Z\* nova adicionada

1. Cliente avisa (idealmente com 30 dias)
2. Atualizar mapping
3. Testar em sandbox
4. Hotfix produção

---

## 4. Configuração rápida (cliente novo)

> Nota: Protheus exige **onboarding técnico pago** (R$ 8.000+). Não é self-service.

1. Cliente provê acesso a sandbox Protheus
2. Time ST faz Discovery (1–3 semanas)
3. Mapping customizado pelo time (1–2 semanas)
4. Homologação assistida (4 semanas)
5. Modo Sombra (2 semanas)
6. GA

---

## 5. Limitações

- Sem webhook nativo (polling)
- Mapping nunca é genérico (sempre customizar)
- Performance varia por dimensionamento do cliente
- Programa de parceria TOTVS recomendado

---

## 6. Métricas saudáveis

| Métrica           | Esperado |
| ----------------- | -------- |
| Latência média    | < 5s     |
| Taxa erro técnico | < 2%     |
| Polling lag       | < 5min   |
| DLQ               | < 10     |

---

## 7. Referências

- `docs/integracao/contratos/totvs-protheus.md`
- api.totvs.com.br (Harpia)
- TOTVS Partner Program
