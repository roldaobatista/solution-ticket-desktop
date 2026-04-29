import { ConnectorRegistryService } from './connector-registry.service';
import { GenericRestConnector } from './generic-rest/generic-rest.connector';

describe('ConnectorRegistryService', () => {
  it('registra o Mock Connector por padrao', () => {
    const registry = new ConnectorRegistryService();

    expect(registry.get('mock').code).toBe('mock');
    expect(registry.list()).toEqual([
      expect.objectContaining({
        code: 'mock',
        capabilities: expect.objectContaining({
          supportsOutbound: true,
        }),
      }),
    ]);
  });

  it('registra conector Generic REST quando injetado pelo modulo', () => {
    const genericRest = {
      code: 'generic-rest',
      name: 'Generic REST ERP Connector',
      version: '1.0.0',
      capabilities: () => ({
        authMethods: ['none', 'api_key', 'basic'],
        entities: ['weighing_ticket'],
        supportsInbound: false,
        supportsOutbound: true,
      }),
      testConnection: jest.fn(),
      push: jest.fn(),
    } as unknown as GenericRestConnector;

    const registry = new ConnectorRegistryService(genericRest);

    expect(registry.get('generic-rest')).toBe(genericRest);
    expect(registry.list()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'generic-rest',
          capabilities: expect.objectContaining({ authMethods: ['none', 'api_key', 'basic'] }),
        }),
      ]),
    );
  });
});
