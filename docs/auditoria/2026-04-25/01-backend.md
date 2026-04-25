# Auditoria Backend NestJS + Prisma — 2026-04-25

**Auditor:** AUDITOR 1 — BACKEND  
**Data:** 2026-04-25  
**Escopo:** `/solution-ticket-desktop/backend/src/`  
**Profundidade:** Média

---

## Resumo Executivo

Codebase bem estruturado com 30+ módulos modulares, padrões NestJS corretos (DI, guards, filters), e Prisma com pragmas SQLite otimizados. Porém, **2 issues críticas** bloqueiam produção: ausência de paginação em queries bulk e validação de DTOs incompleta. **3 issues altas** em performance (N+1, falta de transactions) e arquitetura (lazy-loading). Cobertura de testes baixa (26 specs / 30+ módulos). **Estimativa de remediação: 2–3 sprints.**

**Contagem por severidade:**

- **Crítica:** 2 findings
- **Alta:** 3 findings
- **Média:** 4 findings
- **Baixa:** 1 finding
- **Total:** 10 findings

---

## Findings Detalhados

### 1. [CRÍTICA] findAll() sem paginação em Fatura, Relatórios e Auditoria

**Descrição:** `FaturaService.findAll()`, `RelatoriosService.movimento()` e `AuditoriaService` buscam **todos os registros sem LIMIT/OFFSET**. Em volumes reais (10k+ tickets/mês), queries timeout ou causam memory leak.

**Impacto:** Produção: aplicativo trava em fim de mês ao gerar relatórios; clientes perdem acesso.

**Arquivos:**

- `src/fatura/fatura.service.ts:findAll()` — linha ~15–30
- `src/relatorios/relatorios.service.ts:movimento()` — linha ~95–110
- `src/auditoria/auditoria.service.ts` — sem paginação

**Exemplo:**

```typescript
// ATUAL (Ruim)
async findAll(tenantId: string) {
  return this.prisma.fatura.findMany({ where: { tenantId } });
}

// ESPERADO (Bom)
async findAll(tenantId: string, skip = 0, take = 50) {
  return this.prisma.fatura.findMany({ where: { tenantId }, skip, take });
}
```

**Recomendação:** Implementar skip/take em todos findMany() de listar; adicionar DTO de paginação (default: 50/página).

---

### 2. [CRÍTICA] Validação de DTOs incompleta — faltam decorators class-validator

**Descrição:** DTOs em `src/*/dto/*.dto.ts` não têm validadores: `@IsNotEmpty`, `@IsString`, `@IsUUID`, `@Min/@Max`. Permite inputs inválidos (null unidadeId, strings vazias, negativos) passar direto para banco.

**Impacto:** Data corruption, queries lentas, falhas silenciosas em cálculos de tara/peso.

**Arquivos:**

- `src/ticket/dto/create-ticket.dto.ts`
- `src/fatura/dto/create-fatura.dto.ts`
- `src/cadastros/dto/base-filter.dto.ts` e variantes

**Exemplo:**

```typescript
// ATUAL (Ruim)
export class CreateFaturaDto {
  clienteId: string;
  valor: number;
}

// ESPERADO (Bom)
export class CreateFaturaDto {
  @IsUUID('4') clienteId: string;
  @IsNumber() @Min(0.01) valor: number;
}
```

**Recomendação:** Auditar todos DTOs; adicionar validadores; testar com inputs malformados.

---

### 3. [ALTA] N+1 em RelatoriosService.movimento() — include sem select

**Descrição:** Query carrega cliente, transportadora, motorista, veiculo, produto, destino + passagens + descontos para cada ticket. 1 query principal + ~8 queries N+1 = ~100ms/ticket.

**Impacto:** Relatório de 1000 tickets = 100s latência.

**Arquivo:** `src/relatorios/relatorios.service.ts:movimento()` — linha ~95–110

**Recomendação:** Usar dataloader, SQL raw com JOINs, ou Prisma select explícito; target <2 queries totais.

---

### 4. [ALTA] Ausência de transactions em operações multi-tabela

**Descrição:** `TicketService.fecharTicket()` e `FaturaService.registrarPagamento()` fazem múltiplas writes sem `prisma.$transaction()`. Falha parcial deixa BD inconsistente.

**Impacto:** Ticket fechado mas passagens não finalizadas; fatura paga mas status não atualizado.

**Arquivos:**

- `src/ticket/ticket.service.ts:fecharTicket()`
- `src/fatura/fatura.service.ts:registrarPagamento()`

**Recomendação:** Envolver em `$transaction()` para ACID; incluir testes de rollback.

---

### 5. [ALTA] AppModule carrega 30+ módulos sem lazy-loading

**Descrição:** Todos módulos (balanca, relatorios, automacao, camera, backup, etc.) importados globalmente. Aumenta tempo bootstrap de ~2s para ~5s+.

**Arquivo:** `src/app.module.ts` — imports array (linhas ~20–50)

**Recomendação:** Lazy-load módulos secundários (camera, automacao, backup); eager-load apenas (auth, ticket, fatura).

---

### 6. [MÉDIA] Logger NestJS sem correlação de requests

**Descrição:** Usa `Logger` nativo sem contexto de `requestId`. Difícil correlacionar logs em async/parallel.

**Impacto:** Troubleshooting 5-10x mais lento em produção.

**Arquivos:** `src/auth/auth.service.ts`, `src/fatura/fatura.service.ts`, `src/relatorios/relatorios.service.ts`

**Recomendação:** Integrar `nestjs-pino` com `AsyncLocalStorage` ou `@Cls` para contexto automático.

---

### 7. [MÉDIA] Soft-delete não implementado — apenas exclusão lógica manual

**Descrição:** Schema Prisma não usa `@db.SoftDelete`. Aplicação controla flags manualmente, risco de queries retornarem "deletados".

**Arquivo:** `src/prisma/schema.prisma` (todas as models)

**Recomendação:** Integrar middleware `prisma-soft-delete` ou usar `@db.SoftDelete`.

---

### 8. [MÉDIA] Cobertura de testes baixa — 26 specs em 30+ módulos

**Descrição:** Média ~0.8 teste/módulo. Auth tem cobertura, mas balanca, relatorios, fatura, auditoria faltam testes unitários/E2E.

**Contagem:** 26 arquivos `.spec.ts` encontrados.

**Recomendação:** Target mínimo 70% coverage em módulos críticos (ticket, fatura, auth); implementar testes de N+1 e paginação.

---

### 9. [MÉDIA] TicketService.create() sem validação explícita de tara

**Descrição:** Se `veiculo.taraCadastrada` NULL ou inválida, cálculo de peso líquido quebra silenciosamente ou retorna 0.

**Arquivo:** `src/ticket/ticket.service.ts:create()` — linhas ~35–50

**Recomendação:** Validação explícita; throw error se tara obrigatória e ausente; incluir em testes de contrato.

---

### 10. [BAIXA] Migrações Prisma sem changelog documentado

**Descrição:** Migrations em `/prisma/migrations/` não têm RD (design rationale) ou rollback policy.

**Recomendação:** Documentar cada migration; testar rollback em staging.

---

## Recomendações Priorizadas

### Sprint 1 (Bloqueantes)

1. **Paginação:** Adicionar skip/take em todas `findAll()` (Fatura, Relatorios, Auditoria).
2. **Validação DTO:** Auditar e adicionar class-validator decorators em todos DTOs.
3. **Transactions:** Envolver `fecharTicket()` e `registrarPagamento()` em `$transaction()`.

### Sprint 2 (Performance)

4. **N+1:** Refatorar `RelatoriosService.movimento()` com dataloader ou SQL raw.
5. **Lazy-loading:** Implementar lazy-load em módulos secundários.
6. **Tests:** Cobertura mínima 70% em ticket, fatura, auth.

### Sprint 3 (Qualidade)

7. **Logging:** Integrar `nestjs-pino` + contexto.
8. **Soft-delete:** Implementar via middleware.
9. **Validação tara:** Testes de contrato; fallback explícito.
10. **Migrations:** Changelog + rollback tests.

---

## Pontos Fortes

- **Modularidade:** Arquitetura bem separada (auth, ticket, balanca, etc.).
- **Padrões NestJS:** Guards, filters, DI corretos.
- **Security:** Helmet, JWT, bcrypt, Sentry integrado.
- **Database:** SQLite pragmas otimizados (WAL, foreign_keys, synchronous).
- **Exception handling:** HttpExceptionFilter com Sentry reporting.

---

## Conclusão

Backend tecnicamente sólido, mas com **2 critical paths** que impedem produção escalável. Remediação estimada em 6–8 semanas (2–3 sprints). Prioridade: paginação, validação DTOs, transactions. Depois, N+1, testes, logging.
