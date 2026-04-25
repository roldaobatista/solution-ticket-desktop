# Disaster Recovery — Solution Ticket Desktop

## Backups automáticos

- **Diário:** todo dia às 23:00 (cron `0 23 * * *`) — somente em `NODE_ENV=production`.
- **Mensal:** todo dia 1º o backup diário também é copiado para `monthly/`.
- **Manual:** via endpoint `POST /api/backup/create` (requer permissão `config:gerenciar`).
- **Retenção:** 30 diários + 12 mensais. Backups manuais não rotacionam.

## Localização

```
%APPDATA%/SolutionTicket/backups/
├── daily/      (até 30 arquivos, retenção FIFO)
├── monthly/    (até 12 arquivos)
└── *.db        (manuais, sem retenção)
```

Cada `.db` tem um par `.db.sha256` com o checksum gerado no momento da criação.

## Endpoints

| Método | Rota                  | Descrição                                        |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/api/backup`         | Lista todos os backups com sha256, tamanho, data |
| POST   | `/api/backup/create`  | Gera backup manual imediato                      |
| POST   | `/api/backup/verify`  | Valida sha256 (body: `{filename}`)               |
| POST   | `/api/backup/restore` | Restaura backup (destrutivo, body: `{filename}`) |

## Procedimento de restore

1. Verificar integridade: `POST /api/backup/verify { "filename": "..." }`.
2. Avisar operadores (operação fecha conexões ativas).
3. Chamar `POST /api/backup/restore { "filename": "..." }`.
4. **Reiniciar a aplicação Electron** — o restore deixa o app em estado inconsistente até o reboot.
5. Validar manualmente: login, abrir um ticket recente, conferir totais.

O serviço gera automaticamente um backup `manual` com o estado pré-restore antes de sobrescrever, retornado em `preRestoreBackup` da resposta. Use-o para reverter se a restauração der errado.

## Verificação de integridade ad hoc

```bash
sha256sum solution-ticket-daily-2026-04-24-23-00-00-000Z.db
# Compare com o conteúdo do .sha256 correspondente.
```

## Desativar backup automático

```env
# backend/.env
RUN_MIGRATIONS_ON_BOOT=false   # opcional: desliga migrate deploy no boot
```

Para desligar apenas o cron (mantendo restore manual disponível), defina `NODE_ENV` diferente de `production`. Em prod, o cron sempre roda.

## Troubleshooting

| Sintoma                                 | Causa provável                             | Ação                                                             |
| --------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| Backup não criado às 23:00              | App fechado naquele momento                | Rode `POST /api/backup/create`                                   |
| `wal_checkpoint falhou` no log          | Conexões ativas no momento do backup       | Backup foi criado, mas pode faltar últimas transações; aceitável |
| Restore retorna 400 "Checksum inválido" | Arquivo corrompido ou alterado fora do app | Use outro backup; investigue antivírus/sync de nuvem             |
| Após restore, app não loga              | Conexão Prisma estale                      | Feche e reabra o Electron                                        |
