'use client';

import { useCallback } from 'react';
import { useToastStore } from '@/stores/toast-store';

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);

  const success = useCallback(
    (message: string) => addToast({ message, type: 'success' }),
    [addToast],
  );
  const error = useCallback((message: string) => addToast({ message, type: 'error' }), [addToast]);
  const warning = useCallback(
    (message: string) => addToast({ message, type: 'warning' }),
    [addToast],
  );
  const info = useCallback((message: string) => addToast({ message, type: 'info' }), [addToast]);

  return { success, error, warning, info };
}
