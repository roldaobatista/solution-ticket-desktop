# Runbook — Conector Bling

**Versão**: 1.0 — 2026-04-26
**Conector**: `bling` (PME cloud)
**Audiência**: Suporte L1 (ST e cliente)
**Tempo médio de diagnóstico**: < 10 min

---

## 1. Visão rápida

| Item                    | Valor                          |
| ----------------------- | ------------------------------ |
| ERP                     | Bling v3                       |
| Auth                    | OAuth 2.0 + refresh            |
| Rate limit              | 3 req/s rígido                 |
| Webhook                 | Via relay cloud                |
| Status do conector (UI) | Tela Conectores → "bling-prod" |

---

## 2. Ações rápidas (1 min)

| Quero...                | Faça...                                      |
| ----------------------- | -------------------------------------------- |
| Ver se conector está OK | Tela Conectores → status verde               |
| Testar conexão agora    | Botão "Testar conexão" no perfil             |
| Ver últimos eventos     | Tela Eventos → filtro `connector=bling`      |
| Reprocessar evento      | Tela Eventos → linha → "Reprocessar"         |
| Forçar refresh do token | Tela Conectores → "Renovar token OAuth"      |
| Ver fila atual          | Tela Eventos → filtro `status=PENDING`       |
| Exportar diagnóstico    | Tela Diagnóstico → "Exportar Support Bundle" |

---

## 3. Top 10 erros do Bling

### Erro 1 — "Cliente não encontrado"

**Mensagem**: `PARTNER_NOT_FOUND` / "Contato com CNPJ X não encontrado"

**Causa**: CNPJ no ticket não tem contato correspondente no Bling.

**Solução**:

1. Bling → Cadastros → Contatos → cadastrar com CNPJ
2. ST: Tela Conectores → "Sincronizar contatos"
3. Tela Eventos → "Reprocessar"

---

### Erro 2 — "Produto não mapeado"

**Mensagem**: `LOOKUP_KEY_MISSING table=product-bling`

**Causa**: produto local sem equivalente cadastrado.

**Solução**:

1. ST: Tela Mapeamento → tabela `product-bling`
2. Adicionar: código local → código Bling
3. "Reprocessar"

---

### Erro 3 — "Token OAuth expirado"

**Mensagem**: `FAILED_TECHNICAL` HTTP 401

**Causa**: refresh automático falhou.

**Solução**:

1. Tela Conectores → "bling-prod" → "Renovar token OAuth"
2. Login no popup do Bling com usuário do cliente
3. Salvar
4. Eventos pendentes serão reprocessados

---

### Erro 4 — "Rate limit (3 req/s)"

**Mensagem**: `WAITING_RETRY` HTTP 429

**Causa**: pico de pesagens > 3/s.

**Solução**:

- **Não fazer nada** — sistema retoma sozinho
- Se persistir > 30 min: avaliar plano superior do Bling
- Tickets fiscais são priorizados sobre cadastros

---

### Erro 5 — "Pedido encerrado no Bling"

**Mensagem**: `FAILED_BUSINESS` "situação não permite alteração"

**Causa**: pedido foi encerrado no Bling após pesagem.

**Solução**:

1. Confirmar com cliente se foi intencional
2. Bling → reabrir pedido OU cancelar evento ST
3. Reprocessar

---

### Erro 6 — "Webhook não chega"

**Sintoma**: alterações no Bling não refletem no ST.

**Diagnóstico**:

1. Bling → Configurações → Webhooks → ver se URL está correta
   ```
   https://relay.solution-ticket.com/webhook/bling/<tenant-id>
   ```
2. Bling → Webhooks → ver últimos disparos (sucesso?)
3. ST: Tela Diagnóstico → status do "Inbound Agent" → deve ser `connected`

**Solução**:

- URL errada: corrigir no Bling
- Agent desconectado: reiniciar ST
- Token relay expirado: rotacionar via admin

---

### Erro 7 — "Quantidade inválida"

**Mensagem**: HTTP 400 "quantidade deve ser maior que zero"

**Causa**: peso líquido = 0 ou negativo.

**Solução**:

1. Verificar pesagem original
2. Se erro de balança: corrigir ticket (gera evento de correção)
3. Se intencional (cancelamento): cancelar evento

---

### Erro 8 — "Vendedor não encontrado"

**Mensagem**: `LOOKUP_KEY_MISSING table=user-bling-vendedor`

**Causa**: usuário ST sem mapeamento para vendedor Bling.

**Solução**:

1. Bling: confirmar vendedor existente
2. ST: Tela Mapeamento → `user-bling-vendedor` → adicionar
3. Reprocessar

---

### Erro 9 — "Permissão insuficiente da app Bling"

**Mensagem**: HTTP 403 / `INSUFFICIENT_SCOPE`

**Causa**: app criada no Bling sem escopo necessário.

**Solução**:

1. Bling → Configurações → Apps → editar app ST
2. Habilitar escopos: Pedidos, Contatos, Produtos
3. Regenerar credenciais (gera novo OAuth flow)
4. Atualizar no ST

---

### Erro 10 — "Erro 500 do Bling"

**Mensagem**: `WAITING_RETRY` HTTP 500

**Causa**: indisponibilidade temporária do Bling.

**Solução**:

- Sistema retoma automaticamente
- Se persistir > 30 min: ver status.bling.com.br
- Se Bling confirma OK mas erro continua: escalar para L2 do ST

---

## 4. Cenários de incidente

### 4.1 Bling fora do ar (P1)

**Sintoma**: muitos eventos `WAITING_RETRY` HTTP 5xx.

**Ação**:

1. Confirmar via status.bling.com.br
2. Comunicar cliente: "operação não para; sincronia retoma quando Bling voltar"
3. Aguardar; sistema retoma sozinho
4. Quando voltar: reconciliar para garantir consistência

### 4.2 DLQ acima de 50 itens

**Ação**:

1. Tela Eventos → filtro DLQ → analisar padrão
2. Geralmente: cadastro faltando ou token expirado
3. Corrigir causa raiz; reprocessar lote

### 4.3 Conector marcado `down` por > 5 min

**Ação**:

1. Healthcheck automático falhando
2. Verificar conexão internet
3. Verificar credenciais (talvez rotacionadas no Bling)
4. Forçar "Testar conexão"
5. Se falhar: rotação manual de OAuth

---

## 5. Permissões necessárias no Bling

App ST no Bling precisa de:

- **Pedidos de venda**: leitura + escrita
- **Contatos**: leitura
- **Produtos**: leitura
- **Vendedores**: leitura
- **Webhooks**: configuração

---

## 6. Métricas saudáveis

| Métrica                           | Esperado                                |
| --------------------------------- | --------------------------------------- |
| Eventos PENDING                   | < 20                                    |
| Tempo médio fechamento → Bling    | < 5s (limitado pelo rate limit 3 req/s) |
| Taxa de erro técnico              | < 1%                                    |
| DLQ                               | < 5 itens                               |
| Taxa de sucesso no primeiro envio | > 95%                                   |

---

## 7. Quando escalar

**Para L2 do ST**:

- Erro fora do top 10
- Padrão de erro novo
- Performance degradada sem causa clara

**Para diretoria/comercial**:

- Cliente pedindo cancelamento
- Bug de produto (não de cadastro)
- P0 com impacto > 1 cliente

---

## 8. Configuração rápida (cliente novo)

1. Bling → Configurações → Apps → Criar nova app
2. Escopos: Pedidos, Contatos, Produtos, Webhooks
3. Copiar Client ID e Client Secret
4. ST: Tela Conectores → "Adicionar conector" → Bling
5. Colar Client ID/Secret → "Conectar"
6. Login no Bling no popup
7. Configurar mapping (template padrão funciona para 80% dos casos)
8. Configurar webhook no Bling apontando para URL do relay (mostrada na UI ST)
9. "Testar conexão" → deve retornar verde
10. Pronto para receber primeira pesagem

---

## 9. Limitações conhecidas

- Rate limit 3 req/s — não negociável com Bling
- Webhook delivery não tem retry nativo do Bling — relay supre isso
- Sem sandbox oficial — usar prefixo `[TESTE]` em cadastros de homologação
- Pedido cancelado fica visível no Bling (histórico) — não some

---

## 10. Referências

- `docs/integracao/contratos/bling.md` — contrato técnico
- `docs/integracao/008-runbook-suporte.md` — runbook geral
- developer.bling.com.br — docs oficiais
- status.bling.com.br — status do Bling
