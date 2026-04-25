# Decisoes Pendentes / Registradas

## Licenciamento (Etapa 6)

### Modelo de verificacao

- **Licenca 100% offline**: nao ha endpoint online de revogacao. O backend valida
  a chave JWT RS256 apenas com a `public.key` embutida.
- **Revogacao**: a unica forma de "revogar" uma licenca e reemitir outra chave
  (com nova fingerprint, novo `exp`, ou negar-se a gerar uma nova). Nao ha
  blacklist distribuida nem CRL.

### Fingerprint da maquina

- **Composicao** = `MAC da primeira NIC ativa + hostname + volume serial do C:`
  (Windows). Em Linux: `MAC + hostname + /etc/machine-id`. Em macOS:
  `MAC + hostname + IOPlatformUUID`.
- Resultado = `SHA-256` truncado em 32 chars hex.
- **Fallbacks Windows**: tenta `Get-CimInstance` via PowerShell; se falhar,
  tenta `wmic`; se ambos falharem, grava literal `no-volserial` (a fingerprint
  sera estavel, mas menos unica). Documentado no codigo.
- O fingerprint e **cacheado em memoria** apos primeira leitura.

### Validade da chave

- **Vitalicia** = JWT gerado **sem** claim `exp` (`--validade-dias` omitido).
- **Com prazo** = passar `--validade-dias N` faz `exp = iat + N*86400`.
- A verificacao de `exp` e feita tanto pela biblioteca `jsonwebtoken` quanto
  explicitamente no service (defesa em profundidade).

### Planos e limites

- `PADRAO`: 1 fingerprint por chave.
- `PRO`: ate 3 fingerprints por chave.
- Trial: 15 dias corridos OU 100 pesagens (o que vier primeiro).

### Rotacao da chave privada

- Hoje nao ha rotacao automatica. Trocar `private.key` invalida todas as chaves
  emitidas com a antiga. Decisao: manter uma unica chave por linha de produto
  ate haver motivo tecnico para rotacionar.

## Instalador Windows (Etapa 7)

### Empacotamento

- **Abordagem**: Electron wrapper + backend Nest (node dist/main.js) + frontend
  Next.js rodando via `next start -p 3000` em producao (mesma estrategia do dev,
  sem `output: standalone` para evitar issues de symlink em Windows).
- **electron-builder 24** + NSIS, `asar: true` com `asarUnpack: **/*.{node,dll}`
  para permitir que binarios nativos (serialport, modbus-serial) rodem fora do
  asar.
- `extraResources` inclui `backend/dist`, `backend/node_modules`, `backend/src/prisma`,
  `frontend/.next`, `frontend/node_modules` e `frontend/next.config.js`.
- Instalador final: `release/Solution-Ticket-Setup-1.0.0.exe` (~172 MB).

### Cache winCodeSign em Windows sem symlink privilege

- electron-builder baixa `winCodeSign-2.6.0.7z` que contem symlinks Darwin
  (`libcrypto.dylib`, `libssl.dylib`). Sem **Developer Mode** habilitado, 7za
  falha ao extrair.
- **Workaround**: `electron/prep-cache.js` pre-extrai o 7z com flag `-snl-`
  ignorando symlinks. Rodado automaticamente antes do `electron-builder` no
  script `dist`.

### Migrations no primeiro boot

- Em prod, o `electron/main.js` detecta se `%APPDATA%/Solution Ticket/solution-ticket.db`
  existe; se nao, spawna `prisma migrate deploy --schema=<resources>/backend/src/prisma/schema.prisma`
  com `DATABASE_URL=file:<userdata>/solution-ticket.db`.

### Native rebuild

- `@electron/rebuild` e invocado por `electron/rebuild-native.js` antes do
  build, compilando `serialport`, `@serialport/bindings-cpp` e `modbus-serial`
  contra o ABI do Electron 30. Falhas nao abortam o build (log-only).

### Icone

- Placeholder programatico (256x256, 32bpp BGRA, gradient azul) gerado por
  `electron/gen-icon.js`. Substituir antes de release oficial.

### Pendencias

- Nao testado execucao do `.exe` instalado (exige interacao UI).
- `author` faltando no `electron/package.json` (warning nao-fatal).
- Code signing nao configurado (sem certificado). SmartScreen ira avisar na
  primeira execucao.
