# Backlog Detalhado — Sprint 4 (Modelo Canônico + Mapping Engine)

**Sprint**: 4 — Fase 0 — semanas 9–10
**Total story points (recalibrado)**: 25 pts (era 43)
**Objetivo**: implementar **5 schemas canônicos core** + **Mapping Engine JSONata** com 5 transformações iniciais + validação.

> ⚠️ Replanejado: S4-04 (EquivalenceTable) movido para Sprint 5. S4-06 (Testes matriz) movido para Sprint 6. Schemas restantes (3 de 8) movidos para Sprint 5. Engine usa **JSONata** conforme ADR-011.

**Pré-requisitos**: Sprint 3 (Mock + retry + DLQ).

> **DoR e DoD por history**: ver `BACKLOG-SPRINT-0-1.md` (blocos no topo). Aplicam-se a todas as histórias.
> **Estratégia de testes**: ver `ESTRATEGIA-TESTES.md`.

---

## User Stories

### S4-01 — 8 schemas canônicos v1

**Como** Arquiteto
**Quero** todos os DTOs canônicos definidos com class-validator
**Para** que conectores tenham contrato estável

**Critérios de aceite**:

- [ ] `CanonicalWeighingTicket` (ticket completo conforme GUIA seção 6.2)
- [ ] `CanonicalPartner`
- [ ] `CanonicalProduct`
- [ ] `CanonicalVehicle`
- [ ] `CanonicalDriver`
- [ ] `CanonicalFiscalDocumentReference`
- [ ] `CanonicalInventoryMovement`
- [ ] `CanonicalAttachment`
- [ ] Cada schema com validação class-validator
- [ ] Versionamento: pasta `canonical/v1/`
- [ ] Documentação JSDoc completa em cada campo
- [ ] Testes de validação cobrindo edge cases (campos obrigatórios, formatos)

**Estimativa**: 8 pontos
**Responsável**: Tech Lead + Dev Sênior

---

### S4-02 — `MappingEngineService` com 9 transformações

**Como** Integrador
**Quero** engine que aplica YAML de mapping ao payload canônico
**Para** que conectores futuros não precisem de código de transformação

**Critérios de aceite**:

- [ ] Transformações suportadas: `direct`, `fixed`, `expression`, `lookup`, `unit-convert`, `date-format`, `normalize`, `condition`, `array-template`
- [ ] Função `apply(canonical, mappingYaml): remotePayload`
- [ ] Validação de mapping YAML antes de aplicar (catch typos)
- [ ] Erro de transformação produz mensagem clara
- [ ] Performance: < 50ms para payload de 10KB
- [ ] Cobertura ≥ 90%
- [ ] Documentação em `docs/integracao/006-mapping-engine.md`

**Estimativa**: 13 pontos
**Responsável**: Dev Sênior

---

### S4-03 — Parser e validador de YAML de mapping

**Como** Sistema
**Quero** validação rigorosa do YAML antes de salvar
**Para** evitar erro em runtime

**Critérios de aceite**:

- [ ] Schema JSON do mapping definido (validação via Ajv)
- [ ] Erros listados com linha/coluna
- [ ] Validação de campos obrigatórios por tipo de transformação
- [ ] Endpoint `POST /api/v1/integration/mapping/validate` para teste
- [ ] Retorno: `{ valid: true }` ou `{ valid: false, errors: [...] }`

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

### S4-04 — `EquivalenceTableService`

**Como** Integrador
**Quero** tabelas de equivalência (lookup) editáveis
**Para** mapear códigos locais ↔ códigos do ERP

**Critérios de aceite**:

- [ ] CRUD de `integracao_equivalence_table` e `integracao_equivalence_item`
- [ ] Cache em memória com TTL 5 min
- [ ] Lookup: `getEquivalence(tableName, localKey): remoteValue`
- [ ] Suporte a importação de CSV (massa de mapeamento)
- [ ] Endpoint `GET/POST /api/v1/integration/equivalence-tables`
- [ ] Permissão `INTEGRACAO_EDITAR`

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

### S4-05 — `ValidationService` pré-envio

**Como** Sistema
**Quero** validar payload antes de chamar conector
**Para** evitar 400 desnecessário do ERP

**Critérios de aceite**:

- [ ] Valida campos obrigatórios do mapping
- [ ] Valida formato (CNPJ válido, data ISO, etc.)
- [ ] Valida referências (lookup encontrado)
- [ ] Falha pré-envio classificada como `FAILED_BUSINESS` (não retenta)
- [ ] Mensagem de erro clara apontando campo problemático

**Estimativa**: 5 pontos
**Responsável**: Dev Pleno

---

### S4-06 — Testes de transformação (matriz de tipos)

**Como** QA
**Quero** matriz de testes cobrindo todas as combinações
**Para** garantir que mapping engine é robusto

**Critérios de aceite**:

- [ ] Tabela: 9 transformações × 5 cenários cada = 45 testes
- [ ] Edge cases: null, undefined, array vazio, string com caracteres especiais
- [ ] Performance test: 1000 transformações em < 500ms
- [ ] Documentação dos cenários

**Estimativa**: 5 pontos
**Responsável**: QA + Dev Pleno

---

### S4-07 — Helper de unit conversion (kg ↔ ton ↔ saca)

**Como** Sistema
**Quero** conversão precisa entre unidades de peso
**Para** evitar erros de quantidade no ERP

**Critérios de aceite**:

- [ ] Suporte: kg ↔ ton (1000), kg ↔ saca (configurável por produto)
- [ ] Precisão: 3 casas decimais
- [ ] Sem perda de precisão em round-trip (kg→ton→kg = original)
- [ ] Cobertura 100%

**Estimativa**: 2 pontos
**Responsável**: Dev Pleno

---

## Definition of Done do Sprint 4

- [ ] Todos os critérios validados
- [ ] DoD por history cumprida (cobertura ≥ 70% linhas novas; 95% em mapping engine)
- [ ] CI verde
- [ ] **TCK ≥ 80%** rodando contra Mock
- [ ] **Contract test verde** com matriz canônico → Bling/Omie/Mock
- [ ] **Smoke E2E** Playwright: ticket canônico → mapping → mock → SENT
- [ ] **SAST (Semgrep) verde** — sem high/critical em mapping (sandbox JSONata)
- [ ] Demo gravada
- [ ] Schemas canônicos publicados em `docs/integracao/002-modelo-canonico.md`
- [ ] Mapping Engine documentado em `docs/integracao/006-mapping-engine.md`
- [ ] **Evidências arquivadas em `docs/auditoria/sprint-4/`**

## Capacity

| Recurso    | Disponibilidade        |
| ---------- | ---------------------- |
| Tech Lead  | 50% (schemas críticos) |
| Dev Sênior | 100%                   |
| Dev Pleno  | 100%                   |
| QA         | 50%                    |

**Total story points**: 25 (recalibrado — S4-04 movido para Sprint 5; S4-06 movido para Sprint 5 (não Sprint 6 como originalmente proposto, em resposta a achado QA); 3 schemas restantes em Sprint 5)

## Riscos

| Risco                                                   | Mitigação                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| Schemas canônicos mal modelados afetam todos conectores | Tech Lead 50% no sprint; revisão em ADR-003                      |
| Mapping Engine fica complexo demais                     | Manter as 9 transformações; recusar features extras nesta versão |
| Expression evaluator inseguro                           | Usar `expr-eval` ou `jsonata` com sandbox; revisão de segurança  |
