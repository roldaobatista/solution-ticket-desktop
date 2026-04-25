# scripts/

Utilitários manuais. Convenção: prefixar com `oneshot-` scripts não-idempotentes (rodam uma vez, modificam estado e não devem ser re-executados sem revisão).

## Smoke / diagnóstico (idempotentes)

| Script             | O que faz                                                                | Como rodar                      |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------- |
| `test-login.js`    | Autentica `admin@solutionticket.com` e imprime token JWT.                | `node scripts/test-login.js`    |
| `test-flows.js`    | Exercita fluxos críticos via API (login → CRUD básico → ticket simples). | `node scripts/test-flows.js`    |
| `test-romaneio.js` | Cria romaneio fictício e valida endpoints relacionados.                  | `node scripts/test-romaneio.js` |

Pré-condição: backend rodando em `http://127.0.0.1:3001` e seed aplicado.

## Smoke de hardware

| Script                             | O que faz                                             | Como rodar                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/scripts/smoke-balanca.ts` | Exercita os 13 parsers de balança com frames-amostra. | `cd backend && pnpm exec ts-node --transpile-only --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/smoke-balanca.ts` |

## One-shot (NÃO RE-EXECUTAR sem revisar)

| Script                      | O que fez                                                  | Substituído por                                               |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `oneshot-fix_schema.py`     | Patch histórico no `schema.prisma` para normalizar campos. | Migration `20260424175219_init`.                              |
| `oneshot-fix-pagination.py` | Patch em controllers para padronizar resposta paginada.    | Será substituído pelo `PaginationDto` único do Sprint 1 (B1). |

Manter no repo apenas como evidência histórica. Apagar quando o autor do commit confirmar que ninguém precisa mais reproduzir o estado pré-fix.
