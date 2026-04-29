# Estratégia de Testes — Módulo Integração ERP

**Versão**: 1.0 — 2026-04-27
**Resolve**: Auditoria 10-agentes Rodada 5 — Agente 5 (QA), findings sobre pirâmide ausente, contract testing inexistente, DoR/DoD frágeis.
**Aplica-se a**: Hub de Integração, Conectores ERP, API Pública v1, SDK público.

---

## 1. Princípios

1. **Testar comportamento, não implementação.** Nada de testar getter/setter; testar regra de negócio observável.
2. **Pirâmide invertida = anti-padrão.** Mais E2E que unit = lento, frágil, falsos positivos.
3. **Confiar no CI.** Não duplicar localmente o que o CI já roda. Local: o teste específico em foco.
4. **Falha no CI bloqueia merge.** Sem `--no-verify`. Sem `skip`. Quebrou, corrige.
5. **Cobertura é piso, não teto.** 70% nas linhas novas, mas crítico (idempotência, outbox, mapping) = 95%+.

---

## 2. Pirâmide alvo

| Camada                 | %   | Volume estimado | Tempo CI |
| ---------------------- | --- | --------------- | -------- |
| Unit                   | 70% | ~800 testes     | < 60s    |
| Integration + Contract | 20% | ~220 testes     | < 5min   |
| E2E                    | 10% | ~110 testes     | < 15min  |

**Justificativa**: módulo lida com I/O (ERP, banco, fila). Unit isola lógica pura (mapping, idempotency, retry). Integration testa Hub↔Banco, Hub↔Conector mock. Contract garante compatibilidade Hub↔Conector real. E2E valida fluxo completo em homologação.

---

## 3. Camada → ferramenta

| Camada                  | Ferramenta                                                                       | Onde roda                                  |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| **Unit**                | Vitest                                                                           | Local + CI (todo PR)                       |
| **Integration (banco)** | Vitest + Prisma test DB (SQLite em memória)                                      | CI (todo PR)                               |
| **Contract**            | Pact (Hub consumer / Conector provider) ou Schemathesis (API pública vs OpenAPI) | CI (todo PR)                               |
| **E2E (módulo)**        | Playwright + ambiente de homologação ERP                                         | CI nightly + pré-release                   |
| **E2E (UI)**            | Playwright (frontend Next.js)                                                    | CI nightly                                 |
| **Chaos**               | toxiproxy + scripts custom                                                       | Mensal pós-GA                              |
| **SAST**                | Semgrep (regras OWASP + custom para credenciais)                                 | CI todo PR                                 |
| **DAST**                | OWASP ZAP contra `:3002` (API pública)                                           | CI nightly + pré-release                   |
| **Secret scanning**     | gitleaks                                                                         | CI todo PR (pre-commit hook + server-side) |
| **Dependência**         | `pnpm audit` (CI todo PR) + Snyk (semanal)                                       | CI                                         |
| **Performance**         | k6 + custom histograms (Vitest bench)                                            | CI weekly                                  |

---

## 4. Cobertura por componente do Hub

| Componente                   | Unit % alvo | Integration                | Contract                      | E2E                       |
| ---------------------------- | ----------- | -------------------------- | ----------------------------- | ------------------------- |
| **Mapping engine** (JSONata) | 95%         | sim (10 templates por ERP) | n/a                           | sim (1 ticket → ERP real) |
| **Outbox**                   | 95%         | sim (lock pessimista)      | n/a                           | sim                       |
| **Inbox** (webhooks)         | 90%         | sim                        | sim (HMAC valid)              | sim                       |
| **Retry policy**             | 100%        | sim                        | n/a                           | sim (chaos)               |
| **Scheduler/Worker**         | 80%         | sim (concorrência)         | n/a                           | sim                       |
| **API pública v1**           | 80%         | sim                        | sim (Schemathesis vs OpenAPI) | sim                       |
| **Conectores** (cada um)     | TCK 100%    | sim (sandbox)              | Pact obrigatório              | H1–H5                     |
| **DPAPI / cofre**            | 95%         | sim                        | n/a                           | sim                       |

**Regra**: PR que reduz cobertura em arquivo crítico (>1pp) = bloqueado.

---

## 5. Testes não-funcionais

### 5.1 SAST (Semgrep)

- Rodando em todo PR.
- Regras OWASP Top-10 + regras custom: detectar `console.log` com PII, `rejectUnauthorized: false`, hardcoded credentials, `eval()`, JSONata sem whitelist.
- Findings high/critical = bloqueio de merge.

### 5.2 DAST (OWASP ZAP)

- Alvo: API pública em `:3002` (após Sprint 5).
- Cenários: injection, auth bypass, replay, IDOR, missing rate-limit.
- Rodando nightly + pré-release.
- Findings high/critical = bloqueio de release.
- Pós-Sprint 8: exigência DoD por sprint (ver §8).

### 5.3 Secret scanning (gitleaks)

- Pre-commit hook (cliente) + GitHub Actions (servidor).
- Bloqueia push se detectar token, API key, certificado, PEM.
- Histórico do repo escaneado mensalmente.

### 5.4 Dependência

- `pnpm audit --audit-level=high` em todo PR (bloqueia high+).
- Snyk semanal (cobre o que `pnpm audit` perde).
- Updates de segurança = SLA 7 dias úteis para crítico, 30 dias para high.

---

## 6. Test data

### 6.1 Massa sintética

- Versionada em `tests/fixtures/` (faker seeds determinísticos).
- Cobertura: 50 clientes/fornecedores, 100 produtos, 500 pesagens com mix de cenários (umidade, tara, desconto, cancelamento, correção).
- Regenerável via `pnpm test:fixtures:rebuild`.

### 6.2 Anonimização obrigatória de pesagens reais

- **Proibido**: subir pesagem real (com CPF/CNPJ/placa real) em fixture, snapshot, log de teste.
- **Pipeline de anonimização**: CPF → SHA-256(CPF + salt). CNPJ → idem. Placa → mantém formato, randomiza dígitos. Razão social → `Empresa-{hash:8}`.
- Script: `scripts/anonimizar-pesagens.ts` (uso interno).
- CI roda gitleaks + regex CPF/CNPJ em fixtures; falha = bloqueio.

---

## 7. Chaos engineering

### 7.1 Ferramenta

- **toxiproxy** entre Hub e ERP (sandbox).
- Cenários executados via script declarativo (YAML).

### 7.2 Cadência

- **Antes do GA**: smoke chaos como parte de H3 (carga + resiliência).
- **Pós-GA**: drill mensal em ambiente de homologação.
- **Anual**: drill em produção (janela controlada, comunicado a clientes Tier-1).

### 7.3 Cenários mínimos

| ID    | Cenário                                | Esperado                                |
| ----- | -------------------------------------- | --------------------------------------- |
| CH-01 | Kill worker mid-flight                 | Recovery ≤ 5min, 0 perda, 0 duplicação  |
| CH-02 | Latency injection 5s no ERP            | Workers não travam; backoff ativa       |
| CH-03 | Drop ACK do ERP (200 ok mas TCP reset) | Retry; idempotency evita duplicação     |
| CH-04 | Sandbox externo down >2h               | Fallback para stub local (TCK-SPEC §9)  |
| CH-05 | Clock skew 30s                         | Tokens válidos; HMAC respeita janela    |
| CH-06 | Disco cheio (90%)                      | Backpressure ativa, não corrompe outbox |

---

## 8. Bug bounty

| Fase                | Quando                                         | Escopo                                                   |
| ------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **Interno fechado** | Sprint 12+ (após Bling/Omie/ContaAzul GA)      | Time interno + 3 parceiros piloto. Recompensa simbólica. |
| **Externo gated**   | 2027 Q1 (avaliar HackerOne ou BugCrowd)        | Lista controlada de pesquisadores. CVE coordenado.       |
| **Externo público** | Apenas após 6 meses estável + revisão jurídica | Programa público com payout.                             |

Critério de progressão: 0 critical + ≤ 2 high abertos no scope, por 3 meses consecutivos.

---

## 9. Como rodar localmente

```bash
# Unit (rápido — escolher arquivo específico)
pnpm test src/integracao/mapping/jsonata.spec.ts

# Integration de um componente
pnpm test:integration outbox

# Contract (Pact) consumer-side
pnpm test:contract

# E2E (precisa sandbox)
pnpm test:e2e --erp=bling --tag=H1
```

**Nunca rodar suite completa local em meio de task.** Escalar: específico → grupo → suite (apenas pré-PR final, e mesmo assim CI cobre).

---

## 10. Referências

- `TCK-SPEC.md` — Test Conformance Kit (`@solution-ticket/connector-tck`)
- `CONTRACT-TESTING.md` — Pact setup Hub↔Conector
- `PLANO-HOMOLOGACAO-CONECTOR.md` — H1–H5 com critérios de aprovação
- `BACKLOG-SPRINT-*.md` — DoR/DoD por sprint referenciam este doc
