# Stores Zustand

Convenções (F10):

| Store           | Persistência       | Versão | Justificativa                                                              |
| --------------- | ------------------ | ------ | -------------------------------------------------------------------------- |
| `auth.store`    | `localStorage`     | 1      | UX: manter user/auth flag entre reloads (token vai em sessionStorage).     |
| `unidade.store` | **Memória apenas** | —      | RS4: evita ler unidade ativa via XSS. Re-buscado via `getMe()` no relogin. |
| `config.store`  | **Memória apenas** | —      | Server state (puxado do backend). Não persistir.                           |
| `ticket.store`  | **Memória apenas** | —      | Estado vivo da tela de pesagem (peso, conexão, passagens).                 |

## Regras

1. **Apenas `auth.store` persiste.** Demais stores são UI state efêmero.
2. **Token JWT NÃO entra em store persistido.** Vai em `sessionStorage` (key `access_token`) — ver `lib/api/client.ts`.
3. **Mudou shape persistido?** Bump `version` + adicionar branch em `migrate`. Versões desconhecidas devem retornar `undefined` (força reset).
4. **Server state pertence ao React Query**, não a stores. Use `useQuery` para ler do backend.
