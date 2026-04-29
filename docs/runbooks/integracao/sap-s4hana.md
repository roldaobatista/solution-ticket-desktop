# Runbook — Conector SAP S/4HANA

**Versão**: 1.0 — 2026-04-26
**Conector**: `sap-s4hana` (Global Tier-1)

> ⚠️ Para SAP, suporte L1 do cliente normalmente **não** vai resolver. Maioria dos casos escala para L2 ST + consultoria SAP do cliente.

---

## 1. Visão rápida

| Item       | Valor                                                             |
| ---------- | ----------------------------------------------------------------- |
| ERP        | SAP S/4HANA Cloud / On-Premise / ECC                              |
| Auth       | OAuth 2.0 (Cloud), Communication User (on-premise), mTLS opcional |
| Webhook    | Via SAP Event Mesh (Cloud) ou polling                             |
| Rate limit | Configurável por Communication Arrangement                        |

---

## 2. Top 10 erros SAP

### Erro 1 — "Material bloqueado" (`MIGO 421`)

**Causa**: MARA->MSTAE indica bloqueio.
**Solução**: SAP MM02 → desbloquear → reprocessar.

### Erro 2 — "Cliente bloqueado" (`KE 011`)

**Causa**: Business Partner com bloqueio (ordem/entrega).
**Solução**: SAP BP → desbloquear; reprocessar.

### Erro 3 — "Período fechado" (`M7 021`)

**Causa**: posting period MM fechado.
**Solução**: SAP MMRV/OB52 → reabrir período (financeiro do cliente); reprocessar.

### Erro 4 — "Estoque insuficiente" (`M7 162`)

**Causa**: tentando movimento de saída sem estoque.
**Solução**: validar com cliente; ajustar quantidade ou cancelar evento.

### Erro 5 — "Token OAuth expirado" (HTTP 401)

**Causa**: token expirou e refresh falhou.
**Solução**: Communication User do cliente → renovar; ST refresh automático tenta uma vez.

### Erro 6 — "Communication Arrangement inválido"

**Causa**: configuração SAP incompleta.
**Solução**: cliente reconfigura via SAP Cockpit; testes de conexão devem voltar verde.

### Erro 7 — "BAPI lock" (ECC)

**Causa**: outra transação bloqueou tabela.
**Solução**: retry com backoff resolve.

### Erro 8 — "Centro/depósito não autorizado"

**Causa**: usuário sem permissão para Plant/StorageLocation.
**Solução**: SAP Basis → liberar permissões.

### Erro 9 — "Pedido em status errado"

**Causa**: PO/SO em status que não permite movimento.
**Solução**: validar fluxo de aprovação SAP; cliente trata.

### Erro 10 — "Quantidade ultrapassa tolerância"

**Causa**: PO tem tolerância configurada (campo `WEBRE`).
**Solução**: validar tolerância; cliente ajusta ou aceita divergência manual.

---

## 3. Cenários SAP-específicos

### 3.1 Migração ECC → S/4HANA do cliente

1. Aviso prévio mínimo: 90 dias
2. Validar conector `sap-s4hana` em sandbox S/4
3. Plano de cutover coordenado
4. Sombra durante semana 1 do go-live SAP

### 3.2 Customização Z\* nova

- ABAP customizado pode mudar comportamento de BAPI
- Validar em sandbox antes de produção
- Mapping pode precisar de campo adicional

### 3.3 Event Mesh down

- Fallback para polling automático
- Latência aumenta de 5s para até 5 min
- Alerta dispara se Event Mesh > 10 min indisponível

---

## 4. Configuração (cliente novo) — alto nível

> ⚠️ Para SAP, **onboarding técnico Enterprise obrigatório** (R$ 100k+).

1. Discovery profundo (4 semanas)
2. Configuração Communication Arrangement (cliente + SAP partner)
3. Configuração Event Mesh (se aplicável)
4. Mapping customizado por vertical (agro, indústria, logística)
5. Homologação 5 fases (8 semanas total)
6. Modo Sombra (4 semanas)
7. GA

---

## 5. Limitações

- Certificação SAP exige tempo
- Communication Arrangement complicada de configurar
- Cada cliente tem schema customizado
- Performance varia muito (S/4HANA Cloud vs on-premise)

---

## 6. Métricas saudáveis

| Métrica                     | Esperado               |
| --------------------------- | ---------------------- |
| Latência média (Cloud)      | < 3s                   |
| Latência média (on-premise) | < 5s                   |
| Event Mesh availability     | > 99.9%                |
| DLQ                         | < 5 (alta criticidade) |
| Taxa erro técnico           | < 0.5%                 |

---

## 7. Quando escalar imediatamente para L2 ST + SAP consultor cliente

- P0 com impacto fiscal
- Erro de auditoria
- Performance degradada > 50%
- Communication Arrangement quebrada
- Mudança não-anunciada do SAP do cliente

---

## 8. Referências

- `docs/integracao/contratos/sap-s4hana.md`
- help.sap.com
- api.sap.com (Business Accelerator Hub)
- SAP Partner Program
