# ADR-008: Relay Cloud para webhooks entrantes

**Status**: Aprovada (componente cloud separado, escopo Fase 1)
**Data**: 2026-04-26

## Contexto

ERPs cloud (Bling, Omie, ContaAzul, SAP S/4, Dynamics) enviam webhooks para notificar mudanças (cliente bloqueado, pedido liberado, NF emitida). O backend do Solution Ticket é restrito a `127.0.0.1` (ver ADR-006), portanto **não pode receber webhooks diretamente**.

## Decisão

Implementar **Relay Cloud** como componente separado:

```
ERP cloud → Relay Cloud (HTTPS público) → fila → Agent local faz poll → SQLite
```

### Componentes

1. **Relay endpoint** (cloud): recebe webhook do ERP, valida assinatura HMAC do ERP, persiste em fila durável (Redis/SQS) por tenant
2. **Agent local** (no Solution Ticket): faz long-polling no relay (ex: a cada 5s) usando credencial específica do tenant
3. **Inbox local**: agent grava na tabela `integracao_inbox` com idempotency key

### Stack sugerido

- **Cloud**: Cloudflare Workers + KV (baixo custo, escalável, latência baixa BR)
- **Auth**: token por tenant (rotativo) + assinatura HMAC validada no relay
- **Retenção**: 7 dias na fila (suficiente para tenant offline reconectar)

### Escopo

Componente é desenvolvido na **Fase 1** junto com o primeiro conector cloud (Bling). Antes disso, conectores usam apenas polling.

## Consequências

### Positivas

- Backend continua restrito a localhost (ADR-006 preservada)
- Cliente não precisa configurar firewall
- Latência aceitável (long-polling 5s)
- Custo baixo (Cloudflare Workers free tier cobre milhares de tenants)

### Negativas

- Componente cloud novo para operar (custo, monitoramento, SLA)
- Dependência externa: se relay cair, eventos atrasam (mitigado por retenção 7d)
- Tenant precisa de internet — quando offline, eventos aguardam reconexão

## Alternativas consideradas

- **Cliente abre porta pública**: rejeitada (ADR-006)
- **Webhook direto para iPaaS do cliente**: aceitável quando cliente tem; relay continua como padrão
- **Polling sem relay**: usado quando ERP suporta API de "delta desde X"; preferível quando possível por ser mais simples

## Riscos

- **Custo cloud não previsto** se base de tenants crescer rápido → revisar tier mês 12
- **Compliance LGPD**: relay armazena payload temporariamente — assinar DPA com Cloudflare; região europeia/BR
- **Vazamento de token de tenant**: rotação automática + monitoramento de tráfego anômalo

## Referências

- `docs/integracao/ESTRATEGIA-RELAY-CLOUD.md` (especificação completa)
- `docs/GUIA-INTEGRACAO-ERP.md` seção 8.7
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 17 risco R14
