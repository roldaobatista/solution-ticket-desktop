const MIN_SECRET_LENGTH = 32;
const FORBIDDEN_FALLBACKS = new Set([
  'solutionticket-secret-key-2024',
  'solution-ticket-local-secret-key-2024',
  'default-secret-change-me',
  'changeme',
  'secret',
]);

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET ausente. Defina em backend/.env (gere com: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\")",
    );
  }
  if (FORBIDDEN_FALLBACKS.has(secret)) {
    throw new Error('JWT_SECRET está usando valor padrão público. Rotacione imediatamente.');
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET muito curto (mínimo ${MIN_SECRET_LENGTH} caracteres).`);
  }
  return secret;
}
