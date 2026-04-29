import { ConnectorAuthService } from './connector-auth.service';
import { ProfileSecretService } from '../../secrets/profile-secret.service';

describe('ConnectorAuthService', () => {
  const secrets = {
    resolve: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  function makeService() {
    return new ConnectorAuthService(secrets as unknown as ProfileSecretService);
  }

  it('aplica api key com header configuravel sem expor segredo em outros campos', async () => {
    secrets.resolve.mockResolvedValue('secret-token');

    const headers = await makeService().applyAuth(
      { 'X-App': 'solution-ticket' },
      {
        authMethod: 'api_key',
        secretRef: 'erp-token',
        options: { apiKeyHeader: 'Authorization', apiKeyPrefix: 'Bearer' },
      },
      {
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        profileId: 'profile-1',
        correlationId: 'corr-1',
      },
    );

    expect(headers).toEqual({
      'X-App': 'solution-ticket',
      Authorization: 'Bearer secret-token',
    });
    expect(secrets.resolve).toHaveBeenCalledWith('profile-1', 'erp-token');
  });

  it('aplica basic auth a partir de json salvo como segredo', async () => {
    secrets.resolve.mockResolvedValue(JSON.stringify({ username: 'user', password: 'pass' }));

    const headers = await makeService().applyAuth(
      {},
      { authMethod: 'basic', secretRef: 'erp-basic' },
      {
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        profileId: 'profile-1',
        correlationId: 'corr-1',
      },
    );

    expect(headers.Authorization).toBe(`Basic ${Buffer.from('user:pass').toString('base64')}`);
  });
});
