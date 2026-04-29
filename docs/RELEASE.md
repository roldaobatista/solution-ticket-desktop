# Release & auto-update

> Owner: Eng | Última revisão: 2026-04-27 | Versão: 5

## Versionamento

- Sigamos **semver** rigoroso: `MAJOR.MINOR.PATCH`.
- Versão é a chave em `package.json` raiz (e replicada em `electron/package.json`).
- Para liberar: bump versão → tag `vX.Y.Z` → `git push --tags`.

## Pipeline

`.github/workflows/release.yml` (criado em S2) dispara em tags `v*`:

1. Checkout, install, prisma generate.
2. Build all (backend + frontend).
3. `pnpm dist:win` → gera `release/Solution-Ticket-Setup-X.Y.Z.exe` + `latest.yml` + `.blockmap`.
4. Upload como artifact e publish em GitHub Release (draft).
5. Você revisa, edita changelog, publica o release.

## Auto-update

- Cliente verifica `latest.yml` no GitHub Releases via `electron-updater` no boot e a cada 4h.
- Notifica usuário antes de baixar e antes de instalar (não é silencioso).
- Logs em `%APPDATA%/SolutionTicket/logs/main.log` (electron-log default).
- Desativar com env `UPDATE_FEED_URL=off`.

## Code signing — pendente do certificado EV

Configuração em `electron/package.json` já preparada:

```json
"win": {
  "publisherName": "Solution Ticket",
  "signAndEditExecutable": true,
  "sign": "sign.js",
  "signtoolOptions": { "signingHashAlgorithms": ["sha256"] }
}
```

O script `electron/sign.js` atua como **gate de release**:

- Em `CI_RELEASE=true`, exige `WIN_CSC_LINK` e `WIN_CSC_KEY_PASSWORD`.
- Sem essas variáveis, o build falha em release.
- Em builds locais/dev, pula o signing com aviso no log.

Para ativar:

1. Adquirir **certificado EV Code Signing** (DigiCert/Sectigo, ~US$ 300/ano + token USB ou HSM).
2. Configure os secrets no GitHub Actions:
   - `WIN_CSC_LINK` — caminho ou URL do certificado `.p12`/`.pfx`
   - `WIN_CSC_KEY_PASSWORD` — senha do certificado
3. Em GitHub Actions hosted runners NÃO é possível usar EV USB. Opções:
   - Self-hosted runner com token físico conectado (recomendado).
   - Cloud HSM (Azure Key Vault, DigiCert KeyLocker) com `signtool` apontando para ele.
4. Validar: o instalador deve mostrar "Solution Ticket" como editor verificado em `Right-click → Properties → Digital Signatures`.

Sem code signing, o Windows SmartScreen exibe "Editor desconhecido" e exige clique extra do usuário. Funcional, mas pior UX.

### Dry-run de release

Antes de criar uma tag `v*`, valide o pipeline com uma tag de teste:

```bash
git tag test-release/v0.0.0
git push origin test-release/v0.0.0
```

O workflow `.github/workflows/release-dry-run.yml` executa o build completo sem publicar no GitHub Releases. Após validação, delete a tag:

```bash
git push --delete origin test-release/v0.0.0
git tag -d test-release/v0.0.0
```

## Provider config (GitHub)

Antes do primeiro release real:

1. Substituir em `electron/package.json` → `build.publish[0]`:
   - `owner: "SOLUTION-TICKET-OWNER"` → org/usuário GitHub real.
   - `repo: "solution-ticket-desktop"` → nome real do repo.
2. Para repos privados, configurar `GH_TOKEN` no env do runner.
3. Releases públicos são lidos sem token; auto-update funciona out-of-the-box.

## Canary release por % de instalações

> Auditoria Rodada 5 (Agente 3): estratégia de release ambígua — sem canary/feature flag/kill-switch. Esta seção fecha o gap.

Cada release nova segue ramp progressivo via `latest.yml` rotacionado:

| Fase             | % de instalações | Janela           | Critério de avanço                                             |
| ---------------- | ---------------- | ---------------- | -------------------------------------------------------------- |
| **Canary**       | 10 %             | 0 → 24 h         | nenhum P0; taxa de erro de auto-update < 1 %; SLOs respeitados |
| **Half-rollout** | 50 %             | 24 → 48 h        | idem + feedback do suporte clean                               |
| **Full**         | 100 %            | a partir de 48 h | sem regressão observada                                        |

### Como o ramp é feito

- Pipeline gera dois `latest.yml`:
  - `latest-canary.yml` → versão nova
  - `latest-stable.yml` → versão anterior
- Cada cliente é colocado em bucket determinístico (hash do fingerprint de licença) entre 0–99.
- Buckets 0–9 leem `latest-canary.yml` na primeira fase; 0–49 na segunda; 0–99 na terceira.
- Implementação no `electron-updater` via `feed-url` parametrizado por bucket.

### Drill mensal (rollback ensaiado)

- 1× por mês, em ambiente de homologação:
  1. Publicar versão de teste em `latest-canary.yml`.
  2. Disparar 1 cliente sintético em bucket canary; validar update.
  3. Reverter `latest.yml` para versão anterior; validar que próximo check NÃO faz downgrade automático.
  4. Lançar `vX.Y.Z+1` com fix sintético; validar caminho "fix-forward".
  5. Registrar em `docs/runbooks/release-drill-YYYY-MM.md`.

## Feature flags server-side

Configuração em `backend/data/feature-flags.json` (gerenciado por endpoint admin):

```json
{
  "integracao.connector.bling": "on",
  "integracao.connector.omie": "on",
  "integracao.connector.sap-s4hana": "off",
  "integracao.relay.cloudflare": "on",
  "integracao.relay.aws": "off"
}
```

### Kill-switch por conector

- Endpoint admin: `POST /admin/feature-flags/integracao.connector.<erp>` body `{"value":"off"}`.
- Efeito: worker pula eventos daquele conector (status `PAUSED` em `integracao_profile`); outbox preserva fila.
- Reativação: `{"value":"on"}` → worker volta a processar do ponto onde parou (idempotência absorve eventuais duplicatas).
- **Caso de uso típico**: ERP fora do ar por horas; bug em release específica de conector; rate-limit estourando.

### Política de auto-rollback

- Se taxa de `outbox_dlq_count` por conector explodir > 5× watermark crit em 1h após release: **kill-switch automático** + alerta P1.
- Operador valida e decide: reativar com fix ou manter desligado até `vX.Y.Z+1`.

---

## Rollback

1. Despublicar o release ruim no GitHub (não basta deletar tag — deletar o release inteiro).
2. Republicar release anterior como "latest" (rotacionar `latest.yml`).
3. `electron-updater` no próximo check oferece downgrade — usuário precisa aceitar.

> ⚠️ Auto-update **não faz downgrade automático**. Em caso de bug crítico, lançar `vX.Y.Z+1` com fix, NÃO tentar voltar à versão anterior. Use kill-switch de feature flag para mitigar enquanto o fix é preparado.
