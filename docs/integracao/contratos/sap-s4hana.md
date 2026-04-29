# Contrato Técnico — Conector SAP S/4HANA

**Status**: Rascunho v1.0 — 2026-04-26
**Conector**: `sap-s4hana` (categoria: Global Tier-1)
**ERP**: SAP S/4HANA (Cloud + On-premise) e ECC (legado)
**Owner**: Tech Lead + Analista Integração ERP

> ⚠️ **Certificação SAP** obrigatória para selo "SAP Certified Integration" — iniciar mês 6 (lead time 4–6 meses).
>
> 🔴 **Auditoria 2026-04-26 identificou erro técnico (CRITICAL C4)**:
> O serviço `API_MATERIAL_DOCUMENT_SRV` **não aceita `to_MaterialDocumentItem` aninhado em criação simples** (POST direto). Exige **deep insert via `$batch`** com Content-ID e referenciamento entre header e items. YAML do mapping na seção 3.2 deve ser refeito para gerar requisição $batch multipart, ou usar `BAPI_GOODSMVT_CREATE` via SAP JCo (alternativa ECC) como rota inicial enquanto $batch é implementado.
>
> Corrigir antes do Sprint 14.

---

## 1. Discovery

| Item         | Valor                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Produto      | SAP S/4HANA Cloud / S/4HANA On-Premise / ECC (legado)                                                  |
| Documentação | help.sap.com + api.sap.com (Business Accelerator Hub)                                                  |
| Métodos      | OData v4 (Cloud), BAPI/RFC (ECC via SAP JCo), IDoc, Event Mesh (Kafka), CPI (Integration Suite), PI/PO |
| Auth         | OAuth 2.0 (Cloud), Communication User + senha (S/4 on-premise), SSL client cert (mTLS)                 |
| Rate limit   | Configurável por Communication Arrangement                                                             |
| Sandbox      | Trial Cloud + ambiente do cliente                                                                      |
| Certificação | **SAP Certified Integration** obrigatória para Cloud Marketplace                                       |

---

## 2. Contrato

### 2.1 Direção

| Entidade                | Direção      | Dono   | Objeto SAP                 |
| ----------------------- | ------------ | ------ | -------------------------- |
| Cliente                 | SAP → ST     | SAP    | KNA1                       |
| Fornecedor              | SAP → ST     | SAP    | LFA1                       |
| Material                | SAP → ST     | SAP    | MARA                       |
| Centro/depósito         | SAP → ST     | SAP    | T001W / LGORT              |
| Pedido (compra)         | SAP → ST     | SAP    | EKKO/EKPO                  |
| Pedido (venda)          | SAP → ST     | SAP    | VBAK/VBAP                  |
| Inbound Delivery        | SAP → ST     | SAP    | LIKP/LIPS                  |
| **Ticket de pesagem**   | **ST → SAP** | **ST** | Goods Movement (MIGO/MB1A) |
| Movimento de mercadoria | ST → SAP     | ST     | BAPI_GOODSMVT_CREATE       |
| Cancelamento            | ST → SAP     | ST     | Reverse Goods Movement     |

### 2.2 Estratégia

SAP tem múltiplas entidades para movimentação:

1. **Goods Movement (MIGO)** — escolhido para ticket
   - Movimento 101 (entrada por compra)
   - Movimento 601 (saída por venda)
2. **Inbound Delivery** — alternativa para recebimento
3. **Production Order Confirmation** — para indústria

**Decisão**: ticket vira **Goods Movement** via `BAPI_GOODSMVT_CREATE`, com referência ao pedido (EBELN/VBELN) quando aplicável.

### 2.3 Tratamento de exceções

| Evento                       | Comportamento      |
| ---------------------------- | ------------------ |
| Cliente bloqueado            | `FAILED_BUSINESS`  |
| Material bloqueado           | `FAILED_BUSINESS`  |
| Pedido encerrado/cancelado   | `FAILED_BUSINESS`  |
| Quantidade > saldo do PO     | `FAILED_BUSINESS`  |
| Período fechado (MM_PERIODS) | `FAILED_BUSINESS`  |
| Token OAuth expirado         | Refresh automático |
| 401                          | Re-auth + retry    |
| 5xx                          | Retry com backoff  |
| 429 (rate limit)             | `WAITING_RETRY`    |

---

## 3. Mapeamento

### 3.1 Pull Material SAP → CanonicalProduct

| Campo SAP (MARA)  | Canônico              | Transformação                           |
| ----------------- | --------------------- | --------------------------------------- |
| `MATNR`           | `externalId` / `code` | direct                                  |
| `MAKTX` (de MAKT) | `description`         | direct                                  |
| `MEINS`           | `unit`                | lookup (KG→kg, TO→ton, etc.)            |
| `MTART`           | `category`            | direct                                  |
| `MSTAE`           | `status`              | condition: status code → ACTIVE/BLOCKED |

### 3.2 Push ticket → SAP Goods Movement

> ⚠️ **Cloud OData v4 exige `$batch` deep insert** para criar header + items atomicamente. Endpoint simples (`A_MaterialDocumentHeader` com items aninhados) **NÃO é aceito** pela API SAP — gera erro 400. Duas estratégias:
>
> **Estratégia A (preferida — Cloud)**: usar `$batch` multipart com Content-IDs referenciando header→items
> **Estratégia B (fallback — ECC + S/4 on-premise)**: BAPI `BAPI_GOODSMVT_CREATE` via SAP JCo (seção 3.3)
>
> Exemplo abaixo (Estratégia B, ECC) é o caminho recomendado para Sprint 14 inicial; Estratégia A entra em Sprint 14+1.

```yaml
version: 1
connector: sap-s4hana
entity: WeighingTicket
operation: push
endpoint:
  method: POST
  # OData v4 (Cloud) — exige $batch para criar header+items.
  # Implementação inicial usa BAPI via JCo (seção 3.3) — mais simples, evita $batch.
  path: /sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/$batch
  # Para BAPI direto (ECC), usar driver JCo — não OData. Ver seção 3.3.

fields:
  - remote: PostingDate
    local: ticket.timestamps.closedAt
    type: date-format
    format: YYYY-MM-DDTHH:mm:ssZ

  - remote: DocumentDate
    local: ticket.timestamps.closedAt
    type: date-format
    format: YYYY-MM-DD

  - remote: ReferenceDocument
    local: ticket.references.purchaseOrder
    type: direct

  - remote: HeaderText
    type: expression
    expression: |
      "Pesagem " + ticket.ticketNumber + " - placa " + ticket.vehicle.plate

  - remote: to_MaterialDocumentItem
    type: array-template
    template:
      - Material: '{{ticket.product.externalId}}'
        Plant: '{{lookup:plant-sap:ticket.unitId}}'
        StorageLocation: '{{lookup:storloc-sap:ticket.unitId}}'
        GoodsMovementType: '{{condition:operation-to-movement-type}}'
        QuantityInEntryUnit: '{{ticket.weights.netKg}}'
        EntryUnit: KG
        PurchaseOrder: '{{ticket.references.purchaseOrder}}'
        PurchaseOrderItem: '{{ticket.references.purchaseOrderItem}}'

response:
  externalIdPath: '$.MaterialDocument'
  successCondition: '$.MaterialDocument != null'
```

### 3.3 ECC via BAPI (alternativa on-premise)

```typescript
// Pseudo-código para SAP JCo
const result = await jco.call('BAPI_GOODSMVT_CREATE', {
  GOODSMVT_HEADER: {
    PSTNG_DATE: '20260427',
    DOC_DATE: '20260427',
    REF_DOC_NO: ticketNumber,
    HEADER_TXT: `Pesagem ${ticketNumber}`,
  },
  GOODSMVT_CODE: { GM_CODE: '01' }, // 01=PO, 02=Production, 04=Other
  GOODSMVT_ITEM: [
    {
      MATERIAL: productCode,
      PLANT: plant,
      STGE_LOC: storageLocation,
      MOVE_TYPE: '101',
      ENTRY_QNT: netKg,
      ENTRY_UOM: 'KG',
      PO_NUMBER: purchaseOrder,
      PO_ITEM: '00010',
    },
  ],
});
```

### 3.4 Tabelas de equivalência

| Tabela                       | Origem           | Destino           |
| ---------------------------- | ---------------- | ----------------- |
| `plant-sap`                  | unidade ST       | T001W (centro)    |
| `storloc-sap`                | unidade ST       | LGORT (depósito)  |
| `operation-to-movement-type` | tipo operação ST | movement type SAP |
| `material-sap`               | código local     | MATNR (opcional)  |

---

## 4. Endpoints (Cloud OData v4)

| Operação            | Método | Endpoint                                              |
| ------------------- | ------ | ----------------------------------------------------- |
| Pull material       | GET    | `/API_PRODUCT_SRV/A_Product?$top=100&$filter=...`     |
| Pull cliente        | GET    | `/API_BUSINESS_PARTNER/A_BusinessPartner?$top=100`    |
| Push goods movement | POST   | `/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader` |
| Pull purchase order | GET    | `/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder`      |

---

## 5. Webhooks via Event Mesh

SAP S/4HANA Cloud suporta **SAP Event Mesh** (Kafka-like). Estratégia:

- Subscribe topics: `BusinessPartnerChanged`, `MaterialChanged`, `PurchaseOrderReleased`
- Relay cloud consome topics → encaminha ao agent local
- Latência típica < 5s

---

## 6. Erros conhecidos

| Categoria | Código SAP                                         | Ação          |
| --------- | -------------------------------------------------- | ------------- |
| Técnico   | `HTTP 502/503`                                     | Retry         |
| Técnico   | `HTTP 401`                                         | Refresh OAuth |
| Técnico   | `MM_BAPI_GOODSMVT_*` lock                          | Retry         |
| Negócio   | `M7 021` "Period closed"                           | DLQ + alerta  |
| Negócio   | `M7 162` "Stock insuficiente"                      | DLQ           |
| Negócio   | `F2 461` / `V1 ###` "Cliente bloqueado" (BP block) | DLQ           |
| Negócio   | `M3 ###` "Material status restringe movimento"     | DLQ           |

> ⚠️ Códigos exatos variam por versão SAP — validar com SAP Notes do cliente piloto durante Discovery (Etapa 1 do Playbook). Códigos `KE` (CO-PA) e `MIGO 421` listados em versão anterior eram especulativos.

Formato OData:

```json
{
  "error": {
    "code": "...",
    "message": { "value": "..." },
    "details": [...]
  }
}
```

ECC (BAPI return):

```typescript
{ TYPE: 'E', ID: 'M7', NUMBER: '021', MESSAGE: '...' }
```

---

## 7. Massa de teste

- 5 clientes (Business Partner role customer)
- 5 fornecedores (vendor role)
- 10 materiais (variar tipo: ROH, FERT, HALB)
- 2 plants (centros)
- 3 storage locations
- 3 purchase orders abertos

---

## 8. Estrutura

```
backend/src/integracao/connectors/sap-s4hana/
  sap-s4hana.connector.ts
  sap-s4hana.auth.ts          # OAuth Cloud + login on-premise
  sap-s4hana.client.ts        # OData + BAPI fallback
  sap-s4hana.mapper.ts
  sap-s4hana.errors.ts        # parser de mensagens M7/MM/etc
  sap-s4hana.fixtures.ts
  sap-s4hana.connector.spec.ts
  mapping/sap-s4hana-default.yaml
  mapping/sap-s4hana-agribusiness.yaml   # vertical agro
  jco/                                    # bridge para SAP JCo (ECC)
```

---

## 9. Riscos específicos

| Risco                                              | Mitigação                                              |
| -------------------------------------------------- | ------------------------------------------------------ |
| Certificação SAP demora 4–6 meses                  | Iniciar mês 6 da Fase 2                                |
| Cliente em ECC vs S/4HANA exige 2 conectores       | Estrutura comporta both; mesma interface IErpConnector |
| Communication Arrangement complicada de configurar | Material visual + suporte de implantação               |
| Customizações Z\* no ECC variam por cliente        | Mapping editável + Discovery profundo                  |
| Volume alto exige Event Mesh                       | Suportar desde GA (não polling)                        |
| Certificados ICP-Brasil para NF-e XML              | Cofre + auditoria adicional                            |

---

### 9.5 Ciclo de vida OAuth (SAP Cloud Identity Authentication)

S/4HANA Cloud usa **SAP Cloud Identity Authentication (IAS)** com OAuth 2.0
(Authorization Code para fluxos interativos; Client Credentials para
server-to-server via Communication Arrangement).

| Situação                                          | Ação do conector                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Access token expirado (401)                       | Refresh com `grant_type=refresh_token` (Auth Code) ou novo `client_credentials` (server-to-server); reexecutar 1×                           |
| Refresh OK                                        | Persistir par novo no cofre (refresh é rotacionado)                                                                                         |
| `invalid_grant` transitório (5xx no IAS / rede)   | Retry backoff (até 3×)                                                                                                                      |
| `invalid_grant` permanente                        | Conector `NEEDS_REAUTH`; UI dispara fluxo interativo (Auth Code) ou alerta admin (Client Credentials — verificar Communication Arrangement) |
| Desativar conector                                | Revogar token via `/oauth2/revoke` do IAS; remover Communication Arrangement no painel SAP; auditar                                         |
| Cliente desativa Communication User no painel SAP | Próximo request retorna 401 + refresh `invalid_grant` permanente                                                                            |

Para ECC via JCo, autenticação é Communication User + senha (não OAuth) —
sem refresh; rotacionar senha por política do cliente, persistir nova no
cofre, sem precisar de fluxo interativo.

---

## 10. Licenciamento (SAP JCo / SAP NW RFC SDK)

> 🔴 **Bloqueador comercial/jurídico.** Não distribuir conector ECC/on-premise
> sem fechar este item.

### 10.1 O que é

Para falar com SAP ECC ou S/4HANA on-premise via BAPI/RFC, o conector usa
**SAP Java Connector (SAP JCo)** — biblioteca que vem em duas peças:

- `sapjco3.jar` (Java)
- `sapjco3.dll` / `libsapjco3.so` (binário nativo por OS/arch)

O JCo é distribuído pelo SAP via **SAP Service Marketplace** sob licença
comercial. Ambas as peças (jar + binário) são **necessárias e licenciadas**.

### 10.2 Restrições de licença

- Download exige conta com **S-User** vinculado a contrato SAP comercial.
- **Proibido redistribuir** o `.jar`/`.dll` em pacote de instalação público
  ou repositório de artefatos genérico (Maven Central, NPM, GitHub Releases).
- Cada instalação corporativa ("end user installation") precisa estar coberta
  por contrato SAP — em geral, o cliente que já tem SAP ECC/S/4 já tem direito
  ao JCo via seu próprio contrato, mas isso é **caso a caso**.
- Para a Solution Ticket distribuir o conector como produto comercial,
  é necessário fechar com SAP um **acordo de redistribuição/OEM** ou
  obrigar contratualmente cada cliente a baixar o JCo do próprio S-User.

### 10.3 Estimativa de custo

> ⚠️ **Estimativa preliminar — validar com SAP comercial antes do GA.**

- Faixa típica: **USD 5.000 – 15.000/ano por instalação corporativa**
  (varia por porte do cliente, tier de suporte e tipo de acordo).
- Acordos de redistribuição OEM exigem negociação dedicada com SAP — lead
  time 3–6 meses, custo bem maior (>USD 50k/ano de mínimo, varia muito).
- A faixa acima é **referência de mercado**, não cotação SAP — exigir
  cotação formal por escrito antes de fechar pricing do conector.

### 10.4 Estratégia recomendada

1. **Caminho mais simples (early)**: cliente baixa JCo do próprio S-User,
   instala no servidor onde o conector roda. Sem redistribuição.
   Conector verifica presença do JCo em runtime e falha graciosamente
   se ausente, com instruções claras para o cliente.
2. **Caminho de produto (GA)**: avaliar acordo OEM com SAP — depende de
   volume de clientes Tier-1. Se <10 clientes Tier-1, manter modelo (1).
3. **Cloud-only**: clientes em S/4HANA Cloud usam OData/`$batch` — não
   precisam de JCo. Esse caminho é livre de licença SAP.

### 10.5 Ações antes do GA do conector SAP

- [ ] Validar com SAP Brasil cláusulas de redistribuição em acordo OEM
- [ ] Cotar JCo OEM (faixa de preço, mínimos, lead time)
- [ ] Definir, contratualmente, quem custeia JCo do cliente (incluído no
      onboarding ou pago à parte)
- [ ] Documentar em `docs/legal/` cláusula sobre dependência de SAP JCo

---

## 11. Onboarding técnico (serviço pago)

| Item                                             | Valor     |
| ------------------------------------------------ | --------- |
| Discovery + análise de Communication Arrangement | R$ 25.000 |
| Mapping inicial                                  | R$ 30.000 |
| Configuração SAP CPI (se aplicável)              | R$ 40.000 |
| Treinamento técnico cliente (16h)                | R$ 12.000 |
| Setup fee módulo                                 | R$ 25.000 |

**Total típico Enterprise**: R$ 100k–R$ 150k em onboarding.

---

## 12. Aprovação

- [ ] Tech Lead
- [ ] Analista ERP
- [ ] SAP Partner (consultoria certificada)
- [ ] Cliente piloto
- [ ] PM
- [ ] Diretoria comercial
- [ ] Certificação SAP (para Cloud Marketplace)
