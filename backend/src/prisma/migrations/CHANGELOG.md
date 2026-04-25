# Migrations Changelog

Histórico de migrations Prisma deste projeto. Em desenvolvimento o time usou `prisma db push` por velocidade; a partir de 2026-04 todas as mudanças passam por migration formal.

| Data       | Migration                                      | Resumo                                                                                        | Reversível                       |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------- |
| 2026-04-24 | `20260424175219_init`                          | Schema inicial completo (auth, ticket, balança, fatura, comercial, licença, parametrizações). | Não — recriar do zero.           |
| 2026-04-24 | `20260424180000_add_foto_automacao_assinatura` | Campos de foto, automação e assinatura digital em ticket/operações.                           | Sim (DROP COLUMN).               |
| 2026-04-24 | `20260424190000_indicador_balanca_extensao`    | Extensão de indicador da balança (parser, marcador, fator, inverte peso).                     | Sim (DROP COLUMN).               |
| 2026-04-24 | `20260424191000_balanca_padrao_unidade`        | Balança padrão por unidade.                                                                   | Sim (DROP COLUMN + DROP UNIQUE). |
| 2026-04-25 | `20260425000000_catchup_indices_uniques_v1_1`  | Índices catch-up + uniques pendentes (consolidação pós-`db push`).                            | Sim (DROP INDEX).                |
| 2026-04-25 | `20260425100000_pessoa_tipo_produtor_rural`    | Suporte a pessoa do tipo Produtor Rural (CPF + Inscrição Estadual).                           | Sim (DROP COLUMN).               |

## Procedimento padrão

1. Toda alteração de schema **em produção** vira migration:

   ```bash
   pnpm --filter ./backend db:migrate -- --name <nome_descritivo_snake_case>
   ```

2. Atualizar este CHANGELOG com a entrada (data, migration, resumo, reversibilidade).
3. Verificar `pnpm --filter ./backend db:migrate:status` antes do release.
4. Para deploy: `pnpm --filter ./backend db:migrate:prod`.

## Convenções

- Nome: `YYYYMMDDHHMMSS_<verbo>_<entidade>_<detalhe>`.
- Reversibilidade: marcar "Não" só quando exigir backup/restore (ex: drop de coluna com dados, conversão de tipo destrutiva).
- Migrations destrutivas (`DROP TABLE`, `DROP COLUMN` com dados, `TRUNCATE`) exigem aprovação explícita em PR.
