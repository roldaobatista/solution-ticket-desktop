import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TraceparentInterceptor } from './traceparent.interceptor';

type TraceRequest = {
  headers: Record<string, string | undefined>;
  traceId?: string;
};

type TraceResponse = {
  setHeader: jest.Mock<void, [string, string]>;
};

function makeContext(req: TraceRequest, res: TraceResponse): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
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

function makeNext(): CallHandler {
  return { handle: jest.fn(() => of(null)) };
}

describe('TraceparentInterceptor', () => {
  let interceptor: TraceparentInterceptor;

  beforeEach(() => {
    interceptor = new TraceparentInterceptor();
  });

  it('preserva traceparent válido do frontend', () => {
    const valid = '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01';
    const req: TraceRequest = { headers: { traceparent: valid } };
    const res: TraceResponse = { setHeader: jest.fn() };
    const context = makeContext(req, res);
    const next = makeNext();

    interceptor.intercept(context, next);
    expect(req.traceId).toBe(valid);
    expect(res.setHeader).toHaveBeenCalledWith('traceparent', valid);
  });

  it('gera traceparent válido quando header ausente', () => {
    const req: TraceRequest = { headers: {} };
    const res: TraceResponse = { setHeader: jest.fn() };
    const context = makeContext(req, res);
    const next = makeNext();

    interceptor.intercept(context, next);
    const generated = req.traceId as string;
    expect(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i.test(generated)).toBe(true);
    expect(res.setHeader).toHaveBeenCalledWith('traceparent', generated);
  });

  it('gera traceparent válido quando header malformado', () => {
    const req: TraceRequest = { headers: { traceparent: 'invalid' } };
    const res: TraceResponse = { setHeader: jest.fn() };
    const context = makeContext(req, res);
    const next = makeNext();

    interceptor.intercept(context, next);
    const generated = req.traceId as string;
    expect(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i.test(generated)).toBe(true);
  });
});
