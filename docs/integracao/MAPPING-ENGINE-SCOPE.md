# Mapping Engine — Reescopagem para 2 Sprints

> **Status:** Vigente a partir do replanejamento da auditoria 5-especialistas
> **Owner:** Tech Lead + Eng Sr
> **Sprints alvo:** Sprint 4 (core) + Sprint 5 (UX e validação)

---

## 1. Contexto

O escopo original do Mapping Engine cabia em 1 sprint (Sprint 4). A auditoria de Engenharia identificou que 1 sprint é insuficiente para entregar **com qualidade testada** o conjunto de capacidades necessárias mesmo em MVP. Sem reescopagem, o resultado seria um motor sem UI de teste e sem validador de schema, jogando depuração para o tempo de homologação de cada conector — o que multiplica custo no Sprint 6+.

A entrega passa a 2 sprints com escopo dividido por capacidade.

## 2. Sprint 4 — Core do Engine

### Em escopo

- Avaliador JSONata embarcado (lib oficial), usando whitelist de funções definida em `006-mapping-engine §4.10`.
- Funções de **lookup** (carregar de tabelas internas: CFOP, NCM, unidade-medida).
- Funções de **conversão de unidade** (kg ↔ ton, real ↔ centavos, ISO date ↔ UTC).
- **Condicional ternário simples** (`x ? y : z`); sem `if-elif` complexo.
- Limites técnicos enforcement (ADR-011): AST max depth 32, output max 1MB, expressão max 8KB, timeout 100ms.
- Testes unitários cobrindo cada função da whitelist + cada limite técnico (caso PASS e caso FAIL).
- Integração com outbox (mapping é aplicado antes do dispatch).

### Critério de aceitação Sprint 4

- 100% das funções da whitelist têm teste unitário.
- Cada limite técnico tem teste que comprova o corte (depth > 32 → erro; output > 1MB → erro; timeout 100ms → erro).
- Conector Mock consegue usar mapping para produzir JSON canônico.

## 3. Sprint 5 — UX, validação, debug

### Em escopo

- **UI básica de teste** dentro do Painel: input canônico (textarea JSON) + mapping (textarea JSONata) + output renderizado com diff highlight.
- **Validação de schema**: usar Ajv ou Zod para validar input contra schema canônico e output contra schema do conector. Erros exibidos com path + mensagem.
- **Debugger passo a passo**: para uma expressão JSONata, mostrar o valor intermediário em cada nó do AST quando o usuário clicar "step". Implementação minimalista, suficiente para diagnóstico de mapping de conector novo.
- Documentação de antipadrões (`$reduce` recursivo profundo, `$map` aninhado, etc.) com exemplo do erro e como reescrever.

### Critério de aceitação Sprint 5

- UI permite carregar payload canônico real do banco e ver mapping aplicado.
- Validador de schema bloqueia mapping que produz output inválido para o conector alvo.
- Debugger funciona para todas as funções da whitelist.
- Documentação de antipadrões publicada em `docs/integracao/`.

## 3.5. Banda de execução com buffer

A meta declarada é **2 sprints (Sprint 4 + 5)**, com **buffer opcional de 2 sprints (Sprint 6 + 7)** caso a entrega do MVP não atenda os critérios de saída ao final do Sprint 5.

Justificativa do buffer: histórico público de produtos similares (Talend Data Mapper, Boomi Map, Mulesoft DataWeave) mostra que **mini-iPaaS leva 4-6 sprints quando feito direito**. Forçar 2 sprints sem rede vira "engine que funciona em demo, mas qualquer conector novo trava em depuração".

### Distribuição

- **Sprint 4 (core)**: avaliador JSONata + funções da whitelist + limites técnicos + integração com outbox.
- **Sprint 5 (UX básica)**: UI de teste + validação Ajv/Zod + debugger step-by-step minimalista + documentação de antipadrões.
- **Sprint 6 (buffer 1, se necessário)**: debugger avançado (breakpoints em expressões, watch de variáveis intermediárias) + biblioteca de transformações reutilizáveis entre clientes do mesmo segmento (CFOP, NCM, conversões fiscais).
- **Sprint 7 (buffer 2, se necessário)**: editor visual básico (form-based, não drag-drop completo) — apenas se ≥ 3 conectores PME exigirem ajustes que UX-textual não resolve.

### Regra de auto-gatilho

- Se ao final de **Sprint 5** o critério de saída do MVP (§3.6) não for 100% atendido, Sprint 6 é **automaticamente alocado** sem repactuação — buffer já está nominal no plano.
- Se ao final de **Sprint 6** ainda faltar capacidade, Sprint 7 é alocado com aviso ao Tech Lead + PM.

## 3.6. Critério de saída do MVP

O Mapping Engine é considerado **MVP entregue** quando, ao mesmo tempo:

1. **12 transformações JSONata** estão cobertas e testadas — incluindo: lookup CFOP, lookup NCM, conversão kg↔ton, real↔centavos, ISO↔UTC, concatenação com fallback, condicional ternário, `$reduce` controlado, normalização de string (trim/upper/lower), parsing de número BR↔US, formatação de data BR↔ISO, mapeamento de enum por tabela.
2. **UI funcional** dentro do Painel — input canônico + textarea JSONata + output renderizado + diff highlight + erro com path.
3. **Debugger step-by-step** funciona em todas as 12 transformações da lista anterior.
4. **4 conectores PME** (Mock + 3 PME reais — TOTVS Protheus light, Bling, Tiny por exemplo) usam o engine **sem hack** (sem código Java/JS no conector para "completar" o que o engine não faz).

Faltou qualquer um desses 4 ao final de Sprint 5 → Sprint 6-7 são auto-gatilhados conforme §3.5.

## 4. Fora de escopo (mini-iPaaS visual)

Não entregar em Fase 0 nem em Fase 1:

- Editor drag-and-drop visual.
- Fluxos com branching condicional complexo (múltiplos `if-elif-else` encadeados, switch).
- Biblioteca pública de transformações reutilizáveis entre clientes.
- Versionamento de mappings com diff visual entre versões.

Avaliar em **Fase 4** conforme demanda real (≥3 clientes pedindo após Fase 1 → entra em RICE).

## 5. Limites técnicos — referência

| Limite                | Valor     | Onde está                |
| --------------------- | --------- | ------------------------ |
| AST max depth         | 32        | ADR-011                  |
| Output max size       | 1MB       | ADR-011                  |
| Expressão max size    | 8KB       | ADR-011                  |
| Timeout por avaliação | 100ms     | ADR-011                  |
| Whitelist de funções  | explícita | 006-mapping-engine §4.10 |

## 6. Riscos e mitigação

- **`$reduce` recursivo estoura timeout**: documentar em antipadrões; teste unitário comprova que limite corta antes de travar.
- **Memória explodir com payload grande**: limite de 1MB no output; rejeitar com erro claro antes de OOM.
- **JSONata novo lança função fora da whitelist**: pin de versão exato no `package.json`; bump exige revisão de whitelist em PR.
