# Runbook — Conector ContaAzul

**Versão**: 1.0 — 2026-04-26
**Conector**: `conta-azul` (PME cloud)

---

## 1. Visão rápida

| Item       | Valor                                 |
| ---------- | ------------------------------------- |
| ERP        | ContaAzul cloud                       |
| Auth       | OAuth 2.0 Authorization Code + PKCE   |
| Rate limit | ~100 req/min (varia por endpoint)     |
| Webhook    | Limitado (depende do plano ContaAzul) |

---

## 2. Top 10 erros

### Erro 1 — "Cliente não encontrado" (HTTP 404)

**Solução**: cadastrar no ContaAzul → sincronizar → reprocessar.

### Erro 2 — "Produto não encontrado" (HTTP 404)

**Solução**: cadastrar produto + atualizar mapping `product-conta-azul`.

### Erro 3 — "Token expirado" (HTTP 401)

**Solução**: refresh automático tenta uma vez. Se falhar: ST Tela Conectores → "Renovar OAuth" → fluxo de login.

### Erro 4 — "Categoria sem conta corrente" (HTTP 422)

**Causa**: ContaAzul exige categoria financeira vinculada à conta.
**Solução**: ContaAzul → Configurações → Categorias → vincular. Reprocessar.

### Erro 5 — "Tipo de pagamento obrigatório" (HTTP 422)

**Causa**: venda exige forma de pagamento configurada.
**Solução**: cliente configura forma padrão; mapping pode preencher fixo.

### Erro 6 — "PKCE inválido" (HTTP 400)

**Causa**: code_verifier corrompido durante fluxo OAuth.
**Solução**: refazer fluxo de autenticação na UI.

### Erro 7 — "Limite do plano excedido"

**Causa**: ContaAzul tem limites por plano (ex: vendas/mês).
**Solução**: cliente upgrade no ContaAzul.

### Erro 8 — "Personal vs Business mismatch"

**Causa**: tentando criar venda com tipo de pessoa errado.
**Solução**: validar `personType` do cliente no mapping.

### Erro 9 — "Webhook não chega"

**Causa**: plano do cliente não suporta webhook.
**Solução**: usar polling (configurar em mapping); explicar ao cliente.

### Erro 10 — "Validation failed em campo X"

**Solução**: ler `errors[].message` da resposta; ajustar dado.

---

## 3. Configuração rápida (cliente novo)

1. ContaAzul → Configurações → Aplicativos → "Criar app"
2. Adicionar redirect URI: `http://127.0.0.1:3001/api/v1/integration/oauth/callback/conta-azul`
3. Copiar Client ID + Client Secret
4. ST: Tela Conectores → "Adicionar ContaAzul" → colar
5. Login no ContaAzul no popup (fluxo OAuth Code + PKCE)
6. Configurar categoria financeira default
7. "Testar conexão" → verde

---

## 4. Limitações

- OAuth Code interativo — exige cliente clicar no fluxo
- Webhook varia por plano
- API evolui com pouca documentação de breaking changes
- Limite de plano do cliente afeta uso

---

## 5. Métricas saudáveis

| Métrica                  | Esperado |
| ------------------------ | -------- |
| Latência média           | < 3s     |
| Taxa erro técnico        | < 1%     |
| Refresh OAuth automático | Diário   |
| DLQ                      | < 5      |

---

## 6. Referências

- `docs/integracao/contratos/conta-azul.md`
- developers.contaazul.com
