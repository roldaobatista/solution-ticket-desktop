# Secrets Management — Cliente e Lado Fornecedor

> **Escopo:** gestão de segredos do Solution Ticket — credenciais armazenadas no equipamento do cliente e segredos corporativos do fornecedor.
> **Owner:** Tech Lead (cliente) + Roldão/DPO (fornecedor).
> **Cross-link:** ADR-016 (DPAPI), ADR-020 (supply chain), SECURITY-INCIDENT-PLAYBOOK.md.

---

## 1. Lado cliente (estação Windows)

### 1.1 Mecanismo principal

- **DPAPI CurrentUser** (Windows Data Protection API) — ADR-016.
- Vincula o blob criptografado ao **par usuário Windows + máquina**.
- Backup do arquivo criptografado isolado **não** revela conteúdo (não há credencial mestre que possa ser exportada).

### 1.2 Alternativa avaliada

- **node-keytar** — avaliado e descartado como mecanismo padrão (nota em ADR-016): API mais ergonômica, mas adiciona dependência nativa volumosa e foi alvo de incidentes de supply chain. Mantido como fallback documentado caso DPAPI falhe.

### 1.3 Rotação no cliente

| Tipo de credencial                           | Prazo padrão             | Disparo emergencial      |
| -------------------------------------------- | ------------------------ | ------------------------ |
| OAuth refresh token (SAP, TOTVS, MS, Oracle) | ≤90 dias                 | Incidente Sev1/Sev2      |
| API key estática (ContaAzul, Bling)          | ≤180 dias                | Incidente Sev1/Sev2      |
| Senha de cofre local                         | A cada troca de operador | Imediato em desligamento |

Job interno do app calcula a idade da credencial e exibe alerta na UI 15 dias antes do vencimento; bloqueia uso após vencimento.

---

## 2. Lado fornecedor (corporativo)

### 2.1 Cofre

#### Decisão pré-Sprint 0: 1Password Business vs HashiCorp Vault

**Decisão default** (revisar antes de Sprint 0): **1Password Business no
MVP**, migrar para HashiCorp Vault se a equipe DevOps crescer
(>5 engenheiros) ou se o volume de segredos ultrapassar 200 itens.

**Trade-offs**:

| Critério           | 1Password Business                                             | HashiCorp Vault                                                                 |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Curva de adoção    | Baixa — UI familiar                                            | Alta — CLI, policies HCL                                                        |
| Custo              | ~USD 8/usuário/mês (~R$ 250/usuário/mês com câmbio + impostos) | Open-source self-host (infra ~R$ 500-1500/mês) ou HCP (~USD 0,03/h por cluster) |
| Audit log          | Integrado, exportável SIEM                                     | Audit devices configuráveis (file, syslog, socket)                              |
| Rotação automática | Limitada (manual + integrações)                                | Dynamic secrets nativos (DB, AWS, Cloud)                                        |
| Segredos dinâmicos | Não                                                            | Sim — credenciais efêmeras                                                      |
| Compliance         | SOC 2 Type II + ISO 27001                                      | Self-host: depende de operação                                                  |
| Operação 24/7      | Não exige — SaaS                                               | Exige SRE para HA (Raft, replicação)                                            |

**Critérios de migração** para Vault (re-avaliar a cada 6 meses):

- Equipe DevOps >5 engenheiros, OR
- Volume de segredos >200 itens, OR
- Necessidade de credenciais dinâmicas (rotação automática <24h), OR
- Cliente Enterprise exige Vault em arquitetura.

**Esta decisão precisa ser registrada em ADR antes de Sprint 0** —
abrir `ADR-021-cofre-corporativo.md` (owner Roldão + Tech Lead).

### 2.2 Inventário mínimo

| Segredo                                             | Onde está hoje            | Onde deve estar               | Prioridade  |
| --------------------------------------------------- | ------------------------- | ----------------------------- | ----------- |
| SAP PartnerEdge — chave de cliente API              | _a definir_               | Cofre                         | Alta        |
| TOTVS Partner — credenciais portal                  | _a definir_               | Cofre                         | Alta        |
| Microsoft AppSource — Azure tenant secrets          | _a definir_               | Cofre                         | Alta        |
| Oracle SuiteCloud — credenciais ISV                 | _a definir_               | Cofre                         | Alta        |
| Chave RSA `keygen/private.key` (assinatura licença) | **Repositório (legado)**  | **Cofre — urgente**           | **Crítica** |
| Tokens CI/CD (npm publish, GitHub Actions)          | GitHub Secrets            | GitHub Secrets + backup cofre | Média       |
| Cert code signing (OV/EV)                           | Token físico ou KMS       | KMS + backup cofre            | Alta        |
| Credenciais Cloudflare (relay)                      | _a definir_               | Cofre                         | Alta        |
| DPAPI master backup (corporativo)                   | N/A — DPAPI é por máquina | N/A                           | —           |

### 2.3 Acesso

- **Princípio do menor privilégio:** cada pessoa só acessa segredos necessários para sua função.
- **Logs de acesso a secrets:** cofre registra leitura; revisão mensal pelo Tech Lead.
- **MFA obrigatório** no cofre.
- **Compartilhamento por vault item**, nunca por chat / e-mail / arquivo.

#### MFA hardware obrigatório (FIDO2/YubiKey)

Para um conjunto restrito de segredos, MFA hardware é **obrigatório**
(não basta TOTP de aplicativo). Lista:

- Chave RSA `keygen/private.key` (assinatura de licença).
- Credenciais SAP PartnerEdge / TOTVS Partner / Microsoft AppSource /
  Oracle SuiteCloud.
- Tokens CI/CD com permissão de assinar release (GitHub Actions OIDC
  - npm publish).
- Cert code signing OV/EV (ADR-020) e respectivo PIN do token HSM.
- Master keys do cofre corporativo (recovery seeds).

**Padrão**: YubiKey 5 (NFC ou USB-C, conforme dispositivo) ou compatível
**FIDO2 + WebAuthn**. SMS NÃO é aceito (vulnerável a SIM swapping); TOTP
de app NÃO é aceito para esses segredos (replicável em phishing
sofisticado).

**Custo**: ~R$ 250/YubiKey × 5 pessoas (Roldão + Tech Lead + 2 SREs +
DPO) = **R$ 1.250 one-time**, +20% para chaves de backup (1 por pessoa
guardada em cofre físico) → **~R$ 1.500 total**. Reposição em caso de
perda: imediata, dentro de 24h.

**Onboarding**: nova pessoa que precisa desses segredos recebe 2 chaves
(primária + backup), cadastra em cofre + serviços partner, **proibido
sair do dia 1 sem ambas registradas**.

### 2.4 Off-boarding

**SLA: ≤24h após desligamento ou mudança de função.**

1. Revogar acesso ao cofre.
2. Rotacionar todos os segredos que a pessoa **possa ter acessado** nos últimos 30 dias (não apenas os comprovadamente acessados).
3. Atualizar o inventário.
4. Auditoria: registrar lista de segredos rotacionados em ticket.

---

## 3. Procedimento de rotação programada

### 3.1 Calendário

| Frequência | Itens                                          |
| ---------- | ---------------------------------------------- |
| 90 dias    | OAuth tokens cliente, tokens CI/CD             |
| 180 dias   | API keys estáticas                             |
| Anual      | Cert code signing, chaves de programa partner  |
| Por evento | Mudança de pessoa, suspeita de comprometimento |

### 3.2 Passo a passo (programada)

1. Notificar equipe 7 dias antes (canal interno).
2. Gerar novo segredo em janela de baixo tráfego.
3. Atualizar cofre + ambiente (CI, app cliente via release).
4. Validar funcionamento (smoke test do conector).
5. Revogar segredo antigo.
6. Registrar em audit log + ticket de rotação.

---

## 4. Procedimento de rotação emergencial

**Disparo:** incidente Sev1/Sev2 (SECURITY-INCIDENT-PLAYBOOK.md).

1. Executar `revoke-all-tokens.ps1` (ver playbook §5).
2. Gerar novos segredos imediatamente.
3. Distribuir aos clientes via release de emergência ou comunicação direta.
4. Pausar conectores afetados (feature flag) até confirmação.
5. Atualizar inventário + audit log.
6. Registrar em pós-mortem.

---

## 5. Cross-links

- ADR-016 — DPAPI no cliente.
- ADR-020 — supply chain.
- SECURITY-INCIDENT-PLAYBOOK.md §5 — revogação massiva.
- CERT-OBLIGATIONS-MATRIX.md — chaves de programa partner.
- ON-CALL.md — escalação.
