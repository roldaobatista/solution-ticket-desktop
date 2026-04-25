/**
 * Helpers para mensagem de erro sem `catch (e: unknown)`.
 * Mesma ideia do frontend src/lib/errors.ts mas para Node/NestJS.
 */

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function errorMessage(e: unknown, fallback = 'Erro inesperado'): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message || fallback;
  if (isObject(e)) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.length) return m;
  }
  return fallback;
}

/** Acesso seguro a `e.code` / `e.errno` (erros de I/O Node ou de bibliotecas). */
export function errorCode(e: unknown): string | number | undefined {
  if (!isObject(e)) return undefined;
  const c = (e as { code?: unknown; errno?: unknown }).code ?? (e as { errno?: unknown }).errno;
  if (typeof c === 'string' || typeof c === 'number') return c;
  return undefined;
}
