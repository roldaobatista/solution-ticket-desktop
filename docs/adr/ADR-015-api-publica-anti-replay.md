# ADR-015: Anti-replay obrigatório na API pública `:3002`

**Status**: Aprovada (resolve achado HIGH da Rodada 5 — Agente 2 Segurança)
**Data**: 2026-04-27
**Cross-link**: ADR-013 (separação de portas), `005-seguranca-credenciais.md` §7.

## Contexto

ADR-013 separou a API pública (`:3002`) do backend interno (`:3001`) por
defesa em profundidade. Porém, ADR-013 **não definiu requisitos de
anti-replay** para a API pública: até agora apenas o webhook entrante (doc
005 §7) exigia HMAC + janela de timestamp. Auditoria Rodada 5 (Agente 2)
apontou que isso permite a um atacante com posse efêmera de uma request
assinada (proxy, log, intercepção LAN) repeti-la indefinidamente dentro do
TTL do token.

A janela de timestamp sozinha **não impede replay dentro da janela**.

## Decisão

Toda request à API pública `:3002` (e webhooks entrantes — já contemplado em
doc 005 §7) deve trazer **simultaneamente**:

1. **Assinatura HMAC-SHA256** sobre `timestamp + "\n" + nonce + "\n" + body`
   no header `X-SolutionTicket-Signature: sha256=<hex>`.
2. **Nonce** UUID v4 único por request, no header
   `X-SolutionTicket-Nonce: <uuid>`.
3. **Timestamp** ISO-8601 UTC (`2026-04-27T10:16:00Z`) no header
   `X-SolutionTicket-Timestamp`.
4. **Janela aceitável**: `|now - timestamp| ≤ 5 min`. Fora disso → 401.
5. **Cache de nonces consumidos**: TTL 10 min, conforme §7.1.1 do doc 005
   (SQLite no hub local; Redis/KV no relay cloud). Nonce repetido → 409
   Conflict + log de tentativa de replay (Sev2).

A política aplica-se a **toda** rota da API pública, não apenas webhooks.

### Pseudocódigo

```typescript
async function validateRequest(req): Promise<void> {
  const ts = parseISO(req.header('X-SolutionTicket-Timestamp'));
  if (Math.abs(Date.now() - ts.getTime()) > 5 * 60_000) throw Unauthorized('skew');

  const nonce = req.header('X-SolutionTicket-Nonce');
  if (!isUuidV4(nonce)) throw Unauthorized('bad nonce');

  const expected = hmacSha256(secretFor(req.tenant), `${ts.toISOString()}\n${nonce}\n${req.rawBody}`);
  if (!timingSafeEqual(expected, req.header('X-SolutionTicket-Signature'))) throw Unauthorized('sig');

  const inserted = await nonceCache.insertIfAbsent(nonce, ttlSeconds: 600);
  if (!inserted) throw Conflict('replay detected');
}
```

## Consequências

### Positivas

- Defesa em profundidade real: roubo de uma request não permite repetição.
- Mesma política de webhook se aplica à API pública — modelo mental único.
- Evidência forense: cache de nonces aponta replay tentado.

### Negativas

- Clientes precisam sincronizar relógio (NTP) com tolerância 5 min.
- Cliente perde idempotência grátis: agora cada retry precisa de novo nonce
  - assinatura. Mitigação: SDK do cliente faz isso automaticamente.
- Cache de nonces tem custo de I/O (SQLite). Mitigação: índice em
  `consumedAt`, limpeza por job a cada 1 min.

## Alternativas consideradas

- **Apenas timestamp window**: rejeitada — replay dentro da janela viável.
- **JWT com `jti`**: rejeitada — impõe JWT a clientes que hoje usam API key,
  e exige cache de `jti` igualmente.
- **mTLS no `:3002`**: ortogonal — pode coexistir; não substitui anti-replay
  em camada de aplicação.

## Referências

- ADR-013 — separação de portas
- `docs/integracao/005-seguranca-credenciais.md` §7.1.1 (cache de nonces)
- RFC 6749, RFC 7519, OWASP API Security Top 10 (API4:2023 — Resource
  Consumption / replay)
