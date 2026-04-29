# 008 — Runbook de Suporte do Hub de Integração

**Versão**: 1.0 — 2026-04-26
**Audiência**: equipe de suporte L1/L2 da Solution Ticket + suporte L1 do cliente
**Critério de sucesso**: suporte responde "qual ticket falhou e por quê" em < 10 min

---

## 1. Estrutura de suporte

| Nível        | Escopo                            | Tempo de resposta   |
| ------------ | --------------------------------- | ------------------- |
| L1 (cliente) | Operação diária, top 10 erros     | Imediato            |
| L1 (ST)      | Suporte ao cliente, casos comuns  | < 4h business hours |
| L2 (ST)      | Casos técnicos, mapping, conector | < 1 dia útil        |
| L3 (ST)      | Bug do produto, P0/P1             | Conforme SLA        |

---

## 2. Diagnóstico em < 10 minutos

Quando cliente abre chamado "ticket não chegou no ERP":

### 2.1 Coletar informação

- Número do ticket local
- Placa do veículo
- Data/hora aproximada
- Qual ERP

### 2.2 Buscar correlation ID

1. Tela de Eventos → filtro por número de ticket
2. Identificar evento → copiar correlation ID
3. Em paralelo: identificar status do evento

### 2.3 Diagnosticar pelo status

| Status do evento        | O que significa                         | Ação                                                     |
| ----------------------- | --------------------------------------- | -------------------------------------------------------- |
| `PENDING`               | Aguardando worker                       | Verificar se worker está rodando; reinício se necessário |
| `PROCESSING`            | Em execução agora                       | Aguardar 1 min; se persistir, ver logs                   |
| `WAITING_RETRY`         | Falhou tecnicamente, vai tentar de novo | Ver `lastError`; aguardar `nextRetryAt`                  |
| `FAILED_BUSINESS` (DLQ) | Erro de negócio, exige ação             | Ver seção 4                                              |
| `DEAD_LETTER`           | Excedeu tentativas                      | Ver seção 5                                              |
| `SENT`                  | Enviado, aguardando confirmação         | Ver se ERP confirmou; ver inbox                          |
| `CONFIRMED`             | Tudo certo                              | Conferir se cliente está olhando lugar errado no ERP     |
| `CANCELLED`             | Cancelado pelo operador                 | Ver justificativa                                        |
| `IGNORED`               | Ignorado com justificativa              | Ver justificativa                                        |

### 2.4 Extrair logs por correlation ID

```
GET /api/v1/integration/events?correlationId=<uuid>
```

Retorna timeline completa: enqueue → processing → tentativas → resultado.

---

## 3. Top 10 erros e soluções

### Erro 1 — "Cliente não encontrado no ERP"

**Sintoma**: status `FAILED_BUSINESS`, mensagem "PARTNER_NOT_FOUND"
**Causa**: CNPJ no ticket não existe no ERP
**Solução**:

1. Cadastrar cliente no ERP
2. Aguardar próximo pull (ou forçar via UI)
3. Reprocessar evento

### Erro 2 — "Produto não mapeado"

**Sintoma**: `LOOKUP_KEY_MISSING` em mapping
**Causa**: tabela de equivalência não tem entrada para esse produto
**Solução**:

1. Tela Mapeamento → Tabela `product-erp-mapping`
2. Adicionar entrada
3. Reprocessar evento

### Erro 3 — "Token OAuth expirado"

**Sintoma**: `FAILED_TECHNICAL`, HTTP 401
**Causa**: refresh automático falhou
**Solução**:

1. Tela Conectores → editar conector
2. Regenerar credencial (passo a passo no ERP)
3. Salvar; retry automaticamente

### Erro 4 — "Rate limit excedido"

**Sintoma**: `WAITING_RETRY`, HTTP 429
**Causa**: muitas pesagens em pouco tempo
**Solução**:

1. Aguardar — sistema retoma sozinho
2. Se recorrente: avaliar upgrade de plano do ERP
3. Em pico de safra: priorizar tickets fiscais (config de conector)

### Erro 5 — "Pedido encerrado"

**Sintoma**: `FAILED_BUSINESS`, status do pedido inválido
**Causa**: pedido fechou no ERP antes de receber a pesagem
**Solução**:

1. Conferir com cliente se foi intencional
2. Cancelar evento (não vai retornar)
3. Ou: pedir reabertura do pedido no ERP, depois reprocessar

### Erro 6 — "Quantidade excedida"

**Sintoma**: `FAILED_BUSINESS`, "QUANTITY_EXCEEDED"
**Causa**: peso líquido > saldo do contrato/pedido
**Solução**:

1. Conferir se peso está correto na balança
2. Se correto: pedir aumento de saldo no ERP
3. Reprocessar

### Erro 7 — "Timeout do ERP"

**Sintoma**: `WAITING_RETRY`, "ETIMEDOUT"
**Causa**: ERP lento ou rede instável
**Solução**:

1. Sistema retoma sozinho com backoff
2. Se persistir: ver dashboard do ERP / status público
3. Escalar para L2 se ERP confirma estar OK mas timeout continua

### Erro 8 — "Certificado vencido"

**Sintoma**: `FAILED_TECHNICAL`, erro TLS
**Causa**: certificado A1 expirou
**Solução**:

1. Cliente renova certificado
2. Upload via Tela Conectores
3. Retry automático

### Erro 9 — "Evento órfão (PROCESSING > 10min)"

**Sintoma**: evento travado em `PROCESSING`
**Causa**: worker crashou no meio
**Solução**:

- Recovery automático em 10 min
- Forçar via UI: botão "Recovery"
- Investigar causa do crash via logs

### Erro 10 — "Webhook não chegou"

**Sintoma**: cliente esperava notificação que não veio
**Causa**: relay cloud, agent local, ou ERP não enviou
**Solução**:

1. Verificar agent local (Tela Diagnóstico → status do relay)
2. Verificar painel Bling/ERP — webhook foi disparado?
3. Verificar fila no relay (admin API)
4. Reconfigurar URL se preciso

---

## 4. Eventos em DLQ

### 4.1 Investigar

1. Tela Eventos → filtro `status = DEAD_LETTER`
2. Para cada evento:
   - Ler `lastError` e `lastErrorCategory`
   - Decidir: reprocessar / cancelar / ignorar

### 4.2 Reprocessar (após corrigir causa)

- Botão "Reprocessar" → status volta para `PENDING`
- Worker pega na próxima rodada

### 4.3 Cancelar

- Botão "Cancelar" → status `CANCELLED`
- Não envia mais; ticket fica registrado localmente

### 4.4 Ignorar com justificativa

- Botão "Ignorar" → exige texto de justificativa
- Status `IGNORED` (terminal)
- Auditoria registra quem ignorou e quando

---

## 5. Cenários de incidente

### 5.1 ERP fora do ar (P1)

**Sintoma**: muitos eventos em `WAITING_RETRY` simultâneos

**Ação imediata**:

1. Confirmar status do ERP (página de status, suporte)
2. Comunicar cliente: "operação não para; eventos vão sincronizar quando ERP voltar"
3. Monitorar DLQ
4. Quando ERP voltar: verificar se retry automático limpou; se não, intervenção manual

**Pós-incidente**:

- Reconciliação para garantir consistência

### 5.2 DLQ acima de 100 itens (P1)

**Sintoma**: alerta automático

**Ação**:

1. Identificar padrão: erro comum?
2. Se sim: corrigir causa raiz (mapping, cadastro, etc.)
3. Reprocessar lote
4. Se não: triagem manual item a item

### 5.3 Solution Ticket trava (P0)

**Sintoma**: aplicação não responde

**Ação imediata**:

1. **Operação local da balança continua** (independente do hub)
2. Reiniciar aplicação
3. Verificar `integration.log` por exceção
4. Eventos em `PROCESSING` voltam para `PENDING` em 10 min
5. Escalar para L3 com support bundle

### 5.4 Vazamento de credencial (P0)

**Sintoma**: cliente reporta acesso indevido ao ERP

**Ação**:

1. Rotação imediata da credencial
2. Auditoria de acesso (quem viu payload nas últimas 24h?)
3. Notificar cliente formalmente
4. Post-mortem em 48h
5. Notificação LGPD se aplicável

---

## 6. Support bundle

### 6.1 O que contém

- Versão do produto e do conector
- Configuração do conector (sem credenciais)
- Mapping ativo
- Últimos N logs filtrados por correlation ID
- Métricas das últimas 24h
- Resultado de teste de conexão atual
- Status de fila (pending/processing/dlq)

### 6.2 Como gerar

- Tela Diagnóstico → "Exportar Support Bundle"
- Gera ZIP em `~/Downloads/`
- Cliente envia ao suporte ST

### 6.3 Análise no L2

- Abrir ZIP
- Buscar correlation ID problemático
- Ler timeline
- Confirmar configuração não tem segredo (validar)

---

## 7. Métricas para o dia a dia

Olhar todo dia (5 min):

| Métrica              | Esperado | Ação se fora             |
| -------------------- | -------- | ------------------------ |
| Eventos PENDING      | < 50     | Verificar worker rodando |
| Idade do mais antigo | < 1h     | Investigar gargalo       |
| DLQ                  | < 10     | Triagem                  |
| Conectores `down`    | 0        | Investigar imediato      |
| Latência p95         | < 2s     | Ver gráfico, escalar L2  |

---

## 8. Comunicação com cliente

### 8.1 Tom

- Direto, sem jargão
- Sempre dar prazo (mesmo que aproximado)
- Confirmar entendimento antes de agir
- Não culpar (ERP, cliente, infra) sem evidência

### 8.2 Templates de resposta

Em `docs/comercial/EMAIL-TEMPLATES.md` (a criar).

### 8.3 Quando escalar

- L1 → L2: erro técnico que não está no top 10
- L2 → L3: bug do produto suspeito
- Qualquer nível → diretoria: P0 com impacto > 1 cliente

---

## 9. Treinamento

Suporte L1 do ST e do cliente devem dominar:

- [ ] Top 10 erros e soluções
- [ ] Como buscar evento por correlation ID
- [ ] Como gerar support bundle
- [ ] Como reprocessar/cancelar/ignorar
- [ ] Como ler painel de métricas
- [ ] Quando escalar

Treinamento inicial: 4h. Reciclagem trimestral.

---

## 10. Continuous improvement

### 10.1 Após cada incidente

- Post-mortem em 48h
- Atualizar runbook se erro novo aparecer
- Atualizar mascaramento se vazou algo
- Atualizar alertas se demorou para detectar

### 10.2 Mensalmente

- Revisar top 10 erros (eles mudam)
- Atualizar este documento
- Treinar time em casos novos

---

## 11. Referências

- `docs/integracao/004-outbox-inbox-retry.md` — fila e estados
- `docs/integracao/005-seguranca-credenciais.md` — segurança
- `docs/runbooks/integracao/<erp>.md` — runbook por ERP
- ADR-002 e ADR-008
