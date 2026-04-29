# Runbook — Conector Sankhya

**Versão**: 1.0 — 2026-04-26
**Conector**: `sankhya` (Médio BR)

---

## 1. Visão rápida

| Item    | Valor                                    |
| ------- | ---------------------------------------- |
| ERP     | Sankhya OM                               |
| Auth    | JWT via login (`MobileLoginSP.login`)    |
| Refresh | Sem refresh nativo — re-login automático |
| Webhook | Não tem nativo — polling 5–15min         |

---

## 2. Top 10 erros

### Erro 1 — "Sessão inválida" (HTTP 401)

**Causa**: JWT expirou ou foi invalidado.
**Solução**: re-login automático tenta uma vez. Se falhar: validar credenciais.

### Erro 2 — "Parceiro bloqueado" (`MGECOM-XXX`)

**Causa**: parceiro com `BLOQUEAR=S`.
**Solução**: Sankhya → desbloquear → reprocessar.

### Erro 3 — "Saldo insuficiente em pedido"

**Causa**: TGFCAB com saldo < quantidade do ticket.
**Solução**: aumentar saldo OU dividir em múltiplas pesagens.

### Erro 4 — "TOP inválida"

**Causa**: tipo de operação (CODTIPOPER) não configurada para movimento de pesagem.
**Solução**: cadastrar TOP no Sankhya; atualizar mapping `negotiation-type-pesagem`.

### Erro 5 — "Produto não cadastrado" (`MGECOM-PROD-NOTFOUND`)

**Causa**: CODPROD não existe.
**Solução**: cadastrar TGFPRO; atualizar mapping `product-sankhya`.

### Erro 6 — "Empresa não autorizada"

**Causa**: usuário sem permissão para CODEMP.
**Solução**: Sankhya → Configurações → permissões → liberar.

### Erro 7 — "Período fechado"

**Causa**: tentando lançar movimento em período contábil fechado.
**Solução**: solicitar abertura ao financeiro do cliente; reprocessar.

### Erro 8 — "Cluster busy"

**Causa**: alta carga no cluster Sankhya.
**Solução**: backoff automático; sistema retoma.

### Erro 9 — "Polling não traz alterações"

**Causa**: campo `LASTUPDATE` ou `DTALTER` não atualizado pelo Sankhya.
**Solução**: validar configuração de auditoria no Sankhya; usar campo alternativo.

### Erro 10 — "Campo AD\_\* obrigatório vazio"

**Causa**: customização do cliente exige campo `AD_*` específico.
**Solução**: adicionar ao mapping; revisar contrato técnico.

---

## 3. Configuração rápida (cliente novo)

1. Sankhya → criar usuário dedicado para integração
2. Conceder permissões: TGFCAB, TGFITE, TGFPAR, TGFPRO (leitura/escrita)
3. ST: Tela Conectores → Sankhya → URL + usuário + senha
4. Mapeamento de TOP de pesagem (obrigatório por cliente)
5. Mapeamento de tabelas de equivalência
6. "Testar conexão" → verde

---

## 4. Limitações

- Sem refresh de token (re-login)
- Sem webhook nativo
- Mapping varia muito por cliente (campos AD\_\*)
- Sandbox depende de parceria Sankhya

---

## 5. Métricas saudáveis

| Métrica             | Esperado                       |
| ------------------- | ------------------------------ |
| Latência média      | < 4s                           |
| Taxa erro técnico   | < 2% (cluster lento ocasional) |
| Re-login frequência | < 1/dia                        |
| DLQ                 | < 10                           |

---

## 6. Referências

- `docs/integracao/contratos/sankhya.md`
- docs.sankhya.com.br
