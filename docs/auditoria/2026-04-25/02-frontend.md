# Auditoria Frontend — AUDITOR 2

**Data:** 2026-04-25  
**Stack:** Next.js 14 App Router + Tailwind + React Query + Zustand  
**Escopo:** `C:/PROJETOS/Plataforma de Pesagem Veicular/solution-ticket-desktop/frontend/`

---

## Resumo Executivo

| Severidade  | Contagem |
| ----------- | -------- |
| **CRÍTICA** | 3        |
| **ALTA**    | 5        |
| **MÉDIA**   | 4        |

**Total:** 12 findings significativos. Cobertura de testes insuficiente (apenas 2 testes E2E de smoke). Tipagem com `any` espalhada em 20+ locais.

---

## Findings Detalhados

### CRÍTICA

#### 1. Testes insuficientes — Sem cobertura de fluxos críticos

**Arquivo:** `frontend/e2e/login.spec.ts`  
**Linha:** 1–19  
**Descrição:** Apenas 2 testes E2E (smoke tests) para toda a aplicação. Nenhum teste de fluxo de pesagem completo, mutations de React Query, ou invalidação de cache.

**Impacto:** Regressões em produção não detectadas. Fluxos de pesagem podem quebrar silenciosamente.

**Recomendação:** Criar suite E2E cobrindo: login → abrir ticket → capturar peso → fechar ticket (completo).

---

#### 2. Prop drilling em componentes de operação

**Arquivo:** `frontend/src/components/balanca/BalancaConfigWizard.tsx`, `PesoRealtime.tsx`  
**Descrição:** Componentes com 8+ props (ticket, passages, weight, callbacks). Falta context provider para estado de pesagem.

**Impacto:** Difícil refatoração, reusabilidade limitada.

**Recomendação:** Criar React Context (`BalancaOperationContext`) para encapsular estado de conexão e callbacks.

---

#### 3. React Query: Cache keys sem namespacing

**Arquivo:** `frontend/src/app/(authenticated)/cadastros/*.tsx` (múltiplos)  
**Linha:** ~45 em cada page.tsx  
**Descrição:** Keys como `['armazens']`, `['balancas']` sem namespace de tenant/empresa. Risco de colisão em multi-tenant.

**Impacto:** Em multi-tenant, cache de armazém da empresa A pode servir para empresa B.

**Recomendação:** Usar keys estruturadas: `queryKey: ['armazens', tenantId, empresaId]`

---

### ALTA

#### 4. Zustand — Duplicação de estado entre server e client

**Arquivo:** `frontend/src/stores/authStore.ts:L30–40`, `stores/configStore.ts:L25`  
**Descrição:** `useAuthStore` persiste via localStorage; `useTicketStore` mantém estado local que também vem de React Query. Falta sincronização entre invalidações.

**Impacto:** Desincronização entre dados. User pode estar "logado" no store mas token expirado na API.

**Recomendação:** Manter stores apenas para UI state; usar React Query para server state.

---

#### 5. TypeScript — `any` type em 20+ locais

**Exemplos:**

- `cadastros/armazens/page.tsx:L52` — `const payload: any = { ...form }`
- `cadastros/balancas/page.tsx:L120` — `onError: (e: any) =>`
- `manutencao/page.tsx:L180` — `setForm((f: any) => ({ ... }))`
- `pesagem/page.tsx:L95` — `balancas.data.find((b: any) => ...)`

**Impacto:** Sem type safety em lógica crítica (pesagem, cálculos). Erros em runtime.

**Recomendação:** Substituir todos `any` por tipos concretos: `Partial<Armazem>`, `AxiosError<{ message: string }>`.

---

#### 6. Performance — Recharts/Lucide carregados em todos devices

**Descrição:** 51 imports de `lucide-react` e `recharts` sem dynamic imports. Bundle size não otimizado para Electron.

**Impacto:** Primeira carga lenta mesmo para telas sem gráficos.

**Recomendação:** Usar dynamic imports com ssr:false para Recharts.

---

#### 7. Acessibilidade básica faltando

**Descrição:** Inputs sem labels associadas, botões sem aria-label, dialogs sem aria-modal="true".

**Impacto:** Leitores de tela não conseguem operar a app.

**Recomendação:** Adicionar `<label htmlFor="id">` e `aria-label` em botões críticos.

---

#### 8. React Query — Stale time inadequado para pesagem

**Arquivo:** `frontend/src/app/providers.tsx:L16`  
**Descrição:** `staleTime: 60 * 1000` — muito longo para balança em tempo real. Pesagem precisa de 3–5 segundos.

**Impacto:** Leitura de peso desatualizada durante pesagem.

**Recomendação:** Diferenciar por rota: pesagem → 3s; cadastros → 60s.

---

### MÉDIA

#### 9. Layout — Sem error boundaries

**Arquivo:** `frontend/src/app/layout.tsx`  
**Descrição:** Nenhum `error.tsx` ou `loading.tsx` em níveis da árvore. Falha silenciosa em `(authenticated)/`.

**Recomendação:** Criar `error.tsx` com retry button em rotas críticas.

---

#### 10. Zustand — Persistência inconsistente

**Arquivo:** `frontend/src/stores/configStore.ts`  
**Descrição:** `useConfigStore` não persiste; `useAuthStore` sim. Política indefinida.

**Recomendação:** Documentar: Auth + UI → persistir; Tickets/operações → servidor.

---

#### 11. Hooks — useKeyboardShortcuts sem desabilitation context

**Arquivo:** `frontend/src/hooks/useKeyboardShortcuts.ts:L22`  
**Descrição:** Atalhos (F1, F2) globais. Sem contexto para desabilitar em modais.

**Impacto:** F1 dispara captura mesmo em modal aberto.

**Recomendação:** Adicionar ShortcutsContext que track "enabled" state.

---

#### 12. API client — Sem retry em mutations críticas

**Descrição:** Mutations de pesagem/tickets sem retry automático em timeout.

**Recomendação:** Configurar `retry: 3` com exponential backoff em useMutation.

---

## Recomendações Prioritárias

1. **Escrever testes E2E** para fluxo de pesagem (entrada → saída)
2. **Remover `any`** em tipagens críticas
3. **Refatorar cache keys** com namespace (tenant, empresa, unidade)
4. **Criar React Context** para Balanca (eliminar prop drilling)
5. **Adicionar error boundaries** em layout
6. **Dynamic imports** para Recharts/Lucide
7. **Labels + aria** em formulários
8. **Diferenciar staleTime** por rota

---

## Métricas

- **Componentes auditados:** 72 arquivos .tsx
- **Cobertura E2E:** <5% (2 testes smoke)
- **Instances `any`:** 20+
- **Queries sem namespace:** 10+
- **Props por componente (máx):** 8–10

**Score: 6.5/10** — Funcional para MVP, mas CRÍTICO preparar testes e tipagem antes de produção.
