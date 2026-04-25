/**
 * F9: Loading state do segmento autenticado.
 *
 * Mostrado pelo App Router enquanto o componente da rota carrega
 * (Suspense boundary automatico).
 */

export default function AuthenticatedLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700"
          aria-hidden="true"
        />
        <p className="text-sm">Carregando...</p>
      </div>
    </div>
  );
}
