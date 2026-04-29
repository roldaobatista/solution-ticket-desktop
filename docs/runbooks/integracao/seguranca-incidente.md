# Runbook — Incidente de Segurança (Integração)

**Escopo**: vazamento de credencial, comprometimento do hub, replay de
webhook, abuso da API pública `:3002`, exposição indevida de PII em logs.
**Audiência**: on-call + DPO + responsável técnico do tenant.
**Documentos correlatos**:
`docs/integracao/005-seguranca-credenciais.md`,
`docs/runbooks/integracao/dr-dpapi.md`,
`docs/legal/POLITICA-PRIVACIDADE.md` §11.

---

## 1. Detecção

Sinais que disparam este runbook:

- Alerta de replay (nonce duplicado em `integracaoNonceConsumido`).
- 401/403 anômalos na API pública `:3002` (>10/min sustentado).
- Token OAuth marcado revogado pelo ERP sem rotação programada.
- Tentativa de leitura de PII em log com mascaramento falhado (golden-file).
- Notificação externa (cliente, ERP, pesquisador, ANPD).

**Sev1**: PII vazada para fora do tenant. **Sev2**: credencial comprometida sem
exposição confirmada. **Sev3**: tentativa bloqueada.

## 2. Contenção (alvo: <1 h)

1. Isolar a superfície afetada — desabilitar o profile no Hub
   (`integracaoProfile.status = SUSPENDED`).
2. Revogar credenciais expostas no ERP (Bling/Omie/SAP/etc.) **antes** de
   rotacionar localmente.
3. Se hub comprometido: suspender o serviço (`solution-ticket.exe --stop`) e
   bloquear saída no firewall do cliente.
4. Preservar evidência: snapshot de `solution-ticket.db`, `electron.log`,
   `audit.log`, exporte tabela `tabela_auditoria` filtrada pelo intervalo.

## 3. Erradicação

1. Rotacionar credencial no cofre (DEK + segredo regerados — ver doc 005 §2.2).
2. Se KEK comprometida: rotacionar KEK em batch (re-cifra DEKs sem tocar
   segredos) e gerar nova KEK protegida via DPAPI `CurrentUser`.
3. Invalidar tokens OAuth — refresh token rotation (ADR-012:147) deve marcar
   replay como crítico; tokens vazados em backup devem ser invalidados em
   ≤7 dias.
4. Limpar caches de nonce envenenados; reaplicar matriz retenção×esquecimento
   sobre dados afetados.

## 4. Recuperação

1. Reabilitar profile com novas credenciais e validar `testar-conexao`.
2. Reprocessar outbox suspenso (idempotência por `eventId`).
3. Confirmar que SLOs voltam a verde por 60 min antes de fechar o incidente.
4. Comunicar cliente afetado em ≤48 h; ANPD em ≤72 h se houver PII de titular.
   SLA operador→controlador ≤7 dias úteis (Política §7).

## 5. Lições aprendidas

- Post-mortem em ≤7 dias úteis, sem culpabilizar pessoas.
- Atualizar corpus de fuzzing/golden-files se detecção falhou (doc 005 §4.4).
- Atualizar este runbook se a sequência precisou de improvisação.
- Revisar ADR-013/ADR-015/ADR-016 se a falha foi de design.
