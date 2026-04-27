# Release & auto-update

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

## Rollback

1. Despublicar o release ruim no GitHub (não basta deletar tag — deletar o release inteiro).
2. Republicar release anterior como "latest".
3. `electron-updater` no próximo check oferece downgrade — usuário precisa aceitar.

> ⚠️ Auto-update **não faz downgrade automático**. Em caso de bug crítico, lançar `vX.Y.Z+1` com fix, NÃO tentar voltar à versão anterior.
