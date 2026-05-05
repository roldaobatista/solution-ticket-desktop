import {
  type CallHandler,
  type ExecutionContext,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import type { AuditoriaService } from '../../auditoria/auditoria.service';

type AuditRequest = {
  method: string;
  url: string;
  user?: { id?: string; tenantId?: string };
  params?: { id?: string };
};

function makeContext(req: AuditRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

function makeNext(response: unknown): CallHandler {
  return { handle: jest.fn(() => of(response)) };
}

describe('AuditInterceptor', () => {
  let registrar: jest.Mock;
  let interceptor: AuditInterceptor;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    registrar = jest.fn().mockResolvedValue({});
    interceptor = new AuditInterceptor({ registrar } as unknown as AuditoriaService);
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('aborta mutacao critica antes do handler quando auditoria esta indisponivel', async () => {
    registrar.mockRejectedValueOnce(new Error('db down'));
    const context = makeContext({
      method: 'POST',
      url: '/api/tickets',
      user: { id: 'u1', tenantId: 'tenant' },
    });
    const next = makeNext({ data: { id: 'ticket-1' } });

    await expect(firstValueFrom(interceptor.intercept(context, next))).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(next.handle).not.toHaveBeenCalled();
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar.mock.calls[0][0]).toMatchObject({
      entidade: 'tickets',
      entidadeId: 'unknown',
      evento: 'post.create.preflight',
      tenantId: 'tenant',
    });
  });

  it('nao converte falha de auditoria pos-handler em falso abort para mutacao critica', async () => {
    registrar.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('db down after'));
    const response = { data: { id: 'ticket-1' } };
    const context = makeContext({
      method: 'POST',
      url: '/api/tickets',
      user: { id: 'u1', tenantId: 'tenant' },
    });
    const next = makeNext(response);

    await expect(firstValueFrom(interceptor.intercept(context, next))).resolves.toBe(response);
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledTimes(2);
  });

  it('mantem auditoria nao critica como best-effort', async () => {
    registrar.mockRejectedValueOnce(new Error('db down'));
    const response = { ok: true };
    const context = makeContext({
      method: 'POST',
      url: '/api/relatorios-salvos',
      user: { id: 'u1', tenantId: 'tenant' },
    });
    const next = makeNext(response);

    await expect(firstValueFrom(interceptor.intercept(context, next))).resolves.toBe(response);
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(registrar).toHaveBeenCalledTimes(1);
  });
});
