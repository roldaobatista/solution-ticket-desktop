# Contrato Técnico — Conector Sankhya

**Status**: Rascunho v1.0 — 2026-04-26
**Conector**: `sankhya` (categoria: Médio BR)
**ERP destino**: Sankhya OM
**Owner**: Analista Integração ERP + Tech Lead
**Cliente piloto**: a definir

> ⚠️ **Validar via documentação oficial Sankhya antes do Sprint 6**: o EIP/Gateway tem evolução constante. Este contrato é base de Discovery.
>
> 🔴 **Auditoria 2026-04-26 identificou 2 erros factuais neste contrato (CRITICAL C4)**:
>
> 1. URL/endpoint híbrido entre MGE clássico e Gateway novo é inconsistente — Sankhya tem 2 hosts distintos (`/mge/service.sbr` clássico vs `/gateway/v1/...` novo). Definir qual cliente usa antes de implementar.
> 2. Mapping para `CabecalhoNota` usa `TIPMOV` direto, mas em Sankhya `TIPMOV` é **derivado de CODTIPOPER** (TOP) e somente leitura. Corrigir mapping para gravar apenas CODTIPOPER.
>
> Reabrir Discovery antes do Sprint 6.

---

## 1. Discovery

### 1.1 Identificação

| Item                 | Valor                         |
| -------------------- | ----------------------------- |
| Produto              | Sankhya OM                    |
| Versão               | Cloud SaaS atual              |
| Documentação         | docs.sankhya.com.br           |
| Programa de parceria | Necessário (Sankhya Partners) |

### 1.2 Métodos disponíveis

- **API Services REST (Gateway)** — escolhido
- EIP Sankhya (ESB) — para fluxos complexos
- JAPE (extensão Java) — apenas para customização interna do cliente
- Apsen (mensageria) — opcional

### 1.3 Autenticação

- **API Token estático** (preferível em produção server-to-server) — gerado no painel Sankhya por usuário dedicado
- Fallback: **Token JWT** via login (`POST /service.sbr?serviceName=MobileLoginSP.login`) com relogin automático (token expira ~24h, sem refresh nativo)
- Decisão final por cliente em Discovery — recomendar API Token quando viável (mais simples + sem expiração)

### 1.4 Rate limits

- Não documentados oficialmente
- Comportamento observado: cluster suporta alto throughput
- Spike obrigatório: validar 100 req/min sem 429

### 1.5 Ambiente de homologação

- Sankhya disponibiliza ambiente de teste mediante parceria
- URL pattern: `https://api.sankhya.com.br/...`
- Massa de teste configurada pelo cliente piloto

---

## 2. Contrato

### 2.1 Direção dos dados

| Entidade                                    | Direção          | Dono                              |
| ------------------------------------------- | ---------------- | --------------------------------- |
| Parceiro (cliente/fornecedor/transportador) | Sankhya → ST     | Sankhya                           |
| Produto                                     | Sankhya → ST     | Sankhya                           |
| Veículo                                     | Configurável     | Cliente decide (geralmente local) |
| Motorista                                   | Local            | ST                                |
| Pedido (negociação financeira)              | Sankhya → ST     | Sankhya                           |
| Nota fiscal                                 | Sankhya → ST     | Sankhya                           |
| **Ticket de pesagem**                       | **ST → Sankhya** | **ST**                            |
| Cancelamento                                | ST → Sankhya     | ST                                |

### 2.2 Estratégia de mapeamento

Sankhya tem entidades nativas para movimentação. Opções:

1. **Movimento (TGFCAB / TGFITE)** — escolhido para ticket
2. Nota de remessa — mais pesado, evitar
3. Tabela customizada AD_TICKETPESAGEM — só se cliente já tiver

**Decisão**: ticket vira **Negociação tipo "TIPO_PESAGEM"** (a definir com cliente piloto), com itens detalhados e referência cruzada ao parceiro/produto/veículo.

### 2.3 Tratamento de exceções

| Evento                           | Comportamento       |
| -------------------------------- | ------------------- |
| Parceiro inexistente             | `FAILED_BUSINESS`   |
| Produto inexistente              | `FAILED_BUSINESS`   |
| Negociação travada (TOP fechada) | `FAILED_BUSINESS`   |
| Quantidade > saldo de pedido     | `FAILED_BUSINESS`   |
| Token expirado                   | Re-login automático |
| 5xx                              | Retry com backoff   |

### 2.4 Cancelamento

Sankhya suporta cancelamento via `CRUDServiceProvider.delete` ou flag de status na negociação. Decisão por cliente.

---

## 3. Mapeamento de campos

### 3.1 Pull: produto Sankhya → `CanonicalProduct`

| Campo Sankhya (TGFPRO) | Canônico      | Transformação               |
| ---------------------- | ------------- | --------------------------- |
| `CODPROD`              | `externalId`  | direct                      |
| `CODPROD`              | `code`        | direct                      |
| `DESCRPROD`            | `description` | direct                      |
| `CODVOL`               | `unit`        | lookup (UN→un, KG→kg, etc.) |
| `AD_NCM`               | `fiscalCode`  | direct                      |

### 3.2 Pull: parceiro Sankhya → `CanonicalPartner`

| Campo Sankhya (TGFPAR) | Canônico            | Transformação                                 |
| ---------------------- | ------------------- | --------------------------------------------- |
| `CODPARC`              | `externalId`        | direct                                        |
| `CGC_CPF`              | `taxId`             | normalize (digits-only)                       |
| `RAZAOSOCIAL`          | `name`              | direct (razão social — nome oficial/jurídico) |
| `NOMEPARC`             | `fantasyName`       | direct (nome curto / fantasia — TGFPAR)       |
| `INSCEST`              | `stateRegistration` | direct                                        |
| `CLIENTE`              | `type`              | condition: `S` → CUSTOMER                     |
| `FORNECEDOR`           | `type`              | condition: `S` → SUPPLIER                     |
| `TRANSPORTADORA`       | `type`              | condition: `S` → CARRIER                      |

### 3.3 Push: ticket → Sankhya

> **Sankhya tem 2 plataformas tecnicamente distintas. Cliente usa UMA**:
>
> - **MGE clássico** (on-premise, mais comum) — `/mge/service.sbr` + JWT MobileLoginSP
> - **Gateway novo** (Sankhya Cloud) — endpoints REST `/gateway/v1/...` + OAuth Bearer
>
> **Os endpoints reais do Gateway novo NÃO são inferíveis por substituição
> de prefixo `/mge/` → `/gateway/v1/mge/`.** Esse atalho era a hipótese da
> v1.0 deste contrato e foi marcada como erro factual na auditoria 2026-04-27.
> O Gateway é uma API REST nova com paths próprios — exige Discovery oficial
> com Sankhya Partners por cliente que estiver no Sankhya Cloud.
>
> As tabelas abaixo separam **MGE clássico** (validado) e **Gateway novo**
> (preliminar — endpoints listados são hipotéticos e DEVEM ser validados via
> Discovery oficial antes de implementar).

```yaml
version: 1
connector: sankhya
entity: WeighingTicket
operation: push
endpoint:
  method: POST
  path: /mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord
  # Para Gateway novo: trocar baseUrl no profile, manter path

fields:
  - remote: serviceName
    type: fixed
    value: CRUDServiceProvider.saveRecord

  - remote: requestBody.dataSet.entityName
    type: fixed
    value: CabecalhoNota

  # NOTA: TIPMOV é derivado de CODTIPOPER (TOP) no Sankhya — não gravar diretamente.
  # Sankhya determina TIPMOV automaticamente conforme TOP cadastrado.
  - remote: requestBody.dataSet.fields
    type: expression
    expression: |
      [
        {"fieldName": "CODTIPOPER", "value": $lookup("negotiation-type-pesagem", ticket.operationType)},
        {"fieldName": "CODPARC", "value": ticket.partner.externalId},
        {"fieldName": "DTNEG", "value": $dateFormat(ticket.timestamps.closedAt, "DD/MM/YYYY")},
        {"fieldName": "AD_TICKETNUM", "value": ticket.ticketNumber},
        {"fieldName": "AD_PLACA", "value": $uppercase(ticket.vehicle.plate)},
        {"fieldName": "AD_PESOLIQ", "value": ticket.weights.netKg}
      ]

# Item da nota (tabela ITEM)
items:
  - remote: ItemNota
    fields:
      - { fieldName: CODPROD, value: '{{lookup:product-sankhya:ticket.product.code}}' }
      - { fieldName: QTDNEG, value: '{{ticket.weights.netKg}}' }
      - { fieldName: CODVOL, value: 'kg' }
      - { fieldName: VLRUNIT, value: 0 }

response:
  externalIdPath: '$.responseBody.pk.NUNOTA'
  successCondition: "$.status == '1'"
```

### 3.4 Tabelas de equivalência

| Tabela                     | Origem              | Destino            | Quem mantém                        |
| -------------------------- | ------------------- | ------------------ | ---------------------------------- |
| `negotiation-type-pesagem` | tipo de operação ST | CODTIPOPER Sankhya | Cliente                            |
| `product-sankhya`          | código local        | CODPROD            | Cliente (opcional se mesmo código) |
| `unit-sankhya-empresa`     | unidade ST          | CODEMP Sankhya     | Cliente                            |

---

## 4. Endpoints utilizados

Sankhya tem **duas plataformas distintas**. As tabelas abaixo são separadas
porque são duas APIs diferentes, com auth, paths e payloads diferentes —
**não é o mesmo endpoint com prefixo trocado**.

### 4.1 MGE clássico (on-premise — validado em campo)

| Operação  | Método | Endpoint                                                       | Auth                        |
| --------- | ------ | -------------------------------------------------------------- | --------------------------- |
| Login     | POST   | `/mge/service.sbr?serviceName=MobileLoginSP.login`             | Body com `NOMUSU`+`INTERNO` |
| Logout    | POST   | `/mge/service.sbr?serviceName=MobileLoginSP.logout`            | JWT `JSESSIONID`            |
| CRUD save | POST   | `/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord`  | JWT `JSESSIONID`            |
| CRUD load | POST   | `/mge/service.sbr?serviceName=CRUDServiceProvider.loadRecords` | JWT `JSESSIONID`            |
| Query SQL | POST   | `/mge/service.sbr?serviceName=DbExplorerSP.executeQuery`       | JWT `JSESSIONID`            |

Auth: token JWT no cookie `JSESSIONID` retornado pelo MobileLoginSP.login.
Token expira ~24h sem refresh nativo — conector faz re-login automático.

### 4.2 Gateway novo (Sankhya Cloud — preliminar, validar Discovery)

> 🔴 **Os paths abaixo são PRELIMINARES.** O Gateway novo é uma API REST
> distinta (não é o MGE clássico com prefixo trocado). Endpoints reais
> dependem do produto Sankhya Cloud habilitado para o cliente. **Validar
> Discovery oficial via Sankhya Partners antes de cravar implementação.**

| Operação              | Método | Endpoint (preliminar)                         | Auth                       |
| --------------------- | ------ | --------------------------------------------- | -------------------------- |
| OAuth token           | POST   | `/auth/oauth2/token` (a confirmar)            | client credentials ou code |
| OAuth refresh         | POST   | `/auth/oauth2/token?grant_type=refresh_token` | refresh token              |
| OAuth revoke          | POST   | `/auth/oauth2/revoke` (a confirmar)           | Bearer                     |
| Movimento — criar     | POST   | `/gateway/v1/movimentos` (a confirmar)        | Bearer                     |
| Movimento — atualizar | PUT    | `/gateway/v1/movimentos/{id}` (a confirmar)   | Bearer                     |
| Parceiros — listar    | GET    | `/gateway/v1/parceiros` (a confirmar)         | Bearer                     |
| Produtos — listar     | GET    | `/gateway/v1/produtos` (a confirmar)          | Bearer                     |

Auth: OAuth 2.0 Bearer (não é o JWT MobileLoginSP do MGE clássico).
Discovery oficial obrigatório no Sprint que implementar Gateway novo.

### 4.3 Ciclo de vida de auth

| Cenário                             | MGE clássico                        | Gateway novo                                          |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| Token expirado                      | Re-login automático (MobileLoginSP) | Refresh OAuth (`grant_type=refresh_token`)            |
| Refresh `invalid_grant` transitório | n/a                                 | Retry com backoff (até 3×)                            |
| Refresh `invalid_grant` permanente  | n/a                                 | Marcar `NEEDS_REAUTH`; UI dispara fluxo interativo    |
| Desativar conector                  | Apagar credencial do cofre          | Chamar `/auth/oauth2/revoke` antes de apagar; auditar |
| Cliente desinstala app no painel    | n/a                                 | Próximo refresh retorna `invalid_grant` permanente    |

---

## 5. Webhooks

Sankhya **não** tem webhook nativo robusto. Estratégia:

- **Polling** a cada 5–15 min para entidades críticas
- Filtros incrementais via `LASTUPDATE` ou `DTALTER`

Detalhes em discovery do cliente piloto.

---

## 6. Erros conhecidos

### 6.1 Técnicos

| Erro                    | Ação                |
| ----------------------- | ------------------- |
| 401 / "sessão inválida" | Re-login automático |
| 500 com timeout         | Retry               |
| Cluster busy            | Backoff             |

### 6.2 Negócio

| Erro                 | Ação                                         |
| -------------------- | -------------------------------------------- |
| `MGECOM-XXX`         | Erro de validação Sankhya — operador resolve |
| "Saldo insuficiente" | Negócio — não retenta                        |
| "Parceiro bloqueado" | Negócio — operador desbloqueia               |

### 6.3 Formato de erro

```json
{
  "status": "0",
  "statusMessage": "Mensagem de erro Sankhya",
  "errorCode": "MGECOM-XXX"
}
```

Conector parsa `statusMessage` para `lastError`.

---

## 7. Massa de teste

- 5 parceiros (clientes/fornecedores/transp)
- 10 produtos
- 2 tipos de operação (TOP) configuradas
- 2 empresas (CODEMP)

---

## 8. Estrutura do conector

```
backend/src/integracao/connectors/sankhya/
  sankhya.connector.ts
  sankhya.auth.ts             # JWT login + relogin automático
  sankhya.client.ts           # CRUDServiceProvider wrapper
  sankhya.mapper.ts
  sankhya.errors.ts           # parser de MGECOM-*
  sankhya.fixtures.ts
  sankhya.connector.spec.ts
  mapping/sankhya-default.yaml
```

---

## 9. Riscos específicos do Sankhya

| Risco                                              | Mitigação                                 |
| -------------------------------------------------- | ----------------------------------------- |
| Cliente customizou TGFPAR/TGFPRO com campos `AD_*` | Mapping editável por cliente              |
| Token sem refresh nativo (re-login)                | Cache + retry transparent                 |
| Sem webhook → polling pode atrasar eventos         | Frequência configurável; aceitar latência |
| TOP (tipo de operação) varia por cliente           | Tabela de equivalência obrigatória        |
| Parceria Sankhya exige homologação formal          | Iniciar processo no Sprint 6              |

---

## 10. Aprovação

- [ ] Tech Lead revisou
- [ ] Analista ERP revisou
- [ ] Cliente piloto confirmou (TOP, AD\_\*, regras)
- [ ] Parceria Sankhya aprovada
- [ ] PM aprovou escopo
