/**
 * Utilitario de scrubbing de PII e segredos para logs.
 *
 * Mascara, recursivamente, valores cujo nome de campo casa com a lista
 * SENSITIVE_KEYS (case-insensitive). Tambem mascara JWTs detectados
 * heuristicamente em strings (tres segmentos base64 separados por ponto).
 *
 * Uso tipico em interceptors/loggers:
 *   logger.log({ req: scrubPii(req.body), userId });
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'senha',
  'senhaatual',
  'novasenha',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'jwt',
  'jwt_secret',
  'apikey',
  'api_key',
  'secret',
  'fingerprint',
  'cpf',
  'cnpj',
  'rg',
  'inscricaoestadual',
  'cardnumber',
  'cvv',
]);

const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;

function isSensitiveKey(name: string): boolean {
  return SENSITIVE_KEYS.has(name.toLowerCase());
}

function scrubScalar(value: unknown): unknown {
  if (typeof value === 'string' && JWT_RE.test(value)) return REDACTED;
  return value;
}

export function scrubPii(input: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => scrubPii(v, depth + 1));
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = scrubPii(v, depth + 1);
      }
    }
    return out;
  }
  return scrubScalar(input);
}

/** Lista exposta para customizacao em testes/debug. */
export const _SENSITIVE_KEYS_FOR_TESTS = SENSITIVE_KEYS;
