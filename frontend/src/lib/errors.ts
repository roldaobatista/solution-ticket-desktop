/**
 * Helpers para extrair mensagem de erro de respostas axios sem ter que
 * usar `catch (e: any)` espalhado pelas pages.
 *
 * Uso:
 *   try { ... } catch (e) {
 *     showToast(extractMessage(e, 'Falha ao salvar'), 'error');
 *   }
 */

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/**
 * Tenta, na ordem:
 *   1. e.response.data.message  (axios + envelope NestJS)
 *   2. e.response.data.error
 *   3. e.message
 *   4. fallback
 */
export function extractMessage(e: unknown, fallback = 'Erro inesperado'): string {
  if (!isObject(e)) return fallback;
  const response = (e as { response?: unknown }).response;
  if (isObject(response)) {
    const data = (response as { data?: unknown }).data;
    if (isObject(data)) {
      const msg = (data as { message?: unknown; error?: unknown }).message;
      if (typeof msg === 'string' && msg.length) return msg;
      const err = (data as { error?: unknown }).error;
      if (typeof err === 'string' && err.length) return err;
    }
  }
  const m = (e as { message?: unknown }).message;
  if (typeof m === 'string' && m.length) return m;
  return fallback;
}
