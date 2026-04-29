# Modulo Integracao ERP

Chassi isolado do Hub de Integracao ERP local-first.

## Escopo entregue

- `IntegracaoModule` registrado no NestJS.
- Endpoints internos em `/api/v1/integration/*`.
- CRUD de perfis de integracao com validacao de tenant em empresa/unidade.
- Outbox idempotente com retry, DLQ tecnica e reprocessamento manual.
- Worker local agendado para processar outbox contra conectores registrados.
- Logs de integracao com payload mascarado.
- Registry de conectores plugaveis.
- `MockErpConnector` com cenarios de sucesso, timeout, 500, produto inexistente, pedido encerrado e duplicidade.
- `GenericRestConnector` para primeira integracao real via HTTP REST configuravel por perfil.
- Cliente HTTP com timeout, status handling, idempotency key e correlation id.
- Autenticacao `none`, `api_key` e `basic` com credenciais por perfil.
- Endpoints de cadastro/rotacao de credenciais sem retorno do valor armazenado.
- Interface `IErpConnector` para conectores plugaveis.

## Endpoints

- `GET /api/v1/integration/health`
- `GET /api/v1/integration/capabilities`
- `GET /api/v1/integration/profiles`
- `POST /api/v1/integration/profiles`
- `PATCH /api/v1/integration/profiles/:id`
- `DELETE /api/v1/integration/profiles/:id`
- `POST /api/v1/integration/profiles/:id/test-connection`
- `GET /api/v1/integration/profiles/:id/secrets`
- `POST /api/v1/integration/profiles/:id/secrets/:secretKey`
- `GET /api/v1/integration/events`
- `GET /api/v1/integration/outbox`
- `POST /api/v1/integration/outbox/:id/retry`
- `POST /api/v1/integration/outbox/process-next`
- `POST /api/v1/integration/profiles/:id/mock-events`

## Regras

- O core de pesagem nao conhece ERP.
- Eventos de dominio entram na outbox antes de qualquer chamada externa.
- Payload sensivel nunca deve ser registrado em log cru.
- Conectores reais usam `IErpConnector`; o Generic REST cobre o primeiro parceiro HTTP sem alterar worker/outbox.
- Credenciais sao resolvidas pelo `secretRef` do perfil e nunca retornadas por endpoints de leitura.

## Generic REST

Config do perfil aceita:

- `healthPath`: endpoint usado por `test-connection` (`/health` por padrao).
- `pushPath`: endpoint padrao de envio quando nao houver path por entidade.
- `entityPaths`: mapa por `entityType`, por exemplo `{ "weighing_ticket": "/api/tickets" }`.
- `headers`: headers fixos nao sensiveis.
- `timeoutMs`: timeout por chamada, minimo 1000ms, padrao 15000ms.
- `successStatus`: status unico ou lista de status aceitos.
- `externalIdPath`, `externalCodePath`, `remoteVersionPath`: caminhos no JSON de resposta.
- `apiKeyHeader`, `apiKeyPrefix`, `basicUsername`: opcoes de autenticacao.
