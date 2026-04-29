# WebAuthn Dual Control — Spec criptográfica para operações fiscais irreversíveis

> **Escopo:** especificação de dual control com autenticação criptográfica
> WebAuthn/FIDO2 para operações que alteram estado fiscal já contabilizado
> ou expõem PII de forma sensível.
> **Owner agentico:** `Security-Agent` + `LGPD-Legal-Agent`.
> **Cross-link:** PERMISSOES-INTEGRACAO.md (§§4 e 12), THREAT-MODEL-INTEGRACAO.md
> (LINDDUN L5), ADR-018 (Audit trail).
> **Status:** decisão a ratificar em Sprint 0 (entregável ADR-022).

---

## 1. Por que dual control criptográfico (e não "dois cliques")

Dual control tradicional ("dois usuários aprovam, ambos no log") tem
fragilidade: senha do segundo aprovador pode ser compartilhada,
phishada ou capturada por keylogger. Para operações **fiscais
irreversíveis**, o aprovador precisa provar posse de um fator hardware
(passkey FIDO2/WebAuthn) — não apenas conhecimento (senha) ou disponibilidade
(SMS/TOTP, vulneráveis a SIM swap e phishing reverso).

A assinatura WebAuthn fica armazenada no audit trail como **prova
criptográfica** de quem aprovou — verificável posteriormente sem depender
de "log de quem clicou".

---

## 2. Operações cobertas

| Operação                                                      | Permissão                        | Aprovador exigido              | Escalonamento |
| ------------------------------------------------------------- | -------------------------------- | ------------------------------ | ------------- |
| Reprocessar ticket fiscal já contabilizado                    | `INTEGRACAO_REPROCESSAR_FISCAL`  | 2º com Tech Lead ou Auditor    | Bloqueante    |
| Revogação massiva de tokens em incidente                      | `INTEGRACAO_ADMIN`               | 2º com Tech Lead               | Bloqueante    |
| Alteração de mapping em produção fora da janela de manutenção | `INTEGRACAO_CONFIGURAR_CONECTOR` | 2º com Tech Lead               | Bloqueante    |
| Elevação para `INTEGRACAO_VER_PAYLOAD_CRU`                    | (privilégio temporário)          | Supervisor (Tech Lead/Auditor) | Bloqueante    |
| Drop / reset de filas                                         | `INTEGRACAO_ADMIN`               | 2º com Tech Lead + DPO         | Bloqueante    |

Operações fora desta lista usam dual control simples (clique + log).

---

## 3. Fluxo (passo a passo)

```
Usuário A inicia operação → backend valida permissão A
       ↓
Backend gera challenge WebAuthn (32 bytes random) + persiste em DB
com TTL=5min, vinculado a (operacao_id, user_a_id)
       ↓
Backend dispara notificação push ao Usuário B (perfil Tech Lead/Auditor)
via canal in-app + e-mail + Slack/Teams (configurável por tenant)
       ↓
Usuário B abre app, vê pendência, lê detalhes da operação
       ↓
B autentica via passkey FIDO2 (toque na YubiKey, Touch ID, Windows Hello)
       ↓
Browser/Electron retorna `authenticatorAssertionResponse`
contendo: clientDataJSON, authenticatorData, signature, userHandle
       ↓
Backend valida assertion (@simplewebauthn/server) contra
public key cadastrada de B + challenge gerado
       ↓
Se válido: persistir assinatura R/S + timestamp + operacao_id no
audit trail (ADR-018), liberar execução
       ↓
Se inválido ou TTL expirado: rejeitar, logar Sev2, exigir novo fluxo
```

---

## 4. Implementação técnica

### Backend (NestJS)

- Lib: `@simplewebauthn/server` (^10.0.0)
- Tabelas:
  - `webauthn_credential` — passkeys cadastradas por usuário (1:N)
  - `webauthn_challenge` — challenges pendentes (TTL 5min)
  - `dual_control_request` — operação + status + assinaturas
- Endpoints:
  - `POST /integracao/dual-control/initiate` (usuário A)
  - `GET  /integracao/dual-control/pending` (usuário B)
  - `POST /integracao/dual-control/approve` (assertion de B)
  - `POST /integracao/dual-control/reject` (B nega)

### Frontend (Electron)

- Lib: `@simplewebauthn/browser` (^10.0.0)
- Componente `DualControlApproval` com prompt nativo (`navigator.credentials.get`).
- Fallback para passkey roaming (YubiKey USB) ou platform (Touch ID, Windows Hello).

### Cadastro de passkey

- Onboarding obrigatório para perfis Tech Lead, Auditor, DPO, ADMIN.
- Cadastro via fluxo `register` (`navigator.credentials.create`).
- Mínimo 2 passkeys por usuário (primária + backup hardware).
- Re-cadastro forçado a cada 12 meses ou em troca de hardware.

### Audit trail

Cada aprovação/rejeição grava em `integracao_log`:

```json
{
  "event": "DUAL_CONTROL_APPROVED",
  "operacao": "REPROCESSAR_FISCAL",
  "operacao_id": "uuid",
  "iniciador_user_id": "A",
  "aprovador_user_id": "B",
  "webauthn_signature": "base64(R||S)",
  "webauthn_credential_id": "...",
  "challenge": "base64(random32)",
  "timestamp": "2026-04-27T14:32:11Z"
}
```

Linha entra na hash chain (ADR-018).

---

## 5. Fallback de emergência agentico

Cenário: incidente Sev1 fora de horário, Tech Lead único disponível, sem
2º aprovador com passkey acessível.

**Fluxo de override**:

1. Operador autorizado aciona modo `EMERGENCY_OVERRIDE` no app.
2. Sistema exige justificativa textual, escopo, impacto esperado e TTL curto.
3. Operação executa imediatamente apenas para conter Sev1/risco fiscal; audit trail marca `EMERGENCY=true`.
4. Em até 24h, `Incident-Agent` gera relatório pós-override com relato, evidências, hashes e recomendação de remediação.
5. `Security-Agent` + `LGPD-Legal-Agent` revisam o relatório em até 7 dias. Revisão humana/disciplinar, se necessária, é dependência externa e não bloqueia contenção Sev1.

Limite: **máx 2 overrides/ano por Tech Lead**. Acima disso, escalonar
para CISO + revisão de processo.

---

## 6. Cross-links

- ADR-016 — DPAPI no cliente (relação com cofre).
- ADR-018 — audit trail e hash chain.
- PERMISSOES-INTEGRACAO.md §§4, 12 — operações cobertas.
- THREAT-MODEL-INTEGRACAO.md — LINDDUN L5, STRIDE EoP.
- SECRETS-MANAGEMENT.md — MFA hardware obrigatório (YubiKey).
- WebAuthn Level 2 spec — https://www.w3.org/TR/webauthn-2/
- FIDO2 — https://fidoalliance.org/fido2/
