import { Injectable } from '@nestjs/common';

export interface ConnectorHttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  baseUrl: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export interface ConnectorHttpResponse {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: unknown;
}

type FetchLike = typeof fetch;

@Injectable()
export class ConnectorHttpClientService {
  private readonly fetchImpl: FetchLike = fetch;

  async request(request: ConnectorHttpRequest): Promise<ConnectorHttpResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? 15000);

    try {
      const response = await this.fetchImpl(this.buildUrl(request.baseUrl, request.path), {
        method: request.method,
        headers: {
          Accept: 'application/json',
          ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
          ...(request.headers ?? {}),
        },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
      });

      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: await this.parseBody(response),
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Timeout ao chamar ERP apos ${request.timeoutMs ?? 15000}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(baseUrl: string, path: string): string {
    const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return new URL(normalizedPath, base).toString();
  }

  private async parseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
