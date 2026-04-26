import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import type { Request, Response, NextFunction } from 'express';
import { ensureUserDataDir, getDatabaseUrl } from './common/desktop-paths';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
// ResponseTransformInterceptor ja e registrado via APP_INTERCEPTOR em
// common.module.ts. Importar duas vezes (DI + useGlobalInterceptors)
// gerava envelope duplo {success,data:{success,data,timestamp},timestamp}
// e quebrava o desembrulho automatico do axios no frontend.

interface RequestWithId extends Request {
  requestId?: string;
}

// S2.4: chaves PII que devem ser removidas antes de enviar a Sentry.
const SENSITIVE_KEYS = new Set([
  'password',
  'senha',
  'senhaatual',
  'novasenha',
  'senhahash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'jwt',
  'cpf',
  'cnpj',
  'rg',
  'chave',
  'chavelicenciamento',
  'apikey',
  'secret',
]);

function scrubPii<T>(value: T, depth = 0): T {
  if (depth > 8 || value == null) return value;
  if (Array.isArray(value)) {
    return value.map((v) => scrubPii(v, depth + 1)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : scrubPii(v, depth + 1);
    }
    return out as unknown as T;
  }
  return value;
}

function initSentry(logger: Logger) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.log('Sentry desativado (SENTRY_DSN ausente).');
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_package_version,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    beforeSend(event) {
      if (event.request) {
        if (event.request.data) event.request.data = scrubPii(event.request.data);
        if (event.request.headers) {
          event.request.headers = scrubPii(event.request.headers) as typeof event.request.headers;
        }
        if (event.request.cookies) event.request.cookies = { redacted: '[REDACTED]' };
      }
      if (event.extra) event.extra = scrubPii(event.extra);
      if (event.contexts) event.contexts = scrubPii(event.contexts);
      return event;
    },
  });
  logger.log('Sentry inicializado (com PII scrubbing).');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  initSentry(logger);

  // Garante diretório de dados e define DATABASE_URL dinâmico
  // antes de qualquer coisa que use Prisma.
  const dataDir = ensureUserDataDir();
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = getDatabaseUrl();
  }
  logger.log(`Diretório de dados: ${dataDir}`);
  // SEC: DATABASE_URL nunca é logado (pode conter path com username Windows)

  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  app.setGlobalPrefix('api');

  // Request-id para correlação em logs (header X-Request-Id)
  app.use((req: RequestWithId, res: Response, next: NextFunction) => {
    const headerId = req.headers['x-request-id'];
    const id = (Array.isArray(headerId) ? headerId[0] : headerId) || randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // Security headers (S1: CSP restritivo — API só serve JSON, sem HTML ativo)
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'none'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", "'unsafe-inline'"], // Swagger UI precisa inline
          scriptSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  // RS5: Permissions-Policy minima — desabilita APIs que o backend nao usa
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    next();
  });

  // CORS apenas para origens conhecidas (Next dev + Electron app://)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'app://./'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // S6: logging com PII scrubbing — todo request/response passa por
  // scrubPii() antes de ser logado/relatado.
  app.useGlobalInterceptors(new LoggingInterceptor());

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Solution Ticket API')
      .setDescription('API do Sistema de Pesagem Veicular Solution Ticket')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3001);
  const host = '127.0.0.1';
  await app.listen(port, host);

  logger.log(`Backend local em http://${host}:${port}/api`);
  if (!isProd) {
    logger.log(`Swagger em     http://${host}:${port}/api/docs`);
  }
  logger.log(`Health check   http://${host}:${port}/api/health`);
}

bootstrap();
