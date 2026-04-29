# Minuta de Notificação ANPD — Incidente de Segurança

**Status:** template agentico; revisar dados e exigências vigentes antes de submissão externa  
**Owner agentico:** `LGPD-Legal-Agent`  
**Incidente:** {INC-YYYY-MM-DD-slug}

---

## 1. Identificação

| Campo                    | Valor                                  |
| ------------------------ | -------------------------------------- |
| Controlador              | {Razão social / CNPJ}                  |
| Encarregado/DPO          | {Nome / contato ou `BLOCKED_EXTERNAL`} |
| Canal de contato         | {e-mail / telefone}                    |
| Data/hora de ciência     | {YYYY-MM-DD HH:mm TZ}                  |
| Data/hora de confirmação | {YYYY-MM-DD HH:mm TZ}                  |

---

## 2. Natureza do incidente

{Descrever em linguagem objetiva, sem detalhes que ampliem risco operacional.}

---

## 3. Dados pessoais afetados

| Categoria     | Exemplos         | Volume estimado | Titulares afetados |
| ------------- | ---------------- | --------------- | ------------------ |
| Identificação | CPF, nome        | {N}             | {N}                |
| Veicular      | placa            | {N}             | {N}                |
| Contato       | e-mail, telefone | {N}             | {N}                |

---

## 4. Medidas técnicas adotadas

- {contenção 1}
- {revogação/rotação}
- {bloqueio WAF/feature flag}
- {restore/rollback}

---

## 5. Riscos aos titulares

{Classificação do risco, probabilidade, impacto e mitigação.}

---

## 6. Medidas futuras

- {ação corretiva}
- {prazo}
- {subagente/owner externo}

---

## 7. Evidence pack

| Artefato               | Caminho/hash |
| ---------------------- | ------------ |
| Timeline               |              |
| Chain of custody       |              |
| Logs/hash chain        |              |
| Tokens revogados       |              |
| Comunicação a clientes |              |

---

## 8. Status externo

☐ Minuta pronta  
☐ Revisão externa pendente (`BLOCKED_EXTERNAL`)  
☐ Submissão externa registrada em {protocolo}
