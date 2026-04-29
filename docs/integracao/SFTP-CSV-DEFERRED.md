# SFTP e CSV/XML Genérico — Deferidos para Fase 1

> **Status:** Decisão de escopo do MVP (Fase 0)
> **Owner:** PM + Tech Lead

---

## 1. Decisão

Os conectores **Genérico SFTP** e **Genérico CSV/XML** **não entram no MVP Fase 0**. Foram reescopados para a **Onda 1 da Fase 1** (Sprints 7-8).

## 2. Justificativa

- **Mock + REST cobrem o caminho crítico** do MVP: pilotos selecionados (Bling, Sankhya, Dynamics) usam REST. Mock cobre demonstração e desenvolvimento.
- SFTP adiciona complexidade real sem aumentar valor para o piloto:
  - Gestão de chaves SSH e secret rotation.
  - Watcher de diretório com semântica at-least-once em filesystem (lock files, atomic rename).
  - Códigos de erro de SFTP que precisam tratamento específico (timeout de transfer, permissão, quota cheia).
- CSV/XML genérico exige parser configurável (encoding, separator, schema, validation), e validação de NF-e/CT-e tem regras fiscais que sozinhas exigem 1 sprint de pesquisa + implementação.
- Nenhum dos clientes-alvo do piloto Fase 0 (definidos em `ICP-DEFINITION.md`) exige SFTP ou CSV como caminho primário.

Manter no MVP atrasaria entrega Fase 0 sem trazer cliente novo.

## 3. Plano de retomada

- **Fase 1, Onda 1 (Sprints 7-8):**
  - **Sprint 7:** SFTP genérico com 1 cliente legado piloto (TOTVS Protheus em ambiente que só expõe arquivos por SFTP).
  - **Sprint 8:** CSV/XML genérico com validação batch de NF-e e CT-e (schema XSD oficial SEFAZ).
- Reuso máximo da infraestrutura de outbox + retry + secret manager já entregue na Fase 0.

## 4. Migração e backlog

Clientes que precisarem de SFTP ou CSV antes da Onda 1 da Fase 1 entram em backlog priorizado por **RICE**:

| Critério                                 | Peso          |
| ---------------------------------------- | ------------- |
| Reach (n clientes afetados)              | 30%           |
| Impact (revenue + retenção)              | 30%           |
| Confidence (probabilidade de fechamento) | 20%           |
| Effort (semanas de eng)                  | 20% (inverso) |

Caso 1 cliente isolado pague pela antecipação, avaliar caso a caso com Tech Lead. Por padrão, esperar a Onda 1.

## 5. Comunicação

- Atualizar `COMMITMENTS-COMERCIAIS.md` para deixar explícito que MVP Fase 0 não inclui SFTP/CSV.
- Material comercial e demo do piloto não mencionam SFTP/CSV como disponíveis.
- Roadmap público (caso exista) lista SFTP e CSV como "Fase 1 — Q3" ou equivalente.
