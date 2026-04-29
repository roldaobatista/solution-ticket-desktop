/**
 * Utilitario unificado de scrubbing de PII e segredos para logs/auditoria/Sentry.
 *
 * Mascara, recursivamente, valores cujo nome de campo casa com a lista
 * SENSITIVE_KEYS (case-insensitive). Tambem mascara JWTs detectados
 * heuristicamente em strings (tres segmentos base64 separados por ponto).
 *
 * Uso tipico em interceptors/loggers:
 *   logger.log({ req: scrubPii(req.body), userId });
 */
const SENSITIVE_KEYS = new Set([
  // Credenciais e tokens
  'password',
  'senha',
  'senhaatual',
  'novasenha',
  'senhahash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'jwt',
  'jwt_secret',
  'apikey',
  'api_key',
  'secret',
  'cookie',
  'chave',
  'chavelicenciamento',
  'chavevalidacao',
  'chavehash',
  // Identificacao pessoal
  'cpf',
  'cnpj',
  'rg',
  'documento',
  'inscricaoestadual',
  'inscricaomunicipal',
  'email',
  'telefone',
  'celular',
  'fax',
  'whatsapp',
  // Endereco
  'endereco',
  'logradouro',
  'bairro',
  'cidade',
  'cep',
  'complemento',
  'numeroendereco',
  // Dados veiculares e operacionais
  'placa',
  'cnh',
  'renavam',
  'chassi',
  // Dados empresariais / pessoais
  'razaosocial',
  'nomefantasia',
  'nomecompleto',
  'nomecomercial',
  'responsavel',
  'contato',
  'contatos',
  // Financeiros
  'cardnumber',
  'cvv',
  'ccv',
  'numerocartao',
  'validadecartao',
  'contabancaria',
  'agencia',
  'pix',
  // Hardware / licenca
  'fingerprint',
  'fingerprintdispositivo',
]);

const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_RE = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const PHONE_RE = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g;
const CARD_RE = /\b(?:\d[ -]*?){13,19}\b/g;
const ACCESS_TOKEN_QS_RE = /(access_token=)[^&\s]+/gi;
const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;

function isSensitiveKey(name: string): boolean {
  return SENSITIVE_KEYS.has(name.toLowerCase().replace(/[_\s-]/g, ''));
}

function scrubScalar(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (JWT_RE.test(value)) return REDACTED;
  return value
    .replace(ACCESS_TOKEN_QS_RE, `$1${REDACTED}`)
    .replace(EMAIL_RE, REDACTED)
    .replace(CNPJ_RE, REDACTED)
    .replace(CPF_RE, REDACTED)
    .replace(PHONE_RE, REDACTED)
    .replace(CARD_RE, REDACTED);
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
