# Keygen - Solution Ticket

Ferramenta local (vendor) de emissao de chaves de licenca RSA-2048 (JWT RS256).

## Setup (uma vez)

```
pnpm install
node gerar-par-rsa.js
```

Isso cria `private.key` (NUNCA commitar) e `public.key`. Copie `public.key` para `backend/src/licenca/public.key` e commite a publica junto com o backend.

## Fluxo de venda

1. Cliente instala o app e consulta `GET /api/licenca/fingerprint` (ou copia da tela do app).
2. Cliente envia a fingerprint ao vendedor.
3. Vendedor gera a chave:
   ```
   node gerar-chave.js --fingerprint <fp> --plano PADRAO
   node gerar-chave.js --fingerprint <fp1,fp2,fp3> --plano PRO --maquinas 3
   node gerar-chave.js --fingerprint <fp> --plano PRO --validade-dias 365
   ```
4. (Opcional) Confira: `node verificar-chave.js --chave <JWT>`
5. Envia a chave ao cliente, que cola em `POST /api/licenca/ativar`.

Sem `--validade-dias`, a chave e vitalicia (sem `exp`). Revogacao: emitir nova chave com fingerprint diferente - nao ha revogacao online.
