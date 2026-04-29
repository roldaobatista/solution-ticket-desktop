# ADR-012: OAuth 2.0 Authorization Code em Solution Ticket Desktop

**Status**: Aprovada (resolve achado HIGH H10 da auditoria 10-agentes)
**Data**: 2026-04-26

## Contexto

Diversos ERPs cloud (Bling, ContaAzul, SAP S/4HANA, Dynamics) exigem **OAuth 2.0 Authorization Code Flow** com `redirect_uri` público. Solution Ticket é **desktop local-first** (`127.0.0.1`), sem URL pública.

Sem padrão único, cada conector resolveria diferente — fragmentação e bugs.

## Decisão

Adotar **3 estratégias suportadas**, escolhidas por capabilities do ERP:

### Estratégia 1: Loopback Redirect (preferida quando ERP aceita)

- Conector inicia servidor HTTP **temporário** em `127.0.0.1:<porta-livre>` (ex: 53682)
- `redirect_uri` configurado no ERP: `http://127.0.0.1:53682/oauth/callback/<connector>`
- Usuário clica "Autorizar" na UI → abre browser → autoriza no ERP → redireciona para loopback
- Servidor temporário captura `code` e fecha
- Conector troca `code` por `token` via backend
- Token persiste no cofre DPAPI (ADR-004)

**Aceito por**: Bling, ContaAzul, Dynamics 365, Google APIs, GitHub, GitLab.

### Estratégia 2: Device Authorization Grant (RFC 8628)

- Para ERPs que suportam (Microsoft, alguns SAP)
- UI mostra `user_code` + URL → usuário cola URL no browser de qualquer device
- Backend faz polling ao endpoint do ERP até autorização
- Mais robusto que loopback (não depende de browser local)

**Aceito por**: Microsoft Entra ID, alguns SAP, GitHub.

### Estratégia 3: OAuth Relay Cloud (fallback)

- Para ERPs que **não aceitam** loopback nem device grant
- Usar `https://oauth.solution-ticket.com/callback/<connector>` (Cloudflare Workers)
- Relay troca `code` por `token` e devolve via canal autenticado para o agent local
- Mesma infra do relay de webhook (ADR-008)

**Aceito por**: ERPs antigos/restritos (raro).

### Decisão por conector

| Conector               | Estratégia primária                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Bling                  | Loopback                                                                                        |
| ContaAzul              | Loopback (com PKCE)                                                                             |
| Omie                   | n/a — usa app_key/app_secret, não OAuth Code                                                    |
| Sankhya                | n/a — usa JWT login                                                                             |
| TOTVS Protheus REST    | n/a — token via login interno                                                                   |
| SAP S/4HANA Cloud      | Device grant (preferido) ou Loopback                                                            |
| Microsoft Dynamics 365 | Device grant                                                                                    |
| NetSuite               | **Relay cloud** (NetSuite rejeita `127.0.0.1` em redirect_uri — confirmado em SuiteSignOn docs) |
| Oracle Fusion          | **Relay cloud** ou Device grant — Oracle Identity Cloud restringe loopback                      |

## Consequências

### Positivas

- Conectores cloud funcionam em desktop sem expor backend
- Padrão único para devs implementarem
- PKCE sempre usado (RFC 7636) — protege contra interceptação
- Sem dependência forte do relay cloud (loopback funciona offline-friendly)

### Negativas

- Loopback exige porta livre — gerenciamento via SO (`get-port` no Node)
- Servidor HTTP temporário tem janela de exposição (~30s) — mitigado por loopback only + escopo restrito
- Device grant tem UX pior (digitar código)
- Relay cloud tem latência adicional + custo

## Implementação

### Componente: `OAuthService` no SDK

```typescript
// backend/src/integracao/security/oauth.service.ts
export class OAuthService {
  async authorize(profile: Profile, strategy: OAuthStrategy): Promise<TokenSet> {
    switch (strategy.type) {
      case 'loopback':
        return this.loopbackFlow(profile);
      case 'device':
        return this.deviceFlow(profile);
      case 'relay':
        return this.relayFlow(profile);
    }
  }

  private async loopbackFlow(profile) {
    const port = await getFreePort();
    const verifier = generatePKCEVerifier();
    const challenge = computePKCEChallenge(verifier);
    const state = randomBytes(32).toString('hex'); // CSRF protection

    const authUrl = buildAuthUrl(profile, {
      redirect_uri: `http://127.0.0.1:${port}/oauth/callback`,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });

    // CRÍTICO: bind explícito a 127.0.0.1 — NUNCA 0.0.0.0
    // Caso contrário, qualquer processo na LAN pode interceptar o code.
    const server = startTemporaryServer({
      port,
      host: '127.0.0.1', // OBRIGATÓRIO
      timeout: 300_000, // 5 min auto-close
      acceptOnce: true, // 1 callback e fecha
      validateState: state, // rejeita callbacks com state diferente
      pidLock: process.pid, // verifica que é nosso processo
    });
    openBrowser(authUrl);

    const code = await server.waitForCode();
    server.close();

    const tokens = await exchangeCodeForToken(profile, code, verifier);
    await secretManager.store(profile.id, 'oauth-tokens', tokens);
    return tokens;
  }
}
```

### Refresh automático

- Renovar token ao atingir 80% do TTL
- Se refresh falhar, marcar conector como `OFFLINE` e exigir nova autorização
- UI mostra alerta "Conector Bling precisa ser reautorizado"

### Auditoria

- Toda autorização registrada em `tabela_auditoria` com:
  - Usuário ST que autorizou
  - Conector
  - Timestamp
  - Escopo concedido
  - PID do processo Node que iniciou o fluxo (não IP — sempre 127.0.0.1)
  - State token usado (para correlacionar com callback)
  - Hash do `code_verifier` (sem revelar)

## Alternativas consideradas

| Alternativa                                 | Por que rejeitada                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Cliente cadastra `redirect_uri` no roteador | Inviável — exige conhecimento técnico do cliente                                         |
| Apenas relay cloud para tudo                | Latência + custo + dependência externa não justificada para casos onde loopback funciona |
| Implicit Grant (deprecado)                  | Inseguro — RFC 6819 não recomenda                                                        |
| Client Credentials                          | Não funciona — Bling/ContaAzul exigem usuário humano consentindo                         |

## Segurança

- **PKCE sempre** (mesmo quando ERP não exigir)
- **State parameter** para CSRF
- **Servidor loopback aceita só 1 callback** — auto-fecha após
- **Timeout 5 min** para autorização
- **Tokens nunca em log** (mascaramento ADR-004)
- **Refresh token rotation OBRIGATÓRIO** onde o ERP suporta (mínimo: Bling,
  Conta Azul). Cada uso do refresh token retorna **novo refresh + novo
  access**, e o anterior é invalidado server-side.
  - **Detecção de replay**: se um refresh token já consumido for reapresentado,
    o evento é tratado como **alerta crítico (Sev1)** — indica
    comprometimento. Ação automática: revogar a sessão inteira (refresh atual
    - access), suspender o profile, abrir incidente conforme
      `docs/runbooks/integracao/seguranca-incidente.md`.
  - **Token vazado em backup**: qualquer suspeita de exposição de refresh
    token em backup, snapshot, log, dump ou export força invalidação **em
    ≤7 dias** corridos a partir da detecção. Não há janela de "esperar
    expirar".
  - ERPs que não suportam rotation (lista mantida em `006-mapping-engine.md`
    §capabilities): aplicar mitigação compensatória — TTL curto + monitoria
    de uso anômalo.

## Referências

- RFC 6749 — OAuth 2.0
- RFC 7636 — PKCE
- RFC 8252 — OAuth 2.0 for Native Apps (loopback recommendation)
- RFC 8628 — Device Authorization Grant
- ADR-004 (cofre DPAPI), ADR-008 (relay cloud)
