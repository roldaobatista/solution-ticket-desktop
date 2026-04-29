import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { IErpConnector } from './connector.interface';
import { GenericRestConnector } from './generic-rest/generic-rest.connector';
import { MockErpConnector } from './mock/mock-erp.connector';

@Injectable()
export class ConnectorRegistryService {
  private readonly connectors = new Map<string, IErpConnector>();

  constructor(@Optional() genericRestConnector?: GenericRestConnector) {
    this.register(new MockErpConnector());
    if (genericRestConnector) this.register(genericRestConnector);
  }

  register(connector: IErpConnector) {
    this.connectors.set(connector.code, connector);
  }

  get(code: string): IErpConnector {
    const connector = this.connectors.get(code);
    if (!connector) throw new NotFoundException(`Conector ${code} nao registrado`);
    return connector;
  }

  list() {
    return Array.from(this.connectors.values()).map((connector) => ({
      code: connector.code,
      name: connector.name,
      version: connector.version,
      capabilities: connector.capabilities(),
    }));
  }
}
