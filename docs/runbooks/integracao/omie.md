# Runbook — Conector Omie

**Versão**: 1.0 — 2026-04-26
**Conector**: `omie` (PME cloud)
**Audiência**: Suporte L1 (ST e cliente)
**Modelo base**: ver `docs/runbooks/integracao/bling.md` para estrutura

---

## 1. Visão rápida

| Item       | Valor                           |
| ---------- | ------------------------------- |
| ERP        | Omie ERP cloud                  |
| Auth       | App Key + App Secret no payload |
| Rate limit | 60 req/min por chave            |
| Webhook    | Via relay cloud                 |

---

## 2. Top 10 erros do Omie

### Erro 1 — "Cliente não cadastrado" (`ERR-001`)

**Causa**: CNPJ não está em Clientes do Omie.
**Solução**: cadastrar no Omie → "Sincronizar contatos" → reprocessar.

### Erro 2 — "Produto inativo" (`ERR-002`)

**Causa**: produto está marcado como inativo.
**Solução**: ativar no Omie ou trocar produto no ticket.

### Erro 3 — "App Key/Secret inválidos" (`SOAP-FAULT 401`)

**Causa**: credenciais erradas ou app desativada.
**Solução**: Painel Omie → Apps → ver chave/secret → atualizar no ST.

### Erro 4 — "Limite de requisições" (`SOAP-FAULT-REQ-LIMIT`)

**Causa**: > 60 req/min.
**Solução**: aguardar — sistema retoma automaticamente. Se recorrente: chamar suporte Omie para upgrade.

### Erro 5 — "Pedido já cancelado" (`ERR-PEDIDO-CANCELADO`)

**Causa**: tentando alterar pedido já cancelado.
**Solução**: cancelar evento no ST.

### Erro 6 — "Categoria sem conta corrente" (`ERR-CATEGORIA-CC`)

**Causa**: produto sem categoria financeira configurada.
**Solução**: Omie → Configurações → Categorias → vincular conta. Reprocessar.

### Erro 7 — "Vendedor inválido" (`ERR-VENDEDOR`)

**Causa**: vendedor não cadastrado ou bloqueado no Omie.
**Solução**: cadastrar/desbloquear vendedor; atualizar mapping `user-omie-vendedor`.

### Erro 8 — "Webhook não chega"

**Diagnóstico**:

1. Painel Omie → Webhooks → ver últimos disparos
2. ST: Tela Diagnóstico → Inbound Agent status
   **Solução**: validar URL do relay; rotacionar token se necessário.

### Erro 9 — "Quantidade decimal inválida"

**Causa**: Omie aceita até 4 casas decimais.
**Solução**: validar mapping (já trunca para 4); investigar se algum cliente exigiu mais.

### Erro 10 — "App expirou"

**Causa**: token de app Omie expirou.
**Solução**: gerar nova app no painel Omie; atualizar no ST.

---

## 3. Configuração rápida (cliente novo)

1. Omie → Configurações → Apps → "Criar app"
2. Copiar App Key + App Secret
3. ST: Tela Conectores → "Adicionar Omie" → colar
4. Configurar webhook no Omie apontando para URL do relay
5. "Testar conexão" → verde
6. Mapping default funciona para 80% dos casos

---

## 4. Limitações conhecidas

- Rate limit 60/min — pode estourar em pico
- Sem sandbox oficial — usar conta teste
- App Secret no payload (não header) — exige mascaramento extra
- Webhook depende do plano Omie do cliente

---

## 5. Métricas saudáveis

| Métrica           | Esperado |
| ----------------- | -------- |
| Eventos PENDING   | < 30     |
| Latência média    | < 5s     |
| Taxa erro técnico | < 1%     |
| DLQ               | < 5      |

---

## 6. Referências

- `docs/integracao/contratos/omie.md`
- `docs/integracao/008-runbook-suporte.md`
- developer.omie.com.br
