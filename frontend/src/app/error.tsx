'use client';

/**
 * F9: Error boundary raiz (alem do (authenticated)/error.tsx).
 * Captura erros antes da segmentacao autenticada (login, esqueci, etc.).
 */

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[RootError]', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-semibold text-slate-800">Erro inesperado</h1>
          <p className="mb-4 text-sm text-slate-600">
            {error.message || 'Algo deu errado. Tente novamente.'}
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
