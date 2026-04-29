# Plano de Correção Completo — Solution Ticket Desktop

> **Versão:** 1.0  
> **Data:** 2026-04-25  
> **Baseado em:** Auditoria de 5 especialistas (Backend, Frontend, Electron, Arquitetura, Domínio)  
> **Status atual:** 5.7/10 — NÃO pronto para produção  
> **Meta:** 8.5/10 — Pronto para campo comercial

---

## Sumário Executivo

Este documento consolida **todos os achados críticos** identificados na auditoria multi-especialista e propõe um roadmap de **12 semanas** dividido em 5 ondas, ordenado por impacto comercial e risco técnico.

**Princípios do plano:**

1. **Segurança e dados primeiro** — nada importa se o backup copia o arquivo errado
2. **Campo sobre escritório** — funcionalidades que desbloqueiam venda têm prioridade sobre refinamentos
3. **Testes como guarda-chuva** — cada correção vem acompanhada de teste
4. **Não adicionar features antes de estabilizar** — congelar novo desenvolvimento até Wave 3

---

## 1. Matriz de Priorização Consolidada

### 1.1 Legenda de Prioridade

| Código | Significado                                              | SLA                     |
| ------ | -------------------------------------------------------- | ----------------------- |
| **P0** | Bloqueante — impede lançamento ou corrompe dados         | Resolver em 48h         |
| **P1** | Crítico — alto risco de falha em produção                | Resolver em 1 semana    |
| **P2** | Importante — impacta UX, manutenibilidade ou performance | Resolver em 2-4 semanas |
| **P3** | Desejável — melhoria incremental                         | Resolver em 4-8 semanas |
| **P4** | Nice to have — otimização futura                         | Backlog                 |

### 1.2 Tabela Consolidada de Achados (Top 50)

| #   | Achado                                                                                                        | Área                 | P   | Esforço | Onda |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------- | --- | ------- | ---- |
| 1   | **Divergência fatal de paths**: Backup copia banco errado (`SolutionTicket/` vs `@solution-ticket/electron/`) | Electron/Backend     | P0  | Baixo   | 1    |
| 2   | **ResponseTransformInterceptor não registrado** — API não envelopa sucessos                                   | Backend              | P0  | Baixo   | 1    |
| 3   | **Código morto em `ticket.service.ts`** — `eventEmitter` nunca dispara após `return`                          | Backend              | P0  | Baixo   | 1    |
| 4   | **Typecheck frontend quebrado** — `tabs.test.tsx` não compila, CI gate comprometido                           | Frontend/Arquitetura | P0  | Baixo   | 1    |
| 5   | **`pnpm.overrides` no `package.json` raiz** — patches de segurança podem não estar aplicados; 50 CVEs         | Arquitetura          | P0  | Baixo   | 1    |
| 6   | **Sem `requestSingleInstanceLock`** — multi-instância corrompe SQLite e gera conflito de portas               | Electron             | P0  | Baixo   | 1    |
| 7   | **`TenantGuard` falha aberto** — `if (!user) return true` permite bypass de autenticação                      | Backend              | P1  | Baixo   | 1    |
| 8   | **Endpoint `login-direct` duplicado** — aumenta superfície de ataque sem benefício                            | Backend              | P1  | Baixo   | 1    |
| 9   | **Queries N+1 no Dashboard** — `evolucaoDiaria` faz 730 queries para 365 dias                                 | Backend              | P1  | Médio   | 2    |
| 10  | **Monolito `ticket.service.ts` (791 linhas)** — violação grave de SRP                                         | Backend/Arquitetura  | P1  | Alto    | 2    |
| 11  | **Monolito `pesagem/page.tsx` (646 linhas)** — 12+ useState, lógica misturada                                 | Frontend/Arquitetura | P1  | Alto    | 2    |
| 12  | **Sem React Hook Form** — formulários via useState manual apesar de RHF no package.json                       | Frontend             | P1  | Alto    | 2    |
| 13  | **`mock-api.ts` (2.137 linhas) no bundle de produção** — polui bundle, dados hardcoded                        | Frontend             | P1  | Médio   | 2    |
| 14  | **Next.js `next start` como child process em produção** — anti-padrão Electron                                | Electron             | P1  | Alto    | 2    |
| 15  | **Impressão nativa ESC/POS inexistente** — PDFkit não serve para térmicas/matriciais em campo                 | Domínio              | P1  | Alto    | 3    |
| 16  | **Auto-update quebrado** — placeholder `SOLUTION-TICKET-OWNER` no electron-builder                            | Electron             | P1  | Baixo   | 2    |
| 17  | **Cobertura frontend inexistente** — 1 teste unitário para ~30 telas                                          | Frontend/Arquitetura | P1  | Alto    | 2    |
| 18  | **SQLite sem WAL mode explícito** — risco de corrupção em queda de energia                                    | Backend/Arquitetura  | P1  | Baixo   | 2    |
| 19  | **`tenantKey()` nunca usado** — cache React Query vaza entre tenants                                          | Frontend             | P1  | Baixo   | 2    |
| 20  | **Duplicação de sistema de Toast** — Zustand vs useState local                                                | Frontend             | P2  | Baixo   | 3    |
| 21  | **Dialog sem Focus Trap** — falha WCAG 2.1 nível A                                                            | Frontend             | P2  | Baixo   | 3    |
| 22  | **`require()` dinâmico em `resolveUnidadeId`** — code smell, quebra em bundlers                               | Frontend             | P2  | Baixo   | 3    |
| 23  | **Interceptor muta `response.data` do Axios** — efeitos colaterais em cache                                   | Frontend             | P2  | Baixo   | 3    |
| 24  | **Dashboard faz 6 queries paralelas sem Suspense** — loading não granular                                     | Frontend             | P2  | Médio   | 3    |
| 25  | **Tipos `Balanca` duplicados** camelCase/snake_case                                                           | Frontend             | P2  | Médio   | 3    |
| 26  | **Status como `string` em vez de union types** — perda de type safety                                         | Frontend             | P2  | Médio   | 3    |
| 27  | **Sem `middleware.ts`** — proteção de rotas 100% client-side                                                  | Frontend             | P2  | Médio   | 3    |
| 28  | **AuditInterceptor falha silenciosamente** — `catch` vazio, sem log                                           | Backend              | P2  | Baixo   | 3    |
| 29  | **`RolesGuard` não registrado** — RBAC não funciona                                                           | Backend              | P2  | Baixo   | 3    |
| 30  | **`AuditInterceptor` não registrado** — auditoria não captura requisições                                     | Backend              | P2  | Baixo   | 3    |
| 31  | **Bcrypt cost 10** — abaixo do recomendado para 2025 (12)                                                     | Backend              | P2  | Baixo   | 3    |
| 32  | **Schema Prisma sem validação de enums** — SQLite não suporta enum, sem CHECK                                 | Backend              | P2  | Médio   | 3    |
| 33  | **Geração de número sequencial com `count()` dentro de transação** — write lock no SQLite                     | Backend              | P2  | Médio   | 3    |
| 34  | **`metrics()` sem filtro de tenant** — expõe dados cross-tenant                                               | Backend              | P2  | Baixo   | 3    |
| 35  | **Fila de veículos (`FilaVeiculo`) é stub** — não existe no schema                                            | Domínio/Backend      | P1  | Médio   | 3    |
| 36  | **Captura automática de imagem não integrada** — `CameraService` existe mas não está no fluxo de passagem     | Domínio              | P2  | Médio   | 3    |
| 37  | **Assinatura digital no ticket** — schema existe, não integrado ao fechamento                                 | Domínio              | P2  | Médio   | 3    |
| 38  | **Templates de ticket incompletos** — 6 de 14 portados                                                        | Domínio/Backend      | P2  | Alto    | 3    |
| 39  | **Sem exportação XLSX nos relatórios** — helper existe mas nenhum endpoint usa                                | Domínio/Backend      | P2  | Médio   | 3    |
| 40  | **Relatórios faltantes** — produtividade por operador, tempo médio, inconsistências                           | Domínio              | P3  | Alto    | 4    |
| 41  | **Sem validação de placa Mercosul** no cadastro de veículos                                                   | Domínio              | P2  | Baixo   | 3    |
| 42  | **Cliente sem unique em `documento`** — permite duplicar CNPJ                                                 | Domínio              | P2  | Baixo   | 3    |
| 43  | **Sem controle de inadimplência** — não bloqueia cliente com saldo negativo                                   | Domínio              | P3  | Médio   | 4    |
| 44  | **Licenciamento burlável** — MAC spoofable, chave pública no disco, sem TPM                                   | Domínio              | P2  | Médio   | 4    |
| 45  | **Logs do Electron sem rotação** — `electron.log` cresce indefinidamente                                      | Electron             | P2  | Baixo   | 3    |
| 46  | **Portas hardcoded 3000/3001** — sem fallback se ocupadas                                                     | Electron             | P2  | Baixo   | 3    |
| 47  | **Sem graceful shutdown** — `kill()` brutão pode corromper SQLite/serial                                      | Electron             | P2  | Médio   | 3    |
| 48  | **Splash screen estática** — não mostra progresso do boot                                                     | Electron             | P3  | Baixo   | 4    |
| 49  | **Sem crash reporter** — falhas no main process são cegas                                                     | Electron             | P3  | Baixo   | 4    |
| 50  | **Preload.js inútil** — expõe apenas `version`, frontend não usa                                              | Electron             | P3  | Baixo   | 4    |

---

## 2. Roadmap por Ondas

### Onda 1 — Estabilização Imediata (Semanas 1-2)

> **Objetivo:** Eliminar todos os P0. O sistema deve compilar, passar no CI e não corromper dados.

#### Semana 1: Correções de Dados e Compilação

| Dia | Tarefa                                             | Arquivo(s)                                                          | Critério de Aceite                                                                        |
| --- | -------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Corrigir divergência de paths (`desktop-paths.ts`) | `backend/src/common/desktop-paths.ts`                               | `BackupService` usa `DATABASE_URL` ou `USER_DATA_PATH` do Electron; teste de backup passa |
| 1   | Implementar `requestSingleInstanceLock`            | `electron/main.js`                                                  | Segunda instância foca a primeira e sai; teste manual                                     |
| 2   | Registrar `ResponseTransformInterceptor` global    | `backend/src/main.ts`                                               | Todo sucesso HTTP retorna `{success: true, data, timestamp}`; teste e2e                   |
| 2   | Corrigir código morto em `ticket.service.ts`       | `backend/src/ticket/ticket.service.ts`                              | `eventEmitter.emit` executa antes do `return`; teste unitário                             |
| 3   | Corrigir `typecheck:all` do frontend               | `frontend/tsconfig.json`, excluir `**/*.test.tsx` de `tsc --noEmit` | `pnpm typecheck:frontend` passa sem erros                                                 |
| 3   | Mover `pnpm.overrides` para `pnpm-workspace.yaml`  | `package.json` raiz, `pnpm-workspace.yaml`                          | `pnpm audit --prod` mostra 0 critical/high não-triados; lockfile regerado                 |
| 4   | Corrigir `TenantGuard` closed-by-default           | `backend/src/common/guards/tenant.guard.ts`                         | Se `!user` e não é `@Public()`, retorna `false`; teste unitário                           |
| 4   | Remover endpoint `login-direct`                    | `backend/src/auth/auth.controller.ts`                               | Apenas `POST /auth/login` com `LocalAuthGuard` disponível                                 |
| 5   | Rodar `pnpm ci` completo e garantir zero erros     | Todo o repo                                                         | `format:check`, `lint:check`, `typecheck:all`, `test`, `build:all` passam                 |

#### Semana 2: Hardening e Segurança

| Dia | Tarefa                                                                   | Arquivo(s)                                                                    | Critério de Aceite                                                                            |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 6   | Aumentar bcrypt cost para 12                                             | `backend/src/auth/bcrypt-cost.ts`                                             | Login permanece <500ms; teste de performance                                                  |
| 6   | Ativar SQLite WAL mode                                                   | `backend/src/prisma/schema.prisma` (ou env)                                   | `PRAGMA journal_mode = WAL` ativo; documentar no CHANGELOG                                    |
| 7   | Registrar `RolesGuard` como `APP_GUARD`                                  | `backend/src/app.module.ts`                                                   | Endpoints com `@Roles()` rejeitam usuários sem permissão; teste e2e                           |
| 7   | Registrar `AuditInterceptor` e corrigir `extractEntity`/`extractAction`  | `backend/src/main.ts`, `backend/src/common/interceptors/audit.interceptor.ts` | Requisições são auditadas; rotas aninhadas (ex: `/tickets/123/passagens`) não quebram         |
| 8   | Adicionar `@types/jest` ao `tsconfig.json` do frontend OU excluir testes | `frontend/tsconfig.json`                                                      | Build e typecheck passam com testes                                                           |
| 8   | Corrigir placeholder `SOLUTION-TICKET-OWNER` no electron-builder         | `electron/package.json`                                                       | Auto-update aponta para repo GitHub real                                                      |
| 9   | Adicionar validação de placa Mercosul/antigo                             | `backend/src/cadastros/dto/create-veiculo.dto.ts`                             | Placas inválidas rejeitadas no DTO                                                            |
| 9   | Adicionar unique de `documento` em `Cliente`                             | `backend/src/prisma/schema.prisma`                                            | Não permite duplicar CNPJ/CPF como cliente                                                    |
| 10  | Revisar e limpar dead dependencies                                       | `frontend/package.json`, `backend/package.json`                               | Remover `@brazilian-utils/brazilian-utils` do frontend; `nestjs-pino` do backend se não usado |

**Entrega da Onda 1:**

- [ ] `pnpm ci` passa 100% localmente e no GitHub Actions
- [ ] Backup copia o banco correto
- [ ] API envelopa respostas consistentemente
- [ ] Apenas uma instância do app pode rodar
- [ ] 0 vulnerabilidades critical/high não-triadas

---

### Onda 2 — Fundação Técnica (Semanas 3-5)

> **Objetivo:** Refatorar monolitos, estabilizar arquitetura Electron e criar base de testes frontend.

#### Semana 3: Refatoração Backend

| Tarefa                               | Detalhe                                                         | Critério de Aceite                                       |
| ------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------- |
| Extrair `TicketStateMachine`         | Mover `TRANSICOES_PERMITIDAS` e validações para classe dedicada | Testes unitários cobrem 100% das transições              |
| Extrair `TicketCalculator`           | Cálculo de líquido, descontos, tara snapshot                    | Testes com edge cases (bruto < tara, desconto 100%)      |
| Extrair `TicketLicenseGuard`         | Verificação de trial/limite de pesagens                         | Testes de expiry e bloqueio                              |
| Extrair `TicketEventPublisher`       | Emissão de eventos para impressão/auditoria                     | Eventos são emitidos nos pontos corretos                 |
| Refatorar `dashboard.service.ts` N+1 | `evolucaoDiaria` com uma única query agregada                   | Dashboard com 365 dias carrega em <500ms com 10k tickets |

#### Semana 4: Refatoração Frontend + Electron

| Tarefa                                  | Detalhe                                                       | Critério de Aceite                              |
| --------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| Migrar Next.js para `output: 'export'`  | `next.config.js` com static export                            | `out/` gerado; sem servidor Next.js em produção |
| Adaptar Electron para `loadFile`        | `main.js` carrega `out/index.html` em vez de `localhost:3000` | App empacotado funciona sem `next start`        |
| Remover `frontendProcess` em produção   | `startFrontend()` só em dev                                   | Pacote reduzido em >200MB                       |
| Extrair hooks de `pesagem/page.tsx`     | `usePesagemForm`, `useBalancaRealtime`, `usePassagens`        | Page < 200 linhas; hooks testáveis              |
| Criar componente genérico `CrudPage<T>` | Recebe schema, columns, API hooks                             | 12 páginas de cadastro migradas; -3000 linhas   |

#### Semana 5: Testes e Qualidade

| Tarefa                                 | Detalhe                                                         | Critério de Aceite                                |
| -------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Adotar React Hook Form + Zod           | Todas as páginas de cadastro e pesagem                          | Zero `useState` manual em formulários             |
| Criar testes unitários frontend        | Stores, hooks, `utils.ts`                                       | Cobertura frontend ≥ 30%                          |
| Criar teste E2E Playwright crítico     | Login → nova pesagem → capturar peso → fechar ticket → imprimir | Spec passa em CI                                  |
| Usar `tenantKey()` em todas as queries | React Query cache isolado por tenant                            | Linter custom ou code review rigoroso             |
| Adicionar `middleware.ts`              | Proteção server-side de rotas                                   | Redirecionamento para `/login` se não autenticado |

**Entrega da Onda 2:**

- [ ] `ticket.service.ts` < 300 linhas (delega para especialistas)
- [ ] `pesagem/page.tsx` < 200 linhas
- [ ] Frontend com static export; Electron sem `next start` em produção
- [ ] Cobertura frontend ≥ 30%
- [ ] Teste E2E de fluxo completo de pesagem passando

---

### Onda 3 — Funcionalidades de Campo (Semanas 6-8)

> **Objetivo:** Desbloquear operação real em balança rodoviária.

#### Semana 6: Impressão Nativa

| Tarefa                                 | Detalhe                                                         | Critério de Aceite               |
| -------------------------------------- | --------------------------------------------------------------- | -------------------------------- |
| Pesquisar/escolher biblioteca ESC/POS  | `node-escpos`, `node-thermal-printer`, ou implementação própria | PoC funcional em Epson TM-T20    |
| Criar `EscposTemplateService`          | Gera buffer ESC/POS a partir do ticket                          | Impressão < 2s, corte automático |
| Criar template matricial ESC/P         | Para Epson LX-300                                               | Texto nítido, sem rasterização   |
| Adaptar `impressao.service.ts`         | Seleciona PDF ou ESC/POS baseado em config                      | Fallback automático              |
| Configuração de impressora por balança | Campo `impressoraTipo` (pdf/escpos/escp) + porta                | Persiste no banco                |

#### Semana 7: Automação e Fila

| Tarefa                                | Detalhe                                       | Critério de Aceite                           |
| ------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| Criar modelo `FilaVeiculo` no schema  | `prisma/schema.prisma` + migration            | CRUD completo                                |
| Implementar `FilaService`             | Adicionar, remover, reordenar, chamar próximo | Testes unitários                             |
| Criar UI de fila no frontend          | Painel lateral na tela de pesagem             | Atualização em tempo real                    |
| Integrar captura automática de imagem | Trigger no `registrarPassagem`                | Foto salva com `ticketId` + `passagemId`     |
| Integrar assinatura digital           | Tela de assinatura no fechamento do ticket    | Assinatura vinculada ao ticket, reimprimível |

#### Semana 8: Completude de Templates e Relatórios

| Tarefa                                | Detalhe                                                  | Critério de Aceite                      |
| ------------------------------------- | -------------------------------------------------------- | --------------------------------------- |
| Portar templates faltantes (8 de 14)  | TICKET002 variantes, TICKET004 variantes, TICKET005A/B/C | Todos os 14 templates geram PDF/ESC/POS |
| Ativar exportação XLSX nos relatórios | Usar `xlsx.helper.ts` nos endpoints                      | Endpoint `/relatorios/*/xlsx` funcional |
| Adicionar relatórios faltantes        | Produtividade por operador, tempo médio, inconsistências | Especificações definidas com cliente    |
| Validar templates com cliente         | Impressão real em papel A4, A5, 80mm                     | Aprovação do cliente                    |

**Entrega da Onda 3:**

- [ ] Impressão ESC/POS funcional em impressora térmica real
- [ ] Fila de veículos operacional
- [ ] Captura de imagem integrada ao fluxo de pesagem
- [ ] 14 templates de ticket completos
- [ ] Exportação XLSX disponível

---

### Onda 4 — Robustez e Escala (Semanas 9-10)

> **Objetivo:** Preparar para deploy em múltiplos clientes e ambientes adversos.

#### Semana 9: Banco de Dados e Performance

| Tarefa                                          | Detalhe                                         | Critério de Aceite                                 |
| ----------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Avaliar migração para PostgreSQL                | Análise de esforço vs benefício                 | Documento de decisão arquitetural                  |
| Se manter SQLite: WAL mode + backup contínuo    | `PRAGMA journal_mode=WAL`; backup a cada 4h     | Teste de queda de energia simulada                 |
| Adicionar cache em memória                      | `@nestjs/cache-manager` para tabelas comerciais | Dashboard carrega <200ms                           |
| Criar shared workspace `@solution-ticket/types` | DTOs e enums exportados do backend              | Frontend consome tipos do backend; zero duplicação |
| Revisar índices do schema Prisma                | `@@index` em campos de busca frequente          | Explain query otimizado                            |

#### Semana 10: Electron e Deploy

| Tarefa                    | Detalhe                                          | Critério de Aceite                          |
| ------------------------- | ------------------------------------------------ | ------------------------------------------- |
| Graceful shutdown         | `POST /api/shutdown` ou SIGTERM; aguardar 5s     | SQLite fecha graciosamente; sem corrupção   |
| Portas dinâmicas          | `get-port` para backend; comunicar via IPC       | Funciona mesmo se 3001 ocupada              |
| Rotação de logs           | `electron-log` com rotação (max 5MB, 5 arquivos) | Logs não crescem além de 25MB               |
| Code signing              | Certificado OV/EV (ou self-signed para testes)   | SmartScreen não bloqueia; assinatura válida |
| Reduzir tamanho do pacote | `pnpm deploy --prod`, filtrar `extraResources`   | Instalador < 250MB                          |
| Splash funcional          | IPC de status do boot; botão "Ver logs"          | UX de boot informativa                      |

**Entrega da Onda 4:**

- [ ] Decisão documentada: SQLite (com WAL) ou PostgreSQL
- [ ] Graceful shutdown testado
- [ ] Instalador < 250MB e assinado
- [ ] Auto-update funcional

---

### Onda 5 — Polimento e Monitoramento (Semanas 11-12)

> **Objetivo:** Observabilidade, acessibilidade e maturidade de produto.

#### Semana 11: Observabilidade

| Tarefa                                     | Detalhe                                                | Critério de Aceite                                |
| ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------- |
| Ativar `nestjs-pino` como logger principal | JSON estruturado no backend                            | Logs parseáveis por ferramenta de observabilidade |
| Integrar Sentry no frontend                | `@sentry/react`                                        | Erros de runtime capturados com contexto          |
| Integrar Sentry no Electron                | `@sentry/electron`                                     | Crashes do main process reportados                |
| Health check do sistema                    | Endpoint `/health` verifica banco, balança, impressora | Dashboard de status no frontend                   |
| Web Vitals / RUM                           | Métricas de performance no frontend                    | LCP < 2.5s, FID < 100ms                           |

#### Semana 12: Acessibilidade e UX

| Tarefa                               | Detalhe                                                | Critério de Aceite                    |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------- |
| Focus Trap no Dialog                 | `@radix-ui/react-dialog` ou `@floating-ui/react`       | Tab não vaza para elementos atrás     |
| Unificar sistema de Toast            | Remover `components/ui/toast.tsx`; usar apenas Zustand | Um único sistema de notificação       |
| Normalizar tipos `Balanca`           | Adapter `apiToModel` unifica camelCase/snake_case      | Tipos consistentes no frontend        |
| Separar `types/index.ts`             | Módulos por domínio (`types/cliente.ts`, etc.)         | Arquivos < 100 linhas                 |
| Adicionar atalhos de teclado globais | F9=capturar peso, F10=fechar ticket, ESC=cancelar      | Documentado e funcional               |
| Tema dark mode                       | Toggle e persistência                                  | Páginas principais suportam dark mode |

**Entrega da Onda 5:**

- [ ] Sentry ativo em todos os processos
- [ ] Dialog acessível (WCAG 2.1 A)
- [ ] Sistema de toast unificado
- [ ] Dark mode disponível

---

## 3. Checklist de Validação por Onda

### Gate de Entrada (antes de começar)

- [ ] Branch `main` estável (build passando)
- [ ] Ambiente de teste com emulador serial configurado
- [ ] Impressora térmica/matricial disponível para testes (Onda 3)
- [ ] Acesso ao repo GitHub para configurar auto-update (Onda 4)

### Gate de Saída da Onda 1

- [ ] `pnpm ci` passa 100% no GitHub Actions
- [ ] `pnpm audit --prod` = 0 critical/high não-triados
- [ ] Backup testado: arquivo correto copiado com SHA-256
- [ ] Teste manual: single instance lock funciona
- [ ] API envelope consistente em todos os endpoints

### Gate de Saída da Onda 2

- [ ] Cobertura backend ≥ 60% statements, ≥ 50% branches
- [ ] Cobertura frontend ≥ 30%
- [ ] Teste E2E Playwright de fluxo completo passa
- [ ] `ticket.service.ts` < 300 linhas
- [ ] App empacotado funciona sem `next start`
- [ ] Tamanho do pacote reduzido em ≥ 30%

### Gate de Saída da Onda 3

- [ ] Impressão ESC/POS testada em hardware real
- [ ] Fila de veículos operacional em ambiente simulado
- [ ] 14 templates de ticket validados
- [ ] Captura de imagem integrada ao fluxo
- [ ] Exportação XLSX funcional

### Gate de Saída da Onda 4

- [ ] Graceful shutdown testado com queda de energia simulada
- [ ] Instalador assinado e < 250MB
- [ ] Auto-update baixa e instala nova versão
- [ ] Decisão SQLite vs PostgreSQL documentada e aprovada

### Gate de Saída da Onda 5 (Release Candidate)

- [ ] Sentry capturando erros em backend, frontend e Electron
- [ ] Lighthouse score ≥ 80 em todas as páginas
- [ ] Teste de carga: 10.000 tickets, relatório em < 5s
- [ ] Documentação de deploy atualizada (`docs/RELEASE.md`)
- [ ] Checklist de segurança final (pentest básico)

---

## 4. Métricas de Sucesso

| Métrica                                  | Atual           | Meta Onda 2     | Meta Onda 5 |
| ---------------------------------------- | --------------- | --------------- | ----------- |
| Nota geral (média dos especialistas)     | 5.7             | 7.0             | 8.5         |
| Cobertura backend                        | ~28%            | 60%             | 75%         |
| Cobertura frontend                       | <1%             | 30%             | 50%         |
| Testes E2E                               | 1 spec          | 5 specs         | 10 specs    |
| Vulnerabilidades CVE                     | 50 (1 critical) | 0 critical/high | 0 moderate+ |
| Tamanho do instalador                    | ~500MB+         | < 350MB         | < 250MB     |
| Tempo de boot do app                     | ~15s            | < 10s           | < 5s        |
| Tempo de impressão ticket (térmica)      | N/A (PDF)       | < 3s            | < 2s        |
| Tempo de geração relatório (10k tickets) | > 5s            | < 3s            | < 2s        |
| Linhas de `ticket.service.ts`            | 791             | < 300           | < 200       |
| Linhas de `pesagem/page.tsx`             | 646             | < 200           | < 150       |

---

## 5. Riscos do Plano e Mitigações

| Risco                                                     | Probabilidade | Impacto | Mitigação                                                                             |
| --------------------------------------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------- |
| Refatoração de `ticket.service.ts` introduz regressão     | Alta          | Alto    | Feature flags; testes unitários >80% antes do merge; rollback plan                    |
| Static export do Next.js quebra funcionalidades dinâmicas | Média         | Alto    | PoC em branch separada; testar todas as rotas antes do merge                          |
| Impressão ESC/POS incompatível com impressoras do cliente | Média         | Alto    | Testar com 3 marcas (Epson, Bematech, Daruma); manter fallback PDF                    |
| Migração PostgreSQL mais complexa que o previsto          | Baixa         | Alto    | Decisão go/no-go na semana 9; manter SQLite como plano B                              |
| Equipe redirecionada para outro projeto                   | Média         | Alto    | Documentar cada mudança; nenhuma tarefa depende de conhecimento tribal                |
| Hardware de balança indisponível para testes              | Alta          | Médio   | Usar emuladores serial (SimulaBal, HW Virtual Serial Port); testes unitários robustos |

---

## 6. Convenções Durante a Execução

1. **Um PR por tarefa** — não misturar correções P0 com refatorações P2
2. **Teste antes de afirmar** — cada PR inclui teste que falha antes da correção e passa depois
3. **Atualizar este plano** — marcar `[x]` conforme tarefas são concluídas; adicionar notas de bloqueio
4. **Não quebrar `main`** — cada onda tem branch `onda/X`; merge só após gate de saída
5. **Revisão obrigatória** — todo PR de P0/P1 requer revisão de outro desenvolvedor

---

## 7. Histórico de Revisões

| Versão | Data       | Autor                        | Alterações                                              |
| ------ | ---------- | ---------------------------- | ------------------------------------------------------- |
| 1.0    | 2026-04-25 | Auditoria Multi-Especialista | Criação inicial consolidando achados de 5 especialistas |

---

## Apêndice A: Resumo dos Relatórios de Especialistas

### Backend/API — Nota 5.8/10

**Pontos Fortes:** Hardening de segurança, validação de secrets, estrutura modular, testes E2E com SQLite temporário, state machine de ticket.  
**Pontos Fracos:** ResponseTransformInterceptor não registrado, cobertura ~28%, código morto em `ticket.service.ts`, queries N+1 no Dashboard, SQLite sem enums validados.

### Frontend/UX — Nota 5.8/10

**Pontos Fortes:** Estrutura de diretórios organizada, Axios client bem estruturado, Zustand stores modelados, componentes UI base acessíveis.  
**Pontos Fracos:** Sem React Hook Form, `mock-api.ts` monolítico no bundle, cache sem tenant, cobertura <1%, duplicação massiva de CRUDs, Next 15 + React 18 divergentes.

### Electron/Desktop — Nota 5.5/10

**Pontos Fortes:** Segurança do renderer (sandbox, CSP), backup robusto, preload minimalista, menu para suporte técnico, kiosk mode.  
**Pontos Fracos:** Dois servidores em produção, divergência fatal de paths, auto-update quebrado, sem single-instance lock, empacotamento monstruoso, splash estática.

### Arquitetura/Qualidade — Nota 5.8/10

**Pontos Fortes:** Segurança backend madura, documentação excepcional, arquitetura de balança bem modelada, CI/CD completo, 265 testes backend passando.  
**Pontos Fracos:** Typecheck frontend quebrado, monolitos que violam SRP, frontend sem testes, `pnpm.overrides` mal configurado, SQLite em produção para missão crítica.

### Domínio/Negócio — Nota 5.5/10

**Pontos Fortes:** Motor de pesagem com state machine, 10+ parsers com testes, tabelas comerciais com vigência, backup automatizado, dashboard operacional.  
**Pontos Fracos:** Impressão nativa inexistente, automação física stub, fila de veículos stub, captura de imagem não integrada, licenciamento burlável, sem resiliência a queda de energia.
