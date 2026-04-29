# ADR-009: Versionamento da API pública

**Status**: Aprovada
**Data**: 2026-04-26

## Contexto

A API pública é tratada como **produto** (plano Pro), não como exposição de controllers internos. Clientes e parceiros vão construir integrações sobre ela. Mudança incompatível sem aviso quebra implementações de cliente.

## Decisão

- **URL versionada**: `/api/v1/integration/...`
- **Versão maior** (`/v2`) muda apenas para breaking changes
- **Minor changes** (campos novos opcionais) **não** mudam a versão
- **Deprecação** com prazo mínimo de **6 meses** entre `v1` deprecada e `v1` removida
- **Header `Sunset`** indica deprecação de endpoint específico
- **OpenAPI publicado** em `/api/v1/integration/docs` e versionado no Git

### Compatibilidade

- Adicionar campo opcional na resposta: OK em `v1`
- Adicionar parâmetro opcional na request: OK em `v1`
- Tornar campo obrigatório, mudar tipo, mudar semântica: exige `v2`
- Renomear endpoint: `v1` continua respondendo + `v2` tem o novo nome

### Auth e versionamento são ortogonais

- API Key e OAuth funcionam em qualquer versão
- Cliente pode usar `v1` e `v2` em paralelo durante migração

## Consequências

### Positivas

- Clientes confiam em estabilidade
- Permite evolução sem medo de quebrar
- Habilita SDK público (Fase 4)

### Negativas

- Manter `v1` e `v2` em paralelo tem custo
- Necessário disciplina de PR review para detectar breaking changes acidentais
- Documentação dupla durante transição

## Alternativas consideradas

- **Versionamento por header**: rejeitada — menos descoberta, mais erro de cliente
- **GraphQL** (sem versão): rejeitada para v1 — REST é mais simples para o público-alvo
- **Sem versionamento**: rejeitada — quebraria cliente em qualquer mudança

## Referências

- Roy Fielding, _REST API design guidelines_
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 12.3
