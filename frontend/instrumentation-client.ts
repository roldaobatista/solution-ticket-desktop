import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Onda 5: Scrub PII — nunca enviar senhas, tokens, CPF/CNPJ
    if (event.request?.data) {
      const scrub = (str: string) =>
        str.replace(
          /"(password|senha|token|authorization|cpf|cnpj|documento)"\s*:\s*"[^"]*"/gi,
          '"$1":"[REDACTED]"',
        );
      event.request.data = scrub(
        typeof event.request.data === 'string'
          ? event.request.data
          : JSON.stringify(event.request.data),
      );
    }
    return event;
  },
});
