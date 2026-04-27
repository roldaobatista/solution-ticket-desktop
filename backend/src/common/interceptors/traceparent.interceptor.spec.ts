import { TraceparentInterceptor } from './traceparent.interceptor';

describe('TraceparentInterceptor', () => {
  let interceptor: TraceparentInterceptor;

  beforeEach(() => {
    interceptor = new TraceparentInterceptor();
  });

  it('preserva traceparent válido do frontend', () => {
    const valid = '00-1234567890abcdef1234567890abcdef-1234567890abcdef-01';
    const req: any = { headers: { traceparent: valid } };
    const res: any = { setHeader: jest.fn() };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    };
    const next: any = { handle: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };

    interceptor.intercept(context, next);
    expect(req.traceId).toBe(valid);
    expect(res.setHeader).toHaveBeenCalledWith('traceparent', valid);
  });

  it('gera traceparent válido quando header ausente', () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: jest.fn() };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    };
    const next: any = { handle: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };

    interceptor.intercept(context, next);
    const generated = req.traceId as string;
    expect(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i.test(generated)).toBe(true);
    expect(res.setHeader).toHaveBeenCalledWith('traceparent', generated);
  });

  it('gera traceparent válido quando header malformado', () => {
    const req: any = { headers: { traceparent: 'invalid' } };
    const res: any = { setHeader: jest.fn() };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    };
    const next: any = { handle: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };

    interceptor.intercept(context, next);
    const generated = req.traceId as string;
    expect(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i.test(generated)).toBe(true);
  });
});
