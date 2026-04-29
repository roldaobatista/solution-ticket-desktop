# Permissões — Módulo Integração ERP

> **Escopo:** expansão da matriz §12.2 (`MATRIZ-PERMISSOES.md`) com permissões granulares específicas do módulo de integração ERP.
> **Owner:** Tech Lead + DPO.
> **Cross-link:** MATRIZ-PERMISSOES.md, THREAT-MODEL-INTEGRACAO.md (LINDDUN L2/L5), DPIA-TEMPLATE.md.

---

## 1. Catálogo (14 permissões granulares)

| #   | Permissão                          | Descrição                                                                                                                                                                         | Sensibilidade |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | `INTEGRACAO_VER_STATUS`            | Ver dashboard de status dos conectores                                                                                                                                            | Baixa         |
| 2   | `INTEGRACAO_VER_FILA`              | Listar itens da outbox/inbox                                                                                                                                                      | Baixa         |
| 3   | `INTEGRACAO_REPROCESSAR_ITEM`      | Reprocessar item NÃO-fiscal                                                                                                                                                       | Média         |
| 4   | `INTEGRACAO_REPROCESSAR_FISCAL`    | Reprocessar item já contabilizado fiscalmente — **dual control criptográfico via WebAuthn/passkey do segundo aprovador** (ver `WEBAUTHN-DUAL-CONTROL-SPEC.md`)                    | Alta          |
| 5   | `INTEGRACAO_PAUSAR_CONECTOR`       | Pausar/retomar conector específico                                                                                                                                                | Média         |
| 6   | `INTEGRACAO_CONFIGURAR_CONECTOR`   | Editar mapping/parâmetros do conector                                                                                                                                             | Alta          |
| 7   | `INTEGRACAO_GERIR_CREDENCIAL`      | Cadastrar nova credencial de conector                                                                                                                                             | Alta          |
| 8   | `INTEGRACAO_ROTACIONAR_CREDENCIAL` | Rotacionar credencial existente                                                                                                                                                   | Alta          |
| 9   | `INTEGRACAO_VER_AUDIT_LOG`         | Ler audit trail do módulo                                                                                                                                                         | Alta          |
| 10  | `INTEGRACAO_EXPORTAR_AUDIT_LOG`    | Exportar audit trail para fora da estação                                                                                                                                         | Alta          |
| 11  | `INTEGRACAO_VER_PAYLOAD_MASCARADO` | Ver payload com PII mascarada (default operador)                                                                                                                                  | Média         |
| 12  | `INTEGRACAO_VER_PAYLOAD_CRU`       | Ver payload com PII em claro — **justificativa textual obrigatória + aprovação de supervisor (Tech Lead ou Auditor) com janela liberada por 30min apenas; log assinado WebAuthn** | **Crítica**   |
| 13  | `INTEGRACAO_APROVAR_DLQ`           | Aprovar item parado em Dead Letter Queue                                                                                                                                          | Alta          |
| 14  | `INTEGRACAO_ADMIN`                 | Tudo acima + reset/drop de filas (uso restrito a recovery)                                                                                                                        | Crítica       |

---

## 2. Matriz Role × Permissão

Legenda: **S** = sim padrão, **C** = sim (com condição), **N** = não, **D** = dual control obrigatório.

| Permissão                 | Operador | Supervisor | Tech Lead | Auditor | DPO |
| ------------------------- | :------: | :--------: | :-------: | :-----: | :-: |
| 1. VER_STATUS             |    S     |     S      |     S     |    S    |  S  |
| 2. VER_FILA               |    S     |     S      |     S     |    S    |  S  |
| 3. REPROCESSAR_ITEM       |    N     |     S      |     S     |    N    |  N  |
| 4. REPROCESSAR_FISCAL     |    N     |     D      |     D     |    N    |  N  |
| 5. PAUSAR_CONECTOR        |    N     |     S      |     S     |    N    | C¹  |
| 6. CONFIGURAR_CONECTOR    |    N     |     N      |     S     |    N    |  N  |
| 7. GERIR_CREDENCIAL       |    N     |     N      |     S     |    N    |  N  |
| 8. ROTACIONAR_CREDENCIAL  |    N     |     N      |     S     |    N    | C²  |
| 9. VER_AUDIT_LOG          |    N     |     C³     |     S     |    S    |  S  |
| 10. EXPORTAR_AUDIT_LOG    |    N     |     N      |    C⁴     |    S    |  S  |
| 11. VER_PAYLOAD_MASCARADO |    S     |     S      |     S     |    S    |  S  |
| 12. VER_PAYLOAD_CRU       |    N     |     N      |    C⁵     |   C⁵    | C⁵  |
| 13. APROVAR_DLQ           |    N     |     S      |     S     |    N    |  N  |
| 14. ADMIN                 |    N     |     N      |    C⁶     |    N    |  N  |

**Condições:**

- ¹ DPO pode pausar em incidente Sev1/Sev2.
- ² DPO pode disparar rotação emergencial.
- ³ Supervisor vê audit log do próprio turno.
- ⁴ Tech Lead exporta com justificativa registrada.
- ⁵ `VER_PAYLOAD_CRU` requer justificativa textual + aprovação de supervisor
  via WebAuthn + log Sev2 a cada acesso; expira em **30 min**.
- ⁶ `ADMIN` requer 2FA + dual control para operações destrutivas (drop/reset).

---

## 3. Regras transversais

- **Dual control criptográfico (D):** segundo aprovador autentica via
  **passkey WebAuthn/FIDO2** dentro de 5 min; assinatura R/S + timestamp
  fica armazenada no audit trail (não basta clique de aprovação ou nome no
  log — precisa de prova criptográfica). Spec completa em
  `WEBAUTHN-DUAL-CONTROL-SPEC.md`. Sem 2 perfis Tech Lead/Auditor
  disponíveis com passkey cadastrada, operação fica bloqueada.
- **Acesso a payload cru (C⁵):** triplo controle:
  (a) **justificativa textual obrigatória** descrevendo motivo e item;
  (b) **aprovação de supervisor** (Tech Lead ou Auditor) via assinatura
  WebAuthn — não basta clicar OK;
  (c) **janela temporária de 30 min** (não 4h) — após isso, sessão expira
  e nova justificativa é exigida;
  (d) log Sev2 contendo justificativa + IP + duração + assinatura
  WebAuthn do aprovador.
  Sem essa exigência, suporte com perfil correto vê PII permanentemente.
- **Mascaramento default:** UI do operador exibe CPF como `***.***.***-XX`, placa parcial `ABC-1**1`. Permissão #12 desbloqueia.
- **Expiração de elevação:** elevações temporárias (ex.: liberar `VER_PAYLOAD_CRU` por 4h) caducam automaticamente.
- **Onboarding/offboarding:** alteração de papel atualiza permissões em ≤1 minuto; revogação efetiva em ≤24h (SECRETS-MANAGEMENT.md).

---

## 4. Cross-links

- MATRIZ-PERMISSOES.md §12.2 — matriz mestre.
- THREAT-MODEL-INTEGRACAO.md §3 — LINDDUN L2/L5.
- DPIA-TEMPLATE.md — gate LGPD.
- SECURITY-INCIDENT-PLAYBOOK.md — uso emergencial pelo DPO.
- SECRETS-MANAGEMENT.md — off-boarding e rotação.
- WEBAUTHN-DUAL-CONTROL-SPEC.md — dual control criptográfico para
  REPROCESSAR_FISCAL e elevação a VER_PAYLOAD_CRU.
