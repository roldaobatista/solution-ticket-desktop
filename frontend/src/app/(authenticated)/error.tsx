'use client';

/**
 * F9: Error boundary do segmento autenticado.
 *
 * Renderizado pelo App Router quando uma rota filha lanca durante
 * render/effect/event (server actions ja tem proprio fallback).
 * Evita "tela branca" generica.
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden="true" />
      <h2 className="text-xl font-semibold text-slate-800">Algo deu errado nesta tela</h2>
      <p className="max-w-prose text-sm text-slate-600">
        {error.message || 'Erro inesperado. Tente novamente; se persistir, recarregue a aplicacao.'}
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400">
          ID do erro: <code>{error.digest}</code>
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="primary" onClick={reset}>
          Tentar novamente
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          Voltar ao painel
        </Button>
      </div>
    </div>
  );
}
