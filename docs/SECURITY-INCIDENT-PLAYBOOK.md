# Security Incident Playbook

> **Escopo:** incidentes de segurança envolvendo o Solution Ticket Desktop, módulo de integração ERP e infraestrutura de relay.
> **Owner agentico:** `Incident-Agent` + `Security-Agent` + `LGPD-Legal-Agent`.
> **Cross-link:** ON-CALL.md (escalação operacional), ADR-018 (audit log), MATRIZ-RETENCAO (preservação de evidência).

---

## 1. Classificação de severidade

| Sev      | Definição                                                                       | Exemplos                                                                                                        | SLA contenção       |
| -------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Sev1** | Vazamento ou comprometimento confirmado de PII / credenciais / chave de licença | Dump da outbox vazado; chave RSA exposta; tokens OAuth de cliente vazados                                       | **≤1 hora**         |
| **Sev2** | Incidente parcial — exposição limitada, contida, sem confirmação de exfiltração | Tentativa de SQLi bloqueada com payload, log access anômalo de operador, vazamento interno (suporte vê PII cru) | **≤4 horas**        |
| **Sev3** | Anomalia investigada — ainda não confirmada como incidente                      | Pico de 401 na API, alerta WAF Cloudflare, hash chain quebrada localmente                                       | **≤24 horas**       |
| **Sev4** | Falso positivo confirmado                                                       | Alarme indevido, scan automatizado externo sem impacto                                                          | Documentar e fechar |

---

## 2. Fluxo de resposta

```
Detecção → Triagem (15 min) → Contenção (Sev1: 1h) → Erradicação → Recuperação → Pós-mortem (5d)
```

### 2.1 Detecção

Fontes:

- Alertas WAF Cloudflare (relay).
- Alarme de hash chain do audit log.
- Reclamação cliente / canal `seguranca@solutionticket.com.br`.
- Pesquisa interna (rotação periódica, scan SCA).
- Notificação responsável da plataforma de partner (SAP, TOTVS, etc.).

### 2.2 Triagem (≤15 min)

Responsável: `Incident-Agent` ou ON-CALL primário quando houver operação real.

- Classificar Sev1-4.
- Acionar `LGPD-Legal-Agent` se Sev1 ou Sev2 com PII envolvida.
- Abrir ticket no rastreador com tag `security-incident`.
- Iniciar timeline (timestamp de cada ação).

### 2.3 Contenção

| Sev  | Ação imediata                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sev1 | Revogação massiva de tokens (`revoke-all-tokens.ps1`); bloquear IPs suspeitos no WAF; isolar estação afetada; pausar conector específico via feature flag |
| Sev2 | Bloquear vetor específico (IP, conta, conector); reduzir blast radius                                                                                     |
| Sev3 | Aumentar logging; manter operação                                                                                                                         |

### 2.4 Erradicação

- Identificar root cause (logs, audit chain, snapshot SQLite).
- Aplicar fix permanente.
- Rotacionar credenciais comprometidas + adjacentes.
- Validar ausência de persistência do atacante.

### 2.5 Recuperação

- Restaurar serviços normais.
- Re-emitir tokens novos para clientes.
- Smoke test pós-restauração.
- Comunicar normalização aos clientes afetados.

### 2.6 Pós-mortem (≤5 dias úteis)

- Documento `docs/incidents/INC-AAAA-MM-DD-<slug>.md`.
- Timeline, causa raiz (5 porquês), impacto, ações corretivas, owners, prazos.
- Atualizar THREAT-MODEL-INTEGRACAO.md se nova ameaça identificada.
- Revisão pelo DPO + Tech Lead em até 10 dias úteis.

---

## 3. Notificação ANPD (LGPD art. 48)

**Obrigatória em ≤72h após confirmação Sev1 com PII.**

- **Canal:** formulário oficial ANPD em `https://www.gov.br/anpd/pt-br/canais_atendimento/incidente-de-seguranca`.
- **Responsáveis agenticos:** `LGPD-Legal-Agent` prepara minuta, evidence pack e checklist; submissão/assinatura externa, se exigida, é `BLOCKED_EXTERNAL` e deve ser rastreada em `EXTERNAL-DEPENDENCIES.md`.
- **Conteúdo mínimo (art. 48 §1º):**
  1. Descrição da natureza dos dados afetados.
  2. Informações sobre os titulares.
  3. Indicação das medidas técnicas adotadas.
  4. Riscos relacionados ao incidente.
  5. Motivos da demora, se >72h.
  6. Medidas que foram ou serão adotadas para reverter ou mitigar.

**Template:** `docs/legal/templates/notificacao-anpd.md`.

---

## 4. Comunicação aos clientes integrados

**SLA:** 24h após confirmação Sev1.

**Canal:** e-mail ao contato técnico cadastrado + status page (quando existir).

**Template e-mail (resumo):**

```
Assunto: [Solution Ticket] Comunicação de incidente de segurança — <data>

Prezado(a) <Cliente>,

Em <data/hora> identificamos um incidente de segurança envolvendo
<descrição mínima sem detalhes que ajudem atacante>.

Impacto na sua operação:
- <descrever ou "Nenhum impacto identificado">

Medidas tomadas:
- Revogação de tokens em <data/hora>
- <outras ações>

Ação requerida do cliente:
- <ex.: re-autorizar conector em /integracao/conectores>

Responsável: DPO Solution Ticket — dpo@solutionticket.com.br
Próxima atualização: <data prevista>
```

---

## 5. Procedimento — revogação massiva de tokens

Script: `scripts/security/revoke-all-tokens.ps1` (modo seguro; exige configuração explícita para execução real).

```powershell
# Pseudocódigo
# 1. Lê inventário de conectores ativos do cofre DPAPI
# 2. Para cada conector, chama endpoint OAuth revoke do ERP
# 3. Marca credencial como REVOKED no SQLite
# 4. Pausa outbox (feature flag global integration.paused=true)
# 5. Gera audit log Sev1 e exporta para preservação
# 6. Notifica ON-CALL via webhook
```

**Quem pode executar:** `Incident-Agent` em modo dry-run/evidence; execução real exige credencial operacional configurada e dual-control do produto quando disponível.

---

## 6. Forense — preservação de evidência

| Artefato                | Como preservar                                   | Cadeia de custódia                                 |
| ----------------------- | ------------------------------------------------ | -------------------------------------------------- |
| Audit log (hash chain)  | Snapshot imediato + replicação para storage WORM | Hash do snapshot registrado em ticket + assinatura |
| SQLite outbox           | Cópia binária com VACUUM INTO + hash SHA-256     | Idem                                               |
| Logs de aplicação       | Tar + gzip do diretório de log                   | Idem                                               |
| Logs Cloudflare relay   | Export Cloudflare Logpush para R2 retenção 1 ano | Token de acesso restrito                           |
| Memória (se necessário) | Dump via Sysinternals ProcDump                   | Apenas com autorização DPO                         |

**Cadeia de custódia:** quem coletou, quando, hash do artefato, onde está armazenado, quem acessou desde então. Registro em `docs/incidents/INC-.../chain-of-custody.md`.

---

## 7. Escalação

| Quando            | Quem                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Sev1 confirmado   | ON-CALL/Incident-Agent → Security-Agent → LGPD-Legal-Agent → external legal contact se configurado (≤30min) |
| Notificação ANPD  | LGPD-Legal-Agent prepara minuta/evidence pack; ato externo rastreado em ≤72h                                |
| Cliente impactado | Commercial-Agent prepara comunicação em ≤24h                                                                |
| Imprensa pergunta | Commercial-Agent prepara holding statement; porta-voz externo é dependência externa                         |

Lista de contatos atualizada em `ON-CALL.md` (telefone, e-mail, backup).

---

## 8. Cross-links

- ON-CALL.md — escalação operacional 24/7
- ADR-018 — audit log + hash chain
- ADR-020 — supply chain
- THREAT-MODEL-INTEGRACAO.md — top threats e mitigações
- MATRIZ-RETENCAO — preservação de evidência
- DPIA-TEMPLATE.md — gate LGPD
- SECRETS-MANAGEMENT.md — cofres e rotação
