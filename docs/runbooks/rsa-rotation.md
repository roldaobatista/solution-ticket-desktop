# Runbook — Rotação do par RSA de licenciamento

Aplicável quando: suspeita de vazamento da `keygen/private.key`, expiração planejada (ciclo de 12 meses), ou perda de controle da chave privada.

## Pré-condições

- Acesso ao diretório `keygen/` no posto de trabalho do operador de licenciamento.
- Acesso ao repositório `solution-ticket-desktop` com permissão de push em `main`.
- Lista atual de clientes com licença ativa (para reemissão).

## 1. Confirmar incidente

```bash
cd "C:/PROJETOS/Plataforma de Pesagem Veicular/solution-ticket-desktop"
git log --all --full-history -- keygen/private.key
# Esperado: nenhuma linha. Qualquer commit listado = vazamento real.
grep -E "keygen/private\.key|keygen/\*\.pem" .gitignore
# Esperado: ambas linhas presentes.
```

Se houver hit no git log: tratar a chave como comprometida e seguir os passos abaixo. Caso contrário, rotação é apenas preventiva.

## 2. Backup da chave atual

```bash
mkdir -p ~/secure-backup/rsa-$(date +%Y%m%d)
cp keygen/private.key ~/secure-backup/rsa-$(date +%Y%m%d)/private.key.old
cp keygen/public.key  ~/secure-backup/rsa-$(date +%Y%m%d)/public.key.old
cp backend/src/licenca/public.key ~/secure-backup/rsa-$(date +%Y%m%d)/backend-public.key.old
```

Backup vai para volume offline / cofre. Nunca para repositório.

## 3. Gerar novo par

```bash
cd keygen
node gerar-par-rsa.js   # sobrescreve keygen/private.key e keygen/public.key (RSA-2048)
```

Validar:

```bash
openssl rsa -in keygen/private.key -check -noout
openssl rsa -in keygen/private.key -pubout | diff - keygen/public.key
```

## 4. Atualizar chave pública embutida

```bash
cp keygen/public.key backend/src/licenca/public.key
```

## 5. Build, gates e release

```bash
pnpm install
pnpm ci          # format + lint + typecheck + test + build (gates obrigatórios)
pnpm dist:win    # gera novo instalador assinado
```

Tag: `vX.Y.Z+rsa-rotated-YYYYMMDD`. Push da tag dispara `.github/workflows/release.yml`.

## 6. Reemitir licenças de clientes

Para cada cliente em `clientes-ativos.csv`:

```bash
node keygen/gerar-chave.js \
  --fingerprint <hash-do-cliente> \
  --plano <PRO|BASIC|...> \
  --maquinas <N> \
  --validade-dias <restante>
```

Distribuir `licenca-<cliente>.lic` por canal seguro (cliente precisa instalar o novo build E aplicar a nova licença — chave anterior não validará após upgrade).

## 7. Comunicação

- Notificar clientes ativos com janela de upgrade (mínimo 7 dias úteis).
- Registrar no `CHANGELOG.md` raiz como entrada `[Security]`.
- Atualizar `docs/auditoria/2026-04-25/04-seguranca.md` com data, motivo e hash do commit de rotação.

## 8. Pós-rotação

- Confirmar com `git log --all -- keygen/private.key` que nada novo entrou.
- Destruir `private.key.old` do backup após 30 dias se não houver investigação ativa.
- Agendar próxima rotação em 12 meses (ou imediata se incidente recorrente).

## Critério de "feito"

- [ ] Nova `private.key` gerada e validada com `openssl`.
- [ ] `backend/src/licenca/public.key` atualizada e build verde.
- [ ] Instalador assinado publicado.
- [ ] 100% dos clientes ativos reemitidos.
- [ ] Entrada `[Security]` no CHANGELOG.
- [ ] Backup da chave antiga em local offline.
