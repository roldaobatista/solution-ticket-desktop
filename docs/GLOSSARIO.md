# Glossário

Termos técnicos, comerciais e legais usados na documentação do Solution Ticket.

---

## A

**ACL (Anti-Corruption Layer)**: padrão DDD onde uma camada isola o domínio interno do modelo de sistemas externos. No Solution Ticket: o módulo de integração isola o core de pesagem dos ERPs.

**Allowlist**: lista de itens permitidos (oposto de blacklist). No contexto: IPs autorizados a acessar API pública em LAN, padrões aceitos pelo mapping engine, etc.

**Anti-replay**: mecanismo de segurança que impede reenvio de requests interceptados. No Solution Ticket combina HMAC + nonce único + timestamp com janela curta (relay cloud rejeita requisições fora da janela ou com nonce já visto).

**ADR (Architecture Decision Record)**: documento curto que registra uma decisão arquitetural, com contexto e consequências.

**ANPD**: Autoridade Nacional de Proteção de Dados (LGPD).

**API Key**: chave estática para autenticar requisições HTTP. Mais simples que OAuth, menos seguro.

**At-least-once delivery**: garantia de mensageria onde toda mensagem é entregue **ao menos uma vez** (pode duplicar — idempotência resolve).

---

## B

**BAPI (Business Application Programming Interface)**: API SAP, geralmente acessada via RFC.

**Backoff exponencial**: estratégia de retry onde delay cresce exponencialmente (30s, 60s, 2min, 4min...).

**BANT**: Budget, Authority, Need, Timing — framework de qualificação de leads B2B.

**Bulkhead**: padrão de resiliência onde recursos são isolados por cliente/feature, evitando que um problema afete todos.

**Burn-rate alert**: alerta multi-window (ex.: janelas curta + longa) que mede a velocidade de consumo do error budget de um SLO. Dispara quando o consumo extrapola o ritmo aceitável para o período (ver `integracao/SLO-INTEGRACAO.md`).

---

## C

**Canônico (modelo)**: formato interno de dados, agnóstico de qualquer ERP. Conectores traduzem canônico ↔ ERP.

**CAC**: Customer Acquisition Cost — custo para adquirir um cliente.

**Checkpoint**: ponto de salvamento que indica até onde uma sincronização incremental processou.

**Circuit Breaker**: padrão que "abre o circuito" para um endpoint que falha repetidamente, evitando avalanche.

**Conector**: implementação concreta de `IErpConnector` para um ERP específico (ex: BlingConnector).

**CT-e**: Conhecimento de Transporte Eletrônico (documento fiscal de transporte).

---

## D

**DLQ (Dead Letter Queue)**: fila onde eventos vão quando esgotam tentativas de processamento ou falham por motivo de negócio. Exigem ação humana.

**Doce-spot (sweet spot)**: segmento de ICP onde o produto tem maior fit de valor/preço. No Solution Ticket: empresas Médio BR R$ 50–500M/ano com balança crítica e ERP médio (Sankhya, Bling/Omie no topo, TOTVS RM/Datasul mid-range). Detalhes em `comercial/PLAYBOOK-MEDIO-BR.md`.

**Domain event**: evento emitido por um módulo de negócio quando algo importante acontece (ex: `weighing.ticket.closed`).

**DOR (Definition of Ready)**: critérios que uma user story precisa atender antes de entrar em sprint (gate de entrada).

**DoD (Definition of Done)**: critérios que uma user story / sprint precisa atender para ser considerada concluída (gate de saída).

**DOR/DOD**: par de gates (entrada/saída) usado em backlog grooming e sprint review para garantir qualidade consistente.

**DPA (Data Processing Agreement)**: contrato entre controlador e operador de dados (LGPD/GDPR).

**DPAPI (Data Protection API)**: API do Windows que encripta dados pelo perfil do usuário.

**DPO**: Data Protection Officer — encarregado de proteção de dados (LGPD art. 41).

---

## E

**EAI (Enterprise Application Integration)**: hub TOTVS Datasul para mensageria.

**Event Mesh**: serviço SAP de mensageria (Kafka-like) para S/4HANA Cloud.

---

## F

**FBDI (File-Based Data Import)**: caminho oficial Oracle para cargas em massa.

**Fingerprint**: identificador único de hardware (MAC + hostname + serial). Usado para licenciamento RSA.

**Fingerprint de hardware**: hash criptográfico que combina MAC address + hostname + serial do volume C: (ou equivalente) usado pelo licenciamento RSA-2048 para amarrar uma licença a uma máquina específica. Ver `keygen/`.

---

## G

**GA (General Availability)**: status de produto/feature liberada para uso geral.

**GoodsMovement**: movimento de mercadoria no SAP (entrada/saída de estoque).

---

## H

**HMAC (Hash-based Message Authentication Code)**: assinatura criptográfica usada em webhooks.

**Hub**: o módulo de integração como um todo (camada que orquestra outbox + workers + conectores).

**Harpia**: nome interno do TOTVS para a release 2023+ do Protheus que introduziu APIs REST.

---

## I

**ICP (Ideal Customer Profile)**: perfil de cliente ideal para o produto.

**Idempotência**: propriedade onde executar a mesma operação múltiplas vezes produz o mesmo resultado.

**Idempotency key**: chave única que identifica uma operação para evitar duplicidade.

**IDoc**: formato de documento padrão SAP para integração.

**Inbox**: tabela onde eventos recebidos do ERP aguardam processamento.

**iPaaS**: Integration Platform as a Service (MuleSoft, Boomi, Workato, etc.).

---

## J

**JCo (Java Connector)**: biblioteca SAP para conectar Java/Node a ECC via RFC.

**JSONata**: linguagem de transformação e expressão para JSON. Engine padrão do mapping engine do Solution Ticket (ADR-011). Cobre path navigation, expressões, templates e transformações funcionais com sandbox seguro.

---

## K

**KEK / DEK**: duas camadas de criptografia para gerenciar segredos. **DEK (Data Encryption Key)** cifra o dado real (ex.: credencial do ERP); **KEK (Key Encryption Key)** cifra a DEK. Permite rotação de chave-mestra sem precisar re-cifrar todos os segredos — basta re-cifrar as DEKs com a KEK nova. Ver `integracao/005-seguranca-credenciais.md`.

---

## L

**LGPD**: Lei Geral de Proteção de Dados (Lei 13.709/2018).

**LIA (Legitimate Interest Assessment)**: análise formal de balanceamento exigida pela LGPD para uso de "legítimo interesse" como base legal.

**Local-first**: arquitetura onde funcionalidade principal funciona localmente, sem dependência de internet/cloud.

**LTV**: Customer Lifetime Value — receita total esperada de um cliente.

---

## M

**Mapping engine**: motor que aplica regras YAML para traduzir dados canônicos ↔ formato do ERP.

**MDF-e**: Manifesto Eletrônico de Documentos Fiscais.

**Modelo canônico**: ver "Canônico (modelo)".

**MoSCoW**: Must-have / Should-have / Could-have / Won't-have — priorização.

**MRR**: Monthly Recurring Revenue.

**mTLS**: TLS mútuo (cliente também apresenta certificado, não só servidor).

---

## N

**NF-e**: Nota Fiscal Eletrônica.

**NSM (North Star Metric)**: métrica única que captura o valor entregue ao cliente e guia o produto. No Solution Ticket: candidatas em discussão (ex.: "tickets fechados com integração ERP confirmada por mês").

---

## O

**OAuth 2.0**: protocolo padrão de autenticação delegada.

**OData**: protocolo REST padronizado pela Microsoft, usado por SAP, Dynamics, Acumatica, IFS.

**Outbox pattern**: padrão de mensageria onde evento de integração é gravado na **mesma transação** que o evento de domínio. Garante at-least-once.

**Outbox / Inbox**: par de filas persistentes que dão garantia at-least-once em integrações. **Outbox** = eventos saindo do Solution Ticket para o ERP; **Inbox** = eventos chegando do ERP. Ambas suportam retry, DLQ e idempotência. Ver `integracao/004-outbox-inbox-retry.md`.

---

## P

**Partition key**: chave de particionamento usada para garantir ordering FIFO **por entidade** dentro da outbox/inbox (ex.: `tenant_id + entity_type + entity_id`). Eventos da mesma chave são processados em ordem; chaves diferentes podem rodar em paralelo.

**PII**: Personally Identifiable Information — dados pessoais.

**PKCE (Proof Key for Code Exchange)**: extensão do OAuth 2.0 para clients públicos (ex.: desktop, SPA) que não conseguem proteger um client_secret. Usa code_verifier + code_challenge para impedir interceptação do authorization code. Ver ADR-012.

**Polling**: estratégia onde cliente consulta servidor periodicamente em busca de novidades (vs webhook push).

**Protheus**: ERP da TOTVS — o mais usado no Brasil em indústria/agro.

---

## R

**RBAC (Role-Based Access Control)**: controle de acesso por papel.

**RPO (Recovery Point Objective)**: máxima perda de dados aceitável em incidente, medida em tempo. RPO=0 significa zero perda.

**RTO (Recovery Time Objective)**: tempo máximo aceitável para restaurar serviço após incidente.

**RPA**: Robotic Process Automation (UiPath, Automation Anywhere). Simula operador clicando na tela.

**Relay (relay cloud)**: componente cloud que recebe webhooks do ERP e os entrega ao agent local via long-polling.

**Retry policy**: regras de tentar novamente em caso de falha (backoff, jitter, limite de tentativas).

---

## S

**SaaS**: Software as a Service.

**Sankhya**: ERP brasileiro forte em médias empresas.

**SDR**: Sales Development Representative — inside sales focado em prospecção.

**SDK**: Software Development Kit.

**Senior Sistemas**: ERP brasileiro com forte presença em indústria/RH.

**SLA**: Service Level Agreement — acordo de nível de serviço.

**SLI (Service Level Indicator)**: métrica medida que reflete a qualidade do serviço (ex.: % de eventos confirmados em < 60s).

**SLO (Service Level Objective)**: meta interna sobre um SLI (ex.: 99% dos eventos confirmados em < 60s no mês). Compromisso operacional, normalmente mais rigoroso que o SLA contratado. Ver `integracao/SLO-INTEGRACAO.md`.

**SOAP**: protocolo de web service legado, baseado em XML.

**Sprint**: ciclo de desenvolvimento (geralmente 2 semanas).

**SSO**: Single Sign-On.

**Story point**: unidade de estimativa de esforço relativa.

**Story points recalibrados**: estimativas revisadas após a Rodada 1 da auditoria 10-agentes (CRITICAL C6), que apontou subestimação. Valores oficiais agora vivem em `integracao/REPLANEJAMENTO-STORY-POINTS.md` e nos backlogs S0-1, S2-S5.

---

## T

**TBC (TOTVS Business Connect)**: middleware de mensageria do TOTVS RM.

**TCK (Test Conformance Kit / Tech Compliance Kit)**: suíte obrigatória de testes que um conector deve passar para ser certificado. No Solution Ticket: 62 testes em 6 categorias (interface, idempotência, classificação de erro, resiliência, segurança, performance). Ver `integracao/TCK-SPEC.md`.

**Tenancy**: modelo de isolamento entre clientes/empresas. No Solution Ticket é **single-tenant lógico** no desktop (cada instalação serve uma empresa fiscal); ADR-010 detalha por que multi-tenant cloud não é objetivo.

**Tenant**: unidade de isolamento. No Solution Ticket: empresa fiscal local (ver ADR-010).

**Tier-1**: ERPs corporativos grandes (SAP, Oracle, Microsoft, TOTVS Protheus).

**TLS**: Transport Layer Security — encriptação em trânsito.

**TLPP**: linguagem de extensão TOTVS sucessora do ADVPL.

**TMS**: Transportation Management System.

**TOP (Tipo de Operação)**: configuração no Sankhya que define semântica fiscal/contábil.

**TOTVS**: maior fornecedora de ERP do Brasil (Protheus, RM, Datasul).

**Traceparent (W3C Trace Context)**: header HTTP padrão (`traceparent`) que carrega trace-id, span-id e flags para correlação distribuída entre serviços. Solution Ticket propaga traceparent em chamadas a ERPs e relay para rastrear fluxos ponta-a-ponta.

---

## U

**Unit-convert**: transformação de mapping para converter unidades (kg ↔ ton ↔ saca).

---

## V

**Vault**: cofre de credenciais (HashiCorp Vault, Azure Key Vault, AWS Secrets Manager).

---

## W

**WAL (Write-Ahead Logging)**: modo SQLite que melhora concorrência leitura/escrita.

**Webhook**: notificação HTTP enviada pelo servidor ao cliente quando algo acontece.

**WMS**: Warehouse Management System.

**Worker**: processo background que consome a outbox e despacha eventos.

---

## Y

**YAML**: formato de serialização legível, usado para mapping declarativo.

---

## Termos comerciais

- **Onboarding técnico**: serviço pago de implementação inicial (Discovery + mapping + treinamento)
- **Setup fee**: taxa única no início do contrato
- **Marketplace**: futuro ecossistema de conectores parceiros (Fase 4)
- **Revenue share**: divisão de receita entre Solution Ticket e parceiro (70/30, 80/20, 90/10)

---

**Versão**: 1.1 — 2026-04-27 (Rodada 5: +16 entradas — anti-replay, burn-rate, doce-spot, DOR/DOD, fingerprint de hardware, KEK/DEK, NSM, outbox/inbox, partition key, PKCE, SLO/SLI, story points recalibrados, TCK, tenancy, traceparent W3C)
**Manutenção**: atualizar quando termo novo aparecer em mais de 2 documentos.
