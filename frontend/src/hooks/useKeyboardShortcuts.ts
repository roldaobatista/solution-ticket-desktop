import { useEffect } from 'react';

export type ShortcutMap = Record<string, (() => void) | undefined>;

/**
 * Hook simples para atalhos de teclado em telas de operação.
 * Ignora teclas quando o foco está em <input>/<textarea>/contentEditable.
 *
 * Exemplo:
 *   useKeyboardShortcuts({
 *     F1: () => capturar(),
 *     F2: () => fechar(),
 *     F3: () => imprimir(),
 *     Escape: () => cancelar(),
 *   });
 */
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      // F11: ignora atalhos enquanto qualquer modal/dialog estiver aberto.
      // Evita que F1/F2/Escape da pagina principal vazem para dentro do
      // Dialog (confirmacao de cancelamento, etc.) e disparem ambos.
      if (typeof document !== 'undefined') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) return;
      }
      const fn = map[ev.key];
      if (fn) {
        ev.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map, enabled]);
}
