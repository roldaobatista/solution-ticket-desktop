# Checklist consolidado — Homologação de Conector

**Referência**: `docs/integracao/PLANO-HOMOLOGACAO-CONECTOR.md`
**Uso**: marcar este checklist em cada conector novo. Versionar resultado em `docs/integracao/relatorios-homologacao/<erp>-<data>.md`.

---

## Pré-requisitos

- [ ] Sandbox do ERP estável e credenciais cadastradas no cofre
- [ ] Versão do conector congelada (tag git)
- [ ] Mapping YAML default revisado
- [ ] Massa de teste (§4 do PLANO) cadastrada
- [ ] Equipe (Tech Lead, Dev, Analista ERP, QA, cliente piloto) confirmada
- [ ] TCK ≥ % obrigatório por tier passando (ver TCK-SPEC §"Cobertura por tier")
- [ ] Contract tests (Pact) verdes contra Hub `prod` (ver CONTRACT-TESTING.md)

---

## H1 — Validação técnica em sandbox (3–5 dias)

- [ ] H1.01–H1.16 verdes (16/16) — ver tabela §5 do PLANO
- [ ] Cobertura testes do conector ≥ 80%
- [ ] Sem `console.log` ou logs com payload sensível (gitleaks + grep)
- [ ] Code review aprovado por 1 par
- [ ] Relatório H1 arquivado em `docs/integracao/relatorios-homologacao/`

## H2 — Cenários de erro (2–3 dias)

- [ ] H2.01–H2.08 (técnicos) verdes
- [ ] H2.09–H2.16 (negócio) verdes
- [ ] Classificação técnico/negócio correta em todos os cenários
- [ ] Mensagens claras (sem stack trace cru) na UI
- [ ] Relatório H2 arquivado

## H3 — Carga e resiliência (2 dias)

- [ ] H3.01–H3.08 verdes — ver tabela §7 do PLANO
- [ ] Throughput-alvo do tier atingido (ver §7 do PLANO)
- [ ] Latência p95 push < 2s
- [ ] Memória estável < 200MB em 24h
- [ ] CPU média < 30%
- [ ] Suite de chaos (RE-13..RE-16 do TCK) passando
- [ ] Relatório H3 arquivado

## H4 — Homologação assistida com cliente (2 semanas)

- [ ] H4.01–H4.10 executados pelo cliente sem ajuda após treinamento
- [ ] ≥ 100 pesagens reais sem incidente, sem perda, sem duplicação
- [ ] Termo de aceite de pré-produção assinado
- [ ] Runbook revisado com feedback
- [ ] **Pentest realizado** (DAST OWASP ZAP + revisão de chaves) — sem high abertos
- [ ] Relatório H4 + evidência de pentest arquivados

## H5 — Produção piloto sombra → ativo (2 semanas)

- [ ] Modo Sombra: 5 dias úteis com 0 divergência (H5.01–H5.05)
- [ ] Modo Ativo: 14 dias consecutivos sem incidente P0/P1
- [ ] Volume mínimo: ≥ 50 pesagens/dia em 10 dos 14 dias (Pro) / 200 ev/min sustentados (Enterprise)
- [ ] Pico testado: ≥ 1 dia com ≥ 80% volume estimado
- [ ] Diversidade: 3 dos top-10 erros do runbook efetivamente observados-e-resolvidos
- [ ] DLQ < 5 itens em qualquer momento
- [ ] Latência p95 < 2s sustentada
- [ ] Termo de aceite de produção definitiva assinado
- [ ] Runbook final + vídeo onboarding atualizados
- [ ] Aprovações finais (Tech Lead, Analista ERP, QA Lead, PM, Cliente, Diretoria comercial)
- [ ] Relatório H5 arquivado e marcação **GA** no portal

---

## Pós-GA

- [ ] Conector publicado no portal e pricing
- [ ] Sales + inside sales treinados
- [ ] Marketing publicou case (com permissão)
- [ ] Plano de monitoramento contínuo ativo (review semanal por 90 dias)
- [ ] Plano de rollback testado em mesa
