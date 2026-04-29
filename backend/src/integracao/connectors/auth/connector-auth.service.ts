import { Injectable } from '@nestjs/common';
import { ConnectorConfig, IntegrationContext } from '../connector.interface';
import { ProfileSecretService } from '../../secrets/profile-secret.service';

@Injectable()
export class ConnectorAuthService {
  constructor(private readonly secrets: ProfileSecretService) {}

  async applyAuth(
    headers: Record<string, string>,
    config: ConnectorConfig,
    context: IntegrationContext,
  ): Promise<Record<string, string>> {
    const normalized = this.normalizeHeaders(headers);

    if (config.authMethod === 'none') return normalized;

    const secretValue = await this.secrets.resolve(context.profileId, config.secretRef);
    if (!secretValue) {
      throw new Error(`Credencial ${config.secretRef ?? '(sem referencia)'} nao encontrada`);
    }

    if (config.authMethod === 'api_key') {
      const header = this.optionString(config.options?.apiKeyHeader) ?? 'X-API-Key';
      const prefix = this.optionString(config.options?.apiKeyPrefix);
      normalized[header] = prefix ? `${prefix} ${secretValue}` : secretValue;
      return normalized;
    }

    if (config.authMethod === 'basic') {
      const credentials = this.parseBasicCredentials(secretValue, config.options);
      normalized.Authorization = `Basic ${Buffer.from(
        `${credentials.username}:${credentials.password}`,
      ).toString('base64')}`;
      return normalized;
    }

    throw new Error(`Metodo de autenticacao ${config.authMethod} nao suportado pelo conector`);
  }

  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(headers).filter((entry): entry is [string, string] => {
        const [, value] = entry;
        return typeof value === 'string' && value.length > 0;
      }),
    );
  }

  private parseBasicCredentials(
    secretValue: string,
    options?: Record<string, unknown>,
  ): { username: string; password: string } {
    const configuredUsername = this.optionString(options?.basicUsername);
    if (configuredUsername) return { username: configuredUsername, password: secretValue };

    try {
      const parsed = JSON.parse(secretValue) as { username?: unknown; password?: unknown };
      if (typeof parsed.username === 'string' && typeof parsed.password === 'string') {
        return { username: parsed.username, password: parsed.password };
      }
    } catch {
      // Permite o formato simples usuario:senha para operacao local assistida.
    }

    const separator = secretValue.indexOf(':');
    if (separator > 0) {
      return {
        username: secretValue.slice(0, separator),
        password: secretValue.slice(separator + 1),
      };
    }

    throw new Error('Credencial basic deve conter usuario e senha');
  }

  private optionString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }
}
