import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

interface RequestWithId extends Request {
  requestId?: string;
}

interface HttpExceptionResponseBody {
  message?: string | string[];
  code?: string;
  [key: string]: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      const exceptionResponse: HttpExceptionResponseBody =
        typeof raw === 'object' && raw !== null ? (raw as HttpExceptionResponseBody) : {};
      message =
        (Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0]
          : exceptionResponse.message) || exception.message;
      code = exceptionResponse.code || this.getCodeFromStatus(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // RS1: reportar a Sentry erros 5xx e excecoes nao-Http (4xx sao validacao do cliente).
    if (status >= 500 || !(exception instanceof HttpException)) {
      this.reportToSentry(exception, request);
      this.logger.error(
        `[${request?.requestId ?? '-'}] ${request?.method ?? '-'} ${request?.url ?? '-'} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message: Array.isArray(message) ? message[0] : message,
      timestamp: new Date().toISOString(),
    });
  }

  private reportToSentry(exception: unknown, request: RequestWithId): void {
    try {
      Sentry.withScope((scope) => {
        if (request?.requestId) scope.setTag('request_id', request.requestId);
        if (request?.method && request?.url) {
          scope.setContext('request', {
            method: request.method,
            url: request.url,
            user_agent: request.headers?.['user-agent'],
          });
        }
        if (exception instanceof Error) {
          Sentry.captureException(exception);
        } else {
          Sentry.captureMessage(`Non-Error throw: ${String(exception)}`, 'error');
        }
      });
    } catch {
      // Sentry nao deve quebrar o handler — silencia falhas de telemetria.
    }
  }

  private getCodeFromStatus(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_ERROR',
    };
    return codes[status] || 'UNKNOWN_ERROR';
  }
}
