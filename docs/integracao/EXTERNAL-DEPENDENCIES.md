# Dependencias Externas — Tratamento Agentico

**Status:** canonico  
**Referencia:** `RUNWAY-DEPENDENCIES-EXTERNAL.md`, `AGENT-GATES-MATRIX.md`

---

## 1. Regra

Dependencia externa nao bloqueia execucao tecnica do modulo. Ela define qual trilha comercial pode ser liberada.

- Sem sandbox real: usar Mock, contrato preliminar e Generic REST.
- Sem contrato/LOI: nao priorizar conector real por demanda; seguir chassi e conectores genericos.
- Sem certificacao ERP: conector pode chegar a `TECH_READY`, mas nao a `COMMERCIAL_GA_READY`.
- Sem aceite externo: homologacao tecnica fecha como `PILOT_READY` ou `TECH_READY`.

---

## 2. Subagentes de dependencia externa

| Subagente            | Responsabilidade                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `PartnerOpsAgent`    | SAP/TOTVS/Microsoft/Bling/Sankhya, sandboxes, portais, programas de parceiro               |
| `VendorPortalAgent`  | abrir chamados, baixar documentacao, rastrear credenciais e expiracoes                     |
| `ContractLegalAgent` | templates, DPA, NDA, e-sign, escrow, clausulas minimas                                     |
| `BillingEscrowAgent` | validar setup fee, escrow, notas e comprovantes                                            |
| `CommercialOpsAgent` | CRM, pipeline, proposta, follow-up e status MQL/SQL                                        |
| `HiringOpsAgent`     | substituir "contratacao" por capacidade agentica, escopo reduzido ou consultor sob demanda |

---

## 3. Tabela de dependencias

| Dependencia             | Estado agentico                      | Fallback                                                   | Estado maximo sem resolver |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------- | -------------------------- |
| Cliente piloto real     | `BLOCKED_EXTERNAL` se ausente        | cliente simulado + Mock + Generic REST                     | `TECH_READY`               |
| LOI/contrato assinado   | `BLOCKED_EXTERNAL` comercial         | priorizar por RICE tecnico; nao contar receita             | `TECH_READY`               |
| Setup fee/escrow        | `BLOCKED_EXTERNAL` financeiro        | plano enxuto automatico                                    | `PILOT_READY`              |
| Sandbox Bling/Sankhya   | `BLOCKED_EXTERNAL` ERP               | mocks + docs oficiais + fixtures                           | `TECH_READY`               |
| SAP PartnerEdge         | `BLOCKED_EXTERNAL` parceiro          | Dynamics/Sankhya primeiro; SAP permanece discovery         | `TECH_READY`               |
| TOTVS Partner           | `BLOCKED_EXTERNAL` parceiro          | Protheus via adapter cliente documentado; Sankhya primeiro | `TECH_READY`               |
| Code signing OV/EV      | bloqueador de distribuicao comercial | build interno/sandbox somente                              | `PILOT_READY`              |
| DPA/NDA/termo externo   | `BLOCKED_EXTERNAL` legal             | pacote draft + risco residual                              | `TECH_READY`               |
| Consentimento discovery | `BLOCKED_EXTERNAL` pesquisa          | dados anonimizados, suporte, telemetria                    | discovery parcial          |
| DPO/CISO pessoa real    | nao e gate interno                   | subagente especialista + pacote de evidencia               | `TECH_READY`               |

---

## 4. Automacao de prazo

Todo item externo tem `due_date`, `fallback_date` e `auto_action`:

```yaml
dependency: sandbox-sankhya
agent: PartnerOpsAgent
due_date: YYYY-MM-DD
fallback_date: YYYY-MM-DD
auto_action: 'usar contrato preliminar + MockErpConnector; mover Gateway novo para DISCOVERY-BLOCKERS.md'
max_state_without_resolution: TECH_READY
```

Ao vencer `fallback_date`, o orquestrador aplica `auto_action` sem reuniao.
