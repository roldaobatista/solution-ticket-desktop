# ADR-013: API Pública em Porta Separada do Backend Interno

**Status**: Aprovada (resolve achado HIGH H4 da auditoria — Rodada 2)
**Data**: 2026-04-26

## Contexto

ADR-006 estabelece que backend roda em `127.0.0.1:3001`. ADR-009 define API pública versionada `/api/v1/integration`. Auditoria Rodada 2 apontou que **ambas usam a mesma porta `:3001`** — qualquer request autenticado da API pública atinge também rotas administrativas internas. Apenas ACL/JWT separa, o que é fraco como defesa em profundidade.

## Decisão

**Separar fisicamente as 2 superfícies HTTP**:

| Superfície          | Porta            | Bind                                                 | Audiência                           |
| ------------------- | ---------------- | ---------------------------------------------------- | ----------------------------------- |
| **Backend interno** | `127.0.0.1:3001` | Loopback only                                        | Frontend Electron (mesmo processo)  |
| **API pública**     | `127.0.0.1:3002` | Loopback (default) ou LAN com TLS+allowlist (opt-in) | iPaaS, scripts, integrações cliente |

### Implementação

- 2 instâncias NestJS no mesmo processo (ou 2 módulos com adapters HTTP separados)
- API pública carrega APENAS controllers anotados `@PublicApi()`
- Backend interno **nunca** expõe endpoints públicos
- Roteamento explícito — sem fallback cross-port

### Configuração

```typescript
// main.ts
const internalApp = await NestFactory.create(InternalAppModule);
await internalApp.listen(3001, '127.0.0.1');

const publicApp = await NestFactory.create(PublicApiModule);
await publicApp.listen(3002, '127.0.0.1');
```

### Quando expor `:3002` em LAN

Apenas com:

- TLS obrigatório (cert válido)
- IP allowlist
- API Key/OAuth forte
- Auditoria de acesso
- Aprovação explícita do administrador

## Consequências

### Positivas

- Defesa em profundidade — comprometer API pública não dá acesso a admin interno
- Pode expor `:3002` em LAN sem expor `:3001` (risco isolado)
- Logging/métricas separáveis por superfície
- Rate limiting independente

### Negativas

- 2 instâncias HTTP (overhead mínimo em Node)
- Cliente precisa saber qual porta usar (documentar no `/api/v1/integration/capabilities`)
- Requer atualização de `003-api-publica-v1.md`

## Alternativas consideradas

- **1 porta com middleware**: rejeitada — defesa em profundidade fraca
- **Reverse proxy local (Nginx)**: rejeitada para v1 — overhead de instalação no desktop
- **Subdomínio/path prefix**: rejeitada — não ajuda em segregação de porta

## Implementação

- Atualizar `003-api-publica-v1.md` Base URL → `:3002`
- Atualizar `001-arquitetura-integration-hub.md` diagrama
- Adicionar configuração em `backend/src/main.ts`

## Referências

- ADR-006 — Backend não exposto publicamente
- ADR-009 — Versionamento API pública
- Auditoria 10-agentes Rodada 2 — finding H4
