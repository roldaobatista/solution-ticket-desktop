# Evidence Manifest — Modulo Integracao ERP

**Status:** canonico para artefatos de execucao por agentes  
**Referencia:** `AGENTIC-EXECUTION-OPERATING-MODEL.md`, `AGENT-GATES-MATRIX.md`

---

## 1. Estrutura de pastas

```
docs/
  auditoria/
    agentic/
      YYYY-MM-DD-<gate>.md
  integracao/
    evidence/
      sprint-<n>/
        <story-id>/
          decision.md
          tests.log
          coverage.xml
          review-spec.md
          review-quality.md
          artifacts.json
    relatorios-homologacao/
      <erp>-<YYYY-MM-DD>.md
    incidentes/
      <YYYY-MM-DD>-<sev-ou-tabletop>.md
  comercial/
    evidence/
      YYYY-MM-DD-<tema>.md
  legal/
    evidence/
      YYYY-MM-DD-<tema>.md
```

---

## 2. Artefatos por historia

| Arquivo             | Obrigatorio quando           | Conteudo minimo                                           |
| ------------------- | ---------------------------- | --------------------------------------------------------- |
| `decision.md`       | toda historia                | decisao, agente executor, reviewers, criterios, resultado |
| `tests.log`         | toda historia com codigo     | comando, exit code, resumo de testes                      |
| `coverage.xml`      | historia com codigo testavel | cobertura de linhas novas e threshold aplicado            |
| `review-spec.md`    | toda historia                | conformidade com criterios de aceite                      |
| `review-quality.md` | toda historia                | riscos de qualidade, seguranca e manutencao               |
| `artifacts.json`    | toda historia                | hashes SHA-256, paths, timestamps e versoes               |

---

## 3. Artefatos por sprint

| Arquivo              | Sprint aplicavel | Observacao                              |
| -------------------- | ---------------- | --------------------------------------- |
| `ci.json`            | todos            | jobs executados, status e duracao       |
| `lint.log`           | todos com codigo | lint completo                           |
| `typecheck.log`      | todos com TS     | `tsc --noEmit` ou equivalente do pacote |
| `unit.log`           | todos com codigo | testes unitarios                        |
| `integration.log`    | S1+              | testes de integracao                    |
| `coverage.xml`       | todos com codigo | threshold progressivo do plano          |
| `tck.json`           | conectores/SDK   | suite TCK e percentual                  |
| `pact.txt`           | API/conectores   | contract tests                          |
| `schemathesis.log`   | API publica      | OpenAPI fuzz/contract                   |
| `dast.sarif`         | API/relay        | OWASP ZAP ou equivalente                |
| `semgrep.sarif`      | todos            | SAST                                    |
| `gitleaks.sarif`     | todos            | secret scanning                         |
| `slo-report.md`      | S5+ ou GA        | SLI/SLO, burn-rate, watermarks          |
| `playwright-report/` | UI               | screenshots e traces                    |
| `phase-decision.md`  | fim de fase      | GO/PIVOT/NO-GO agentico                 |

---

## 4. Artefatos por conector

| Fase                  | Artefatos                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Discovery             | contrato ERP, lacunas em `DISCOVERY-BLOCKERS.md`, fonte oficial ou justificativa de mock |
| Mapping               | YAML/JSONata validado, fixtures, teste de transformacao                                  |
| Implementacao         | TCK, unit/integration, contract test, rate-limit test                                    |
| H1 sandbox            | matriz H1 completa, logs com correlation IDs                                             |
| H2 erros              | classificacao tecnico/negocio, DLQ/retry, mensagens UI                                   |
| H3 carga              | relatorio de throughput, p95/p99, CPU/memoria, lock SQLite                               |
| H4 piloto/sombra      | cenario executado, telemetria, feedback, gaps                                            |
| H5 producao piloto    | 14 dias sem P0/P1 ou justificativa, SLO, rollback testado                                |
| `TECH_READY`          | todos os itens tecnicos acima                                                            |
| `COMMERCIAL_GA_READY` | `TECH_READY` + policy comercial + dependencias externas resolvidas                       |

---

## 5. Formato de `artifacts.json`

```json
{
  "storyId": "S1-01",
  "agent": "Backend-Agent",
  "reviewers": ["Architecture-Agent", "QA-Automation-Agent"],
  "commands": [
    {
      "cmd": "pnpm test -- integracao",
      "exitCode": 0,
      "log": "tests.log"
    }
  ],
  "artifacts": [
    {
      "path": "coverage.xml",
      "sha256": "<hash>"
    }
  ],
  "decision": "READY",
  "timestamp": "YYYY-MM-DDTHH:mm:ss-04:00"
}
```
