# Matriz de Permissões e Escopo Tenant

> Documento de referência para auditoria, onboarding de desenvolvedores e validação de acesso.
> Última atualização: 2026-04-26

## Regras gerais

1. **Todo endpoint autenticado** exige `tenantId` no JWT (injetado pelo `TenantGuard`).
2. **Todo endpoint com `@Roles`** exige que o usuário possua a permissão correspondente.
3. **Escopo tenant** significa que o usuário só pode acessar/criar/modificar dados cujo `tenantId` corresponda ao seu.
4. **Relações cruzadas** (`clienteId`, `produtoId`, `unidadeId`, etc.) são validadas contra o tenant no momento da criação (ex: `TicketService.create`).

---

## Permissões do sistema

| Permissão              | Endpoint(s) típicos                                           | Descrição                   |
| ---------------------- | ------------------------------------------------------------- | --------------------------- |
| `ticket:criar`         | `POST /api/tickets`                                           | Abrir ticket                |
| `ticket:editar`        | `PATCH /api/tickets/:id`                                      | Editar ticket aberto        |
| `ticket:fechar`        | `POST /api/tickets/:id/fechar`                                | Fechar ticket               |
| `ticket:cancelar`      | `POST /api/tickets/:id/cancelar`                              | Cancelar ticket             |
| `ticket:manutencao`    | `POST /api/tickets/:id/manutencao/*`                          | Manutenção pós-fechamento   |
| `ticket:reimprimir`    | `POST /api/tickets/:id/reimprimir`                            | Reimprimir ticket           |
| `cadastro:gerenciar`   | `POST /api/clientes`, `POST /api/produtos`, etc.              | CRUD de cadastros mestre    |
| `config:gerenciar`     | `POST /api/balancas`, `PATCH /api/balancas/:id`               | Configurar balanças         |
| `romaneio:gerenciar`   | `POST /api/romaneios`                                         | Gerenciar romaneios         |
| `fatura:gerenciar`     | `POST /api/faturas`                                           | Gerenciar faturas           |
| `relatorio:visualizar` | `GET /api/relatorios/*`                                       | Visualizar relatórios       |
| `dashboard:visualizar` | `GET /api/dashboard/*`                                        | Visualizar dashboard        |
| `usuarios:gerenciar`   | `POST /api/usuarios`, `POST /api/perfis`                      | Gerenciar usuários e perfis |
| `licenca:gerenciar`    | `POST /api/licenca/ativar`, `POST /api/licenca/iniciar-trial` | Ativar/licenciar unidade    |
| `auditoria:visualizar` | `GET /api/auditoria`                                          | Visualizar auditoria        |
| `peso:manual`          | `POST /api/balancas/:id/capturar`                             | Capturar peso manualmente   |
| `passagem:invalidar`   | `PATCH /api/tickets/:id/passagens/:pid/invalidar`             | Invalidar passagem          |
| `pagamento:gerenciar`  | `POST /api/faturas/:id/pagamentos`                            | Registrar pagamento         |

---

## Escopo Tenant por módulo

### Tickets (`/api/tickets`)

- `findAll`, `findOne`, `update`, `fechar`, `cancelar`, `manutencao`, `reimprimir`: filtra por `tenantId` do JWT.
- `create`: valida `unidadeId`, `clienteId`, `produtoId`, `veiculoId`, `transportadoraId`, `motoristaId`, `origemId`, `destinoId`, `armazemId`, `indicadorPesagemId` contra o tenant antes de persistir.
- `getEstatisticas`: filtra por `unidadeId` **e** `tenantId`.

### Balanças (`/api/balancas`)

- `findAll`, `findOne`, `update`, `updateStatus`, `remove`: filtra por `tenantId`.
- `create`: valida se `empresaId` pertence ao tenant e `unidadeId` pertence à empresa.
- Hardware (`peso`, `stream`, `capturar`, `testar`, `conectar`): exige `tenantId` do JWT para buscar configuração da balança.

### Cadastros (`/api/clientes`, `/api/produtos`, `/api/veiculos`, etc.)

- Todo CRUD já aplica `tenantId` nos services (padrão existente antes desta correção).

### Licenciamento (`/api/licenca`)

- `fingerprint`, `status`: públicos (não exigem auth).
- `ativar`, `iniciar-trial`: exigem `LICENCA_GERENCIAR` e `tenantId` é validado contra a unidade.

### Usuários (`/api/usuarios`, `/api/perfis`)

- Todo CRUD aplica `tenantId`. Email é globalmente único (identidade global).

---

## Testes de segurança recomendados

Para validar isolamento tenant, executar cenários como:

1. Usuário do **Tenant A** tenta `GET /api/balancas/:id` de balança do **Tenant B** → esperado `404`.
2. Usuário do **Tenant A** tenta `POST /api/tickets` com `unidadeId` do **Tenant B** → esperado `403` (relação não pertence ao tenant).
3. Usuário do **Tenant A** tenta `GET /api/tickets/estatisticas/:unidadeId` do **Tenant B** → esperado `0` em todas as contagens (tenant filtra).
