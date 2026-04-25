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
  "signtoolOptions": { "signingHashAlgorithms": ["sha256"] }
}
```

Para ativar:

1. Adquirir **certificado EV Code Signing** (DigiCert/Sectigo, ~US$ 300/ano + token USB ou HSM).
2. Em ambiente local (ou self-hosted runner com HSM):
   ```env
   CSC_LINK=path/to/cert.pfx     # ou USB/HSM via signtool
   CSC_KEY_PASSWORD=...
   ```
3. Em GitHub Actions hosted runners NÃO é possível usar EV USB. Opções:
   - Self-hosted runner com token físico conectado (recomendado).
   - Cloud HSM (Azure Key Vault, DigiCert KeyLocker) com `signtool` apontando para ele.
4. Validar: o instalador deve mostrar "Solution Ticket" como editor verificado em `Right-click → Properties → Digital Signatures`.

Sem code signing, o Windows SmartScreen exibe "Editor desconhecido" e exige clique extra do usuário. Funcional, mas pior UX.

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
