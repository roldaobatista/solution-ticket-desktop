# Operação — Atalhos e modo quiosque

> Owner: SRE | Última revisão: 2026-04-27 | Versão: 5

## Atalhos de teclado (tela `/pesagem`)

Ativos quando há ticket aberto. Tecla é ignorada se foco estiver em campo de texto.

| Tecla | Ação                            |
| ----- | ------------------------------- |
| `F1`  | Capturar peso da balança ativa  |
| `F2`  | Abrir diálogo "Fechar ticket"   |
| `Esc` | Abrir diálogo "Cancelar ticket" |

Implementado por `frontend/src/hooks/useKeyboardShortcuts.ts`. Para adicionar mais atalhos: passar nova entrada no map.

## Modo quiosque (Electron)

Para balanças desacompanhadas (operador único, sem outras janelas):

```bash
# .env do Electron ou variável de ambiente do shortcut
KIOSK_MODE=true
```

Comportamento:

- Janela em **fullscreen** sem barra de título.
- Sem barra de menu (Alt não traz de volta).
- `mainWindow.kiosk = true` — só fecha via `Alt+F4` ou `Ctrl+Q` se mantidos.

Para sair do quiosque:

- Reiniciar com `KIOSK_MODE=false` ou variável removida.
- Alternativamente, fechar processo via Gerenciador de Tarefas.

## Feedback visual da balança

A página `/pesagem` exibe status de conexão da balança ativa. Verde = `statusOnline=true`,
vermelho = offline, com a última leitura mostrada em tempo real via WebSocket
(`PesoRealtime` component).

## Multi-balança numa unidade

Operadores escolhem a balança ativa via `Select` no topo da página `/pesagem`.
A primeira balança com `statusOnline=true` é selecionada automaticamente no boot.
