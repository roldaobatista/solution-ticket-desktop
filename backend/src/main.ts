import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { ensureUserDataDir, getDatabaseUrl } from './common/desktop-paths';

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
  });
  logger.log('Sentry inicializado.');
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
  logger.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  app.setGlobalPrefix('api');

  // Request-id para correlação em logs (header X-Request-Id)
  app.use((req: any, res: any, next: any) => {
    const id = req.headers['x-request-id'] || randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Electron/Next.js controlam CSP no front
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

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
