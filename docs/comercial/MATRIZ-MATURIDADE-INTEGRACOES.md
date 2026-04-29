# Matriz de Maturidade — Integrações ERP/Fiscal

**Versão**: 2026-04-29
**Regra comercial**: vender como pronto somente o que estiver em "Disponível hoje".

| Status          | O que pode ser prometido                                                                            | Evidência no produto                                              |
| --------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Disponível hoje | Outbox local, retry, idempotência e conector genérico REST para integração assistida                | `backend/src/integracao` com `mock` e `generic-rest`              |
| Disponível hoje | Mock ERP para demo, homologação e teste de fluxo sem ERP real                                       | `mock-erp.connector.ts`                                           |
| Beta controlado | Conector dedicado para ERP específico com escopo fechado em proposta e aceite técnico               | Requer implementação/homologação por cliente                      |
| Planejado       | Conectores nativos Bling, Omie, Conta Azul, TOTVS, Sankhya, Senior, SAP, Dynamics, Oracle, NetSuite | Roadmap, não vender como pronto                                   |
| Planejado       | Integração fiscal direta, emissão fiscal ou validação fiscal completa                               | Fora do MVP atual; vender apenas rastreabilidade do ticket/outbox |

## Frases aprovadas

- "Hoje o produto entrega integração local-first com outbox e conector REST genérico."
- "Conectores nativos específicos entram como beta/projeto homologado, com escopo e aceite."
- "Rastreabilidade fiscal significa histórico auditável do ticket e da integração; emissão fiscal direta é roadmap."

## Frases bloqueadas

- "20+ ERPs nativos prontos."
- "Integração fiscal completa pronta."
- "Setup em dias para qualquer ERP."
