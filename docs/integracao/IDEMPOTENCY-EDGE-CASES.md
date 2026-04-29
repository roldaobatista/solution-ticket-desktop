# Idempotency Edge Cases — Modulo Integracao ERP

> Owner: Tech Lead. Insumos: 004-outbox-inbox-retry.md, 002-modelo-canonico.md, 006-mapping-engine.md.
> Status: edge cases identificados na **auditoria R2**. Cada caso tem solucao + sequencia de reconciliacao documentada.

## 1. Contexto

Idempotencia no envio para ERP usa chave composta:

```
tenant:empresa:unidade:ticket:revision
```

Esta chave funciona no caminho feliz, mas **falha em edge cases reais** detectados na auditoria. Documentar e tratar.

## 2. Edge cases

### 2.1 Cancelamento + recriacao com mesmo ticket id

- **Cenario**: usuario cancela ticket #1234 e depois recria com mesmo numero (sequencia legal de cancelamento de pesagem).
- **Problema**: chave de idempotencia colide -> inbox ERP rejeita como duplicata, ticket recriado nao aparece.
- **Solucao**: **revision bump explicito** (`revision = N+1`). Chave fica:
  - Original: `acme:matriz:fil01:1234:1`
  - Cancelamento: `acme:matriz:fil01:1234:1:cancel`
  - Recriacao: `acme:matriz:fil01:1234:2`
- **Implementacao**: model canonico ja tem `revision` (incrementado a cada modificacao). Cancelamento gera evento `TicketCancelado` com sufixo `:cancel`.

### 2.2 Reprocessamento manual via DLQ (Dead Letter Queue)

- **Cenario**: evento falhou apos N retries automaticos, foi para DLQ; operador re-envia manualmente.
- **Problema**: chave original colide se ERP ja processou parcialmente (status incerto).
- **Solucao**: chave herda original + sufixo `:reproc:N`:
  - Original: `acme:matriz:fil01:1234:1`
  - Reproc 1: `acme:matriz:fil01:1234:1:reproc:1`
  - Reproc 2: `acme:matriz:fil01:1234:1:reproc:2`
- **Implementacao**: comando "Reprocessar" da DLQ incrementa contador `:reproc:N` e mantem rastreabilidade. Inbox ERP trata `:reproc:*` como evento independente, mas log liga ao original.

### 2.3 Re-envio apos restauracao de backup (eventos ja em ERP)

- **Cenario**: SQLite local corrompe, restaura-se backup de 2h atras. Eventos das ultimas 2h ja foram entregues ao ERP, mas outbox local nao sabe -> re-envia.
- **Problema**: ERP recebe duplicata. Sem inbox-side dedup, vira double-booking de pesagens.
- **Solucao**: **inbox detecta e marca como duplicate**:
  - Inbox ERP mantem tabela `inbox_processed_keys` com TTL longo (>=30 dias).
  - Re-envio com chave ja vista -> retorna 200 OK + flag `duplicate=true` (idempotent ack).
  - Outbox local atualiza status como `delivered (via inbox dedup)`.
- **Implementacao**: documentado em 004-outbox-inbox-retry.md. Sequencia de reconciliacao:
  1. Outbox marca evento como pendente apos restore.
  2. Re-envia.
  3. Inbox responde 200 + duplicate flag.
  4. Outbox atualiza status, gera log de auditoria "evento ja entregue antes do restore".

### 2.4 Mudanca de mapping com conector ativo

- **Cenario**: cliente edita mapping (ex: campo `cliente.codigo` agora vem de outra coluna). Eventos pendentes na outbox foram criados com mapping antigo.
- **Problema**: chave de idempotencia inclui hash do mapping. Mapping muda -> hash muda -> chave muda. ERP recebe **mesmo evento de negocio com chave nova**, processa como duplicata legitima.
- **Solucoes (em ordem de preferencia)**:
  1. **Drain antes de aplicar mapping novo**: bloquear novo mapping ate outbox zerar (>=15min sem pendentes). UI avisa "Aguardando 12 eventos pendentes serem entregues antes de salvar mapping novo".
  2. **Mapping versionado**: cada evento na outbox carrega versao do mapping com que foi gerado (`mapping_version: 17`). Re-processamento usa mesma versao. Nova versao so se aplica a eventos novos.
  3. **Reconciliacao manual**: se duplicata for detectada no ERP apos mudanca, runbook orienta operador a marcar evento como ignorar.
- **Implementacao recomendada**: opcao 1 (drain) + opcao 2 (versao) combinadas. Documentar trade-off no runbook.

## 3. Tabela resumo

| Caso                     | Chave gerada                | Detectado por              | Acao             |
| ------------------------ | --------------------------- | -------------------------- | ---------------- |
| Cancelamento + recriacao | `:cancel` + `revision N+1`  | Modelo canonico (revision) | Automatico       |
| Reproc DLQ               | `:reproc:N`                 | Comando "Reprocessar"      | Manual + log     |
| Restore backup           | igual original              | Inbox dedup table          | Automatico, log  |
| Mudanca de mapping       | hash novo (mapping_version) | Drain + versionamento      | Bloqueante na UI |

## 4. Sequencia de reconciliacao geral

Para qualquer edge case, sequencia padrao:

1. **Detectar** divergencia (outbox vs inbox status).
2. **Logar** evento de auditoria (origem, chave, motivo).
3. **Reconciliar**:
   - Se inbox tem evento -> outbox marca delivered.
   - Se inbox nao tem -> re-enviar (ate N retries).
4. **Notificar** operador via UI se reconciliacao manual for necessaria (apos N retries).
5. **Relatorio diario** (runbook): listagem de eventos reconciliados, com causa raiz.

## 5. Testes obrigatorios

Cobrir em test suite (CONTRACT-TESTING.md):

- [ ] Cancelamento + recriacao de ticket com mesmo id.
- [ ] Reproc via DLQ apos N falhas.
- [ ] Restore backup (simulado: limpar outbox local, replay).
- [ ] Mudanca de mapping com 10+ eventos pendentes.
- [ ] Combinacao: restore + mapping mudou no intervalo.

## 6. Referencia

- 004-outbox-inbox-retry.md secao "Idempotency keys".
- 002-modelo-canonico.md campo `revision`.
- 006-mapping-engine.md secao "Versionamento de mappings".
