# ADR-002: Outbox transacional local-first em SQLite

**Status**: Aprovada
**Data**: 2026-04-26

## Contexto

Pesagem é **operação crítica de balança**: o ticket precisa fechar mesmo com ERP, internet ou VPN fora do ar. Ao mesmo tempo, **nenhum ticket pode ser perdido** entre o fechamento e o envio ao ERP — Receita Federal exige rastro de 5 anos.

Padrões disponíveis:

1. Chamada síncrona ao ERP no momento do fechamento — **inaceitável**, balança trava
2. Fila externa (RabbitMQ, Kafka) — **inaceitável** em desktop local-first
3. Outbox pattern em SQLite local — adequado ao contexto

## Decisão

Toda escrita destinada ao ERP é gravada em `integracao_outbox` **na mesma transação** que o evento de domínio. Worker assíncrono local lê o outbox e despacha para o conector apropriado.

Configurações obrigatórias:

- **SQLite WAL mode** habilitado para concorrência leitura/escrita
- **Lock pessimista** por evento (`UPDATE ... WHERE status = 'PENDING' RETURNING ...`) para evitar dupla execução por workers concorrentes
- **Idempotency key** determinística por evento (`tenant:empresa:unidade:ticket:revision`)
- **At-least-once delivery** — duplicidade é evitada pela idempotency key, não pela fila

## Consequências

### Positivas

- Balança fecha pesagem mesmo offline
- Zero perda — commit do evento e commit do outbox são atômicos
- Sem dependência de infraestrutura externa
- Auditoria fiscal preservada
- Reprocessamento manual trivial (UPDATE status = 'PENDING')

### Negativas

- Limite de throughput do SQLite (~1000 eventos/min validados em spike)
- Worker precisa ser robusto (lock + retry + classificação de erro)
- DLQ exige interface de gestão

## Alternativas consideradas

- **Mensageria externa**: rejeitada (local-first)
- **Chamada direta ao ERP**: rejeitada (acopla balança)
- **Outbox em arquivo JSON**: rejeitada (sem garantia atômica entre evento e fila)

## Riscos

- **SQLite gargalo em pico (safra)**: spike S0-02 valida 1000 eventos/min; se cliente exceder, plano B é outbox em SQLite secundário ou LiteFS.

## Referências

- Chris Richardson, _Microservices Patterns_, cap. 3 (Transactional Outbox)
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 3.1
