# ADR-006: Backend continua restrito a 127.0.0.1

**Status**: Aprovada
**Data**: 2026-04-26

## Contexto

O backend NestJS do Solution Ticket roda em `127.0.0.1:3001` por decisão de segurança documentada em `CLAUDE.md`. Há tentação de "abrir" o backend para receber webhooks entrantes do ERP diretamente. Isso é **inseguro** — a máquina da balança ficaria exposta na internet, sujeita a ataques.

## Decisão

**Manter o backend restrito a `127.0.0.1`** por padrão. Mudança disso é considerada breach de segurança.

Para receber eventos do ERP (webhooks entrantes):

1. **Polling local** com checkpoint incremental — padrão recomendado
2. **Relay cloud** com agent local fazendo poll/long-polling — quando ERP só oferecer webhook
3. **iPaaS do cliente** intermediando — quando cliente já tiver MuleSoft/Boomi/Digibee

**Nunca**:

- Abrir porta pública na máquina da balança
- Expor backend em LAN sem TLS + firewall + auth forte
- Confiar em "túnel ngrok" como solução permanente

### Quando habilitar exposição em LAN

Apenas com configuração explícita por cliente, exigindo:

- TLS obrigatório (certificado válido)
- IP allowlist
- Auth forte (JWT com expiração curta)
- Firewall ativo
- Auditoria de acesso

## Consequências

### Positivas

- Superfície de ataque mínima
- Compatível com auditoria fiscal e LGPD
- Cliente não precisa gerenciar firewall/DMZ

### Negativas

- Webhooks entrantes exigem componente cloud separado (custo + complexidade)
- Latência maior para receber eventos do ERP (vs webhook direto)
- Estratégia de relay precisa ser desenhada (ver ADR-008)

## Alternativas consideradas

- **Backend em `0.0.0.0`** com hardening: rejeitada — risco operacional
- **Túnel reverso (ngrok/Cloudflare Tunnel)**: aceitável apenas para testes, nunca produção

## Referências

- `CLAUDE.md` seção "Princípios de trabalho"
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 2.2
- `docs/integracao/ESTRATEGIA-RELAY-CLOUD.md`
