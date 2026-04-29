# 005 — Segurança e Credenciais

**Versão**: 1.0 — 2026-04-26
**ADRs base**: ADR-004 (DPAPI), ADR-006 (backend local)

---

## 1. Modelo de ameaças

### 1.1 Ameaças relevantes

- Vazamento de credenciais (API key, OAuth, certificados, senhas SOAP)
- Acesso não autorizado a dados de pesagem (LGPD)
- Manipulação de payload em trânsito
- Replay de webhooks/eventos
- Escalação de privilégio interno
- Roubo de máquina física (desktop)

### 1.2 Ameaças fora do escopo (responsabilidade do cliente)

- Físico da máquina da balança
- Rede do cliente (LAN/Wi-Fi)
- Comprometimento do Windows do operador
- Política de senhas do AD do cliente

---

## 2. Cofre de credenciais

### 2.1 Hierarquia de proteção

```
1. Windows DPAPI (padrão)               ← desktop Windows
2. OS Keyring (Linux/macOS)             ← futuro
3. Vault externo (Azure/AWS/HashiCorp)  ← Enterprise opcional
4. AES-256 + chave protegida            ← fallback emergencial
```

### 2.2 Implementação DPAPI — esquema KEK + DEK

> **Importante**: ADR-016 fixa o **escopo `CurrentUser`** (não `LocalMachine`).

A partir da Rodada 5, **não cifrar o segredo diretamente com DPAPI**. Adotar
hierarquia **KEK + DEK**:

- **DEK (Data Encryption Key)**: chave aleatória de **256 bits** gerada por
  segredo (uma DEK por linha de `integracaoSecret`). Cifra o segredo via
  AES-256-GCM. Nunca persistida em claro.
- **KEK (Key Encryption Key)**: chave única do tenant; cifra cada DEK; ela
  própria é protegida por **DPAPI escopo `CurrentUser`** (ADR-016).
- **Rotação de KEK**: gera-se nova KEK, decifra-se cada DEK com a antiga,
  re-cifra com a nova, troca-se o ponteiro `kekVersion`. **Os segredos de
  origem (tokens OAuth, API keys, senhas SOAP) não são tocados** — só as DEKs
  são re-embrulhadas. Operação batch, idempotente, retomável.

#### Diagrama (texto)

```
+-------------------+        +-----------------+        +-------------------+
|  Segredo (token,  |  AES-  |    DEK (256b,   |  AES-  |   KEK (256b,      |
|  api key, senha)  | -GCM-> |   por segredo)  | -GCM-> |  por tenant)      |
+-------------------+        +-----------------+        +-------------------+
                                                                  |
                                                                  | DPAPI
                                                                  | CurrentUser
                                                                  v
                                                        +-------------------+
                                                        |  KEK cifrada em   |
                                                        |  disco (blob)     |
                                                        +-------------------+

Rotação de KEK:
  KEK_v1 (DPAPI) --decifra--> [DEK1, DEK2, ... DEKn] --recifra--> KEK_v2 (DPAPI)
  Segredos NÃO são tocados. Aponta-se kekVersion = 2.
```

#### Esquema de dados (resumo)

| Tabela             | Campos relevantes                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `integracaoKek`    | `id`, `tenantId`, `version`, `dpapiBlob`, `createdAt`, `rotatedAt`                                                       |
| `integracaoSecret` | `id`, `profileId`, `kekVersion`, `dekCiphertext`, `dekIv`, `dekAuthTag`, `secretCiphertext`, `secretIv`, `secretAuthTag` |

#### Esboço de implementação

```typescript
// secret-manager.service.ts
async store(profileId: string, plaintext: string): Promise<string> {
  const dek = crypto.randomBytes(32);                 // 256 bits
  const { ciphertext: secretCt, iv: secretIv, tag: secretTag } =
      aesGcmEncrypt(plaintext, dek);

  const kek = await this.kekService.getActive();      // KEK em memória, decifrada via DPAPI
  const { ciphertext: dekCt, iv: dekIv, tag: dekTag } =
      aesGcmEncrypt(dek, kek.material);

  await this.prisma.integracaoSecret.create({ data: {
    profileId,
    kekVersion: kek.version,
    dekCiphertext: dekCt, dekIv, dekAuthTag: dekTag,
    secretCiphertext: secretCt, secretIv, secretAuthTag: secretTag,
  }});
  zeroize(dek); zeroize(plaintext);
  return profileId;
}

async retrieve(profileId: string): Promise<string> {
  const row = await this.prisma.integracaoSecret.findUnique({ where: { profileId }});
  const kek = await this.kekService.getByVersion(row.kekVersion);
  const dek = aesGcmDecrypt(row.dekCiphertext, kek.material, row.dekIv, row.dekAuthTag);
  const plaintext = aesGcmDecrypt(row.secretCiphertext, dek, row.secretIv, row.secretAuthTag);
  zeroize(dek);
  return plaintext;
}

// rotação KEK (batch, retomável)
async rotateKek(tenantId: string): Promise<void> {
  const oldKek = await this.kekService.getActive();
  const newKek = await this.kekService.createNew();   // gera + protege via DPAPI

  for await (const row of this.prisma.integracaoSecret.streamByKek(oldKek.version)) {
    const dek = aesGcmDecrypt(row.dekCiphertext, oldKek.material, row.dekIv, row.dekAuthTag);
    const reCt = aesGcmEncrypt(dek, newKek.material);
    await this.prisma.integracaoSecret.update({ where: { id: row.id }, data: {
      kekVersion: newKek.version,
      dekCiphertext: reCt.ciphertext, dekIv: reCt.iv, dekAuthTag: reCt.tag,
    }});
    zeroize(dek);
  }
  await this.kekService.markRetired(oldKek.version);
}
```

DPAPI escopo `CurrentUser` deriva chave do perfil Windows do usuário — outro
usuário **não** decripta a KEK (ADR-016 documenta os trade-offs em cenários
LocalSystem/multi-operador).

### 2.3 O que NÃO armazenar

- Senha de login do operador (já está em `tusuarios` com bcrypt)
- Chave privada de licença RSA (vive em outro lugar)
- Backup de credenciais (não fazer cópia)

### 2.4 Restauração em outra máquina

DPAPI **não migra** entre máquinas. Cliente que reinstala em hardware novo precisa **reconfigurar** todas as credenciais. Documentar isso no runbook de disaster recovery.

---

## 3. Autenticação suportada

| Método                              | Quando usar                                         | Segurança      |
| ----------------------------------- | --------------------------------------------------- | -------------- |
| API Key                             | ERPs simples, integrações cliente-a-cliente         | Boa (rotativa) |
| Basic Auth                          | Apenas legados sem alternativa, com TLS obrigatório | Aceitável      |
| OAuth 2.0 Client Credentials        | ERPs cloud server-to-server                         | Excelente      |
| OAuth 2.0 Authorization Code + PKCE | ERPs cloud com login do usuário                     | Excelente      |
| JWT Bearer                          | Quando ERP exige                                    | Boa            |
| mTLS                                | Enterprise, certificados client                     | Excelente      |
| HMAC Signature                      | Webhooks entrantes/saintes                          | Excelente      |
| Certificado A1/A3 ICP-Brasil        | NF-e, CT-e, fiscal                                  | Excelente      |

### 3.1 Implementação de OAuth 2.0

- Refresh proativo: renovar token ao atingir 80% do TTL
- Armazenar `accessToken` + `refreshToken` no cofre
- Em caso de erro 401, tentar refresh **uma vez** antes de falhar

### 3.2 mTLS

- Certificado client armazenado encriptado
- Senha da chave privada também no cofre
- Conector usa certificado em `https.Agent` customizado

---

## 4. Mascaramento de payload

### 4.1 Regras default

Mascarar em todos os logs:

| Padrão         | Detecção                                    | Mascaramento          |
| -------------- | ------------------------------------------- | --------------------- |
| CPF            | regex `\d{3}\.?\d{3}\.?\d{3}-?\d{2}`        | `***.***.***-**`      |
| CNPJ           | regex `\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}` | `**.***.***/****-**`  |
| E-mail         | regex padrão                                | `j****@d****.com`     |
| Cartão crédito | regex Luhn-detect                           | `**** **** **** 1234` |
| Telefone       | regex BR                                    | `(**) ****-1234`      |
| Token/JWT      | regex `eyJ[A-Za-z0-9-_]+\.[...]`            | `[REDACTED]`          |
| Senha          | nome do campo `password`, `senha`, `secret` | `[REDACTED]`          |
| Chave PIX      | regex de chaves PIX                         | `[REDACTED]`          |
| Certificado    | conteúdo PEM                                | `[REDACTED-CERT]`     |

### 4.2 Whitelist (preserva visibilidade parcial)

Configurável por instalação:

- Últimos 4 dígitos de CPF/CNPJ podem aparecer (`***-12`)
- Domínio do e-mail pode aparecer
- Permite suporte sem comprometer LGPD

### 4.3 Performance

- Pre-compile regexes
- < 5ms para payload de 50KB
- Test com 20 payloads diferentes em CI

### 4.4 Corpus de fuzzing e golden-files (obrigatório)

Mascaramento por regex falha silenciosamente em variantes inesperadas.
Requisito de qualidade:

- **Corpus de fuzzing** mantido em `backend/test/fixtures/masking-corpus/`,
  cobrindo no mínimo:
  - CPF com espaço entre grupos (`123 456 789-00`), sem pontuação
    (`12345678900`), com pontuação parcial (`123.456.78900`).
  - CNPJ com letras minúsculas, sem máscara, com prefixo de coluna
    (`cnpj:12.345.678/0001-90`).
  - JWT base64url quebrado em múltiplas linhas, com whitespace, com header
    inválido, em `Authorization: Bearer ...`.
  - E-mail com Unicode, com `+tag`, com IDN.
  - Cartão com dígitos separados por espaço/hífen e que passa Luhn.
  - Senha em campos aninhados (`config.auth.password`), em arrays, com nomes
    em inglês/português (`password`, `senha`, `pwd`, `passwd`).
- **Golden-files** em `backend/test/fixtures/masking-golden/`: para cada
  payload de entrada, há `<n>.input.json` e `<n>.expected.json` (versão
  sanitizada). Teste de regressão compara byte-a-byte.
- **Property-based**: gerador aleatório de strings tipo PII deve produzir 100%
  de mascaramento em 1000 amostras por execução de CI.
- Nenhum dado real de produção entra no corpus.

---

## 5. Permissões granulares

10 permissões em `INTEGRACAO_*`:

| Permissão                       | Quem deve ter                     |
| ------------------------------- | --------------------------------- |
| `INTEGRACAO_VER`                | Operador, supervisor, admin       |
| `INTEGRACAO_CRIAR`              | Admin                             |
| `INTEGRACAO_EDITAR`             | Admin                             |
| `INTEGRACAO_ALTERAR_CREDENCIAL` | Admin (separado do EDITAR)        |
| `INTEGRACAO_TESTAR_CONEXAO`     | Admin, suporte                    |
| `INTEGRACAO_VER_PAYLOAD`        | Admin, suporte (sensível!)        |
| `INTEGRACAO_REPROCESSAR`        | Admin, suporte                    |
| `INTEGRACAO_IGNORAR_ERRO`       | Admin (justificativa obrigatória) |
| `INTEGRACAO_EXPORTAR_LOG`       | Admin                             |
| `INTEGRACAO_RECONCILIAR`        | Admin, supervisor                 |

Padrão: ninguém tem nada por default. Admin atribui.

---

## 6. TLS

### 6.1 Em saída (ST → ERP)

- TLS 1.2 mínimo, 1.3 preferido
- Certificate pinning opcional para ERPs críticos (Enterprise)
- Validação de cadeia obrigatória — sem `rejectUnauthorized: false`

### 6.2 Em entrada

- Backend local não recebe TLS direto (é localhost)
- Relay cloud usa TLS 1.3 obrigatório
- Quando exposto em LAN: TLS obrigatório com certificado válido

---

## 7. Assinaturas HMAC

### 7.1 Webhooks emitidos pelo ST

```
X-SolutionTicket-Signature: sha256=...
X-SolutionTicket-Timestamp: 2026-04-27T10:16:00Z
X-SolutionTicket-Event-Id: uuid
```

Receptor calcula:

```
hmac_sha256(secret, timestamp + body)
```

Janela de timestamp: **5 minutos** (anti-replay).

#### 7.1.1 Cache de nonces consumidos (obrigatório)

Janela temporal sozinha **não previne replay dentro da janela**. Requisito
explícito:

- Cada request entrante (webhook **e** API pública `:3002`, ver ADR-015) deve
  trazer header `X-SolutionTicket-Nonce` (UUID v4).
- O receptor **mantém cache de nonces consumidos** com TTL **10 min** (cobre a
  janela de 5 min com folga). Storage:
  - **Hub local**: tabela SQLite `integracaoNonceConsumido(nonce TEXT PRIMARY KEY, consumedAt INTEGER NOT NULL)` com índice em `consumedAt` para limpeza periódica.
  - **Relay cloud**: Redis/KV com `EXPIRE` 600s.
- Se nonce já presente no cache → **rejeitar com 409 Conflict** e logar como
  tentativa de replay.
- Limpeza: job a cada 1 min remove `consumedAt < now - 600s` (SQLite) — KV
  expira sozinho.

### 7.2 Webhooks recebidos

Validação no relay cloud (não no backend local). Cada ERP usa sua especificação:

- Bling: HMAC-SHA1 em `x-bling-signature`
- SAP: SAP-Signature header
- Omie: app_secret no payload
- Genérico: configurável por conector

---

## 8. Auditoria

### 8.1 Eventos auditados

- Criação/edição/exclusão de profile
- Alteração de credencial
- Visualização de payload (com correlation ID)
- Reprocessamento de evento
- Cancelamento/ignorar de evento
- Mudança de mapping
- Teste de conexão
- Exportação de logs

### 8.2 Schema de auditoria

Reusa `tabela_auditoria` existente do produto. Campos:

- `usuario`, `acao`, `recurso`, `dataHora`
- `dadosAntes`, `dadosDepois` (mascarados)
- `ip`, `userAgent`

### 8.3 Retenção

- Auditoria operacional: 1 ano
- Auditoria fiscal (envio de documento): **5 anos** (Receita)
- Backup mensal exportável

---

## 9. LGPD

### 9.1 Bases legais

- **Execução de contrato** para integração principal
- **Cumprimento de obrigação legal** para auditoria fiscal
- **Legítimo interesse** para logs operacionais

### 9.2 Direitos do titular

- Acesso aos dados: relatório consolidado por CPF/CNPJ
- Anonimização: substitui valores por hash conforme **Matriz
  retenção×esquecimento** (ver `docs/integracao/MATRIZ-RETENCAO-ESQUECIMENTO.md`)
- Esquecimento: aplica matriz por campo — fiscais 5 anos, CPF motorista
  pseudonimizado em hash sha256 truncado após 90 dias, logs operacionais 30 dias
- Portabilidade: export JSON

### 9.3 Minimização

- Logs guardam apenas o necessário
- Payloads completos só por TTL configurável (default 90 dias)
- Após TTL, mantém metadata + hash de integridade

### 9.4 DPO

Cliente Enterprise pode designar DPO próprio. Solution Ticket é **operador**, cliente é **controlador**.

---

## 10. Exposição em rede

### 10.1 Padrão: localhost only

Backend escuta apenas `127.0.0.1`. Mudança disso é breach de segurança.

### 10.2 Quando habilitar LAN

Apenas com:

- Configuração explícita por cliente
- TLS obrigatório (certificado válido)
- IP allowlist
- Auth forte (JWT com expiração curta)
- Firewall ativo
- Auditoria de acesso habilitada

### 10.3 Internet

Nunca. Usar relay cloud para webhooks entrantes (ADR-008).

---

## 11. Rotação de segredos

| Segredo                       | Frequência recomendada | Quem             |
| ----------------------------- | ---------------------- | ---------------- |
| API Key do ST (saída)         | 12 meses               | Cliente          |
| Tokens OAuth                  | Automático (refresh)   | ST               |
| Certificado A1 ICP-Brasil     | Anual                  | Cliente          |
| Certificado A3                | 3 anos                 | Cliente          |
| Senha SOAP legado             | 6 meses                | Cliente          |
| Token relay cloud             | 90 dias automático     | ST               |
| API Key do hub (cliente → ST) | Sob demanda            | Admin do cliente |

Alertas 60/30/7 dias antes de expirar.

---

## 12. Resposta a incidentes

### 12.1 Vazamento de credencial detectado

1. **Imediato (< 1h)**: rotação automática + revogação no ERP
2. **2h**: notificar cliente afetado
3. **24h**: post-mortem + auditoria de acesso
4. **48h**: relatório a DPO se aplicável

### 12.2 Comprometimento do hub

1. Isolamento da máquina afetada
2. Análise forense
3. Reset de todas as credenciais do tenant
4. Notificação LGPD (se dados pessoais expostos)
5. Relatório a ANPD se exigido

### 12.3 Runbook

`docs/runbooks/integracao/seguranca-incidente.md` — runbook de incidente
(detecção, contenção, erradicação, recuperação, lições). Para incidente
específico de chave/máquina, ver também `docs/runbooks/integracao/dr-dpapi.md`.

---

## 13. Checklist de segurança por conector

Antes de GA:

- [ ] Credenciais via cofre (nunca em config)
- [ ] TLS obrigatório
- [ ] Validação de certificado (sem bypass)
- [ ] Rotação configurada
- [ ] Mascaramento testado em logs
- [ ] HMAC em webhooks (entrada e saída)
- [ ] Permissões corretas
- [ ] Audit log de credencial
- [ ] Rate limit definido
- [ ] LGPD review feita

---

## 14. Referências

- ADR-004, ADR-006
- `CLAUDE.md` — princípios de segurança do produto
- LGPD Lei 13.709/2018
- OWASP Top 10 (2021)
- `backend/src/integracao/security/`
