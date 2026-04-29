# Discovery Blockers — Conectores ERP

**Status:** vivo  
**Owner agentico:** `ERP-Specialist-Agent` + `PartnerOpsAgent`

---

## 1. Regra

Toda lacuna factual de ERP deve virar blocker rastreavel com fonte exigida, procedimento de verificacao, fallback e estado maximo permitido. Termos como "a confirmar", "preliminar", "validar depois" e "depende do cliente" nao podem ficar soltos em contrato.

---

## 2. Blockers conhecidos

| ID     | ERP            | Lacuna                                                  | Fonte exigida                                                   | Fallback                                                     | Estado maximo                   |
| ------ | -------------- | ------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------- |
| DB-001 | Sankhya        | Gateway novo tem paths preliminares                     | documentacao oficial Sankhya ou sandbox cliente                 | usar MGE classico validado ou Mock                           | `TECH_READY`                    |
| DB-002 | TOTVS Protheus | endpoint REST de movimento e custom por cliente         | adapter ADVPL/TLPP do cliente ou doc TOTVS do servico publicado | Generic REST com `{cliente.adapterPath}`                     | `TECH_READY`                    |
| DB-003 | SAP S/4HANA    | deep insert via `$batch` e Event Mesh variam por edicao | SAP API Business Hub + sandbox                                  | limitar a fluxo sandbox documentado                          | `TECH_READY`                    |
| DB-004 | Bling          | scopes/rate limits/webhook podem mudar                  | docs oficiais atuais + teste OAuth                              | contract test contra mock com limites parametrizados         | `PILOT_READY`                   |
| DB-005 | Conta Azul     | endpoint de vendas pendente                             | docs oficiais ou sandbox                                        | manter conector em discovery                                 | `TECH_READY`                    |
| DB-006 | Mapping        | mistura JSONata e Mustache em docs legados              | `MAPPING-ENGINE-SCOPE.md` + ADR-011                             | JSONata canonico; Mustache so em CSV/template legado marcado | `READY_FOR_AGENT` apos correcao |
| DB-007 | Secrets        | escolha 1Password vs Vault/YubiKey                      | `SECRETS-MANAGEMENT.md` + threat model                          | DPAPI local + secret scanning ate decisao                    | `PILOT_READY`                   |

---

## 3. Formato para novos blockers

```md
### DB-XXX — <ERP/tema>

- **Fonte do problema:** arquivo:linha
- **Pergunta factual:** ...
- **Fonte aceita:** documentacao oficial, sandbox, contrato tecnico, suporte fornecedor
- **Subagente responsavel:** ...
- **Comando/procedimento:** ...
- **Fallback:** ...
- **Estado maximo sem resolver:** TECH_READY | PILOT_READY | BLOCKED_EVIDENCE
```
