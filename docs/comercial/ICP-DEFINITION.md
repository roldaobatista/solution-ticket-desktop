# ICP — Ideal Customer Profile (Modulo Integracao ERP)

> Documento vivo. Revisao trimestral pelo Steering Committee.
> Referencias: PLANO-MODULO-INTEGRACAO.md, CASH-FLOW-MODEL.md, RICE-PRIORITIZATION.md

## 1. ICP Primario

Empresas brasileiras de medio porte, com operacao critica de pesagem veicular e ERP fiscal nao-customizado.

### Criterios duros (todos obrigatorios)

- **Porte**: 50-500 funcionarios.
- **Faturamento**: R$ 50M-R$ 500M/ano.
- **Vertical**: Agronegocio, Mineracao, Construcao Civil (areia/brita/concreto), Residuos Solidos, Cooperativas.
- **Infra fisica**: >=3 balancas veiculares (1 producao + 2 backup/filial).
- **Volume**: >=1.000 pesagens/mes.
- **ERP**: Bling, Omie, Conta Azul, Sankhya, Protheus (TOTVS), SAP Business One. Nao serve ERP custom proprietario.

### Criterios qualitativos

- Operacao 24/7 ou janelas criticas onde queda de balanca = perda direta.
- Setor regulado (Receita Federal, ANTT, IBAMA) com auditorias frequentes.
- Empresa familiar profissionalizada OU subsidiaria de grupo medio.

## 2. Anti-ICP (NAO vender)

| Perfil                                     | Razao                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| <50 funcionarios                           | Ticket nao paga CAC; suporte > margem.                                    |
| >500 funcionarios enterprise               | Ciclo de venda >12m; squad atual nao aguenta.                             |
| 1 balanca apenas                           | Sem dor de reconciliacao multi-ponto.                                     |
| ERP custom proprietario                    | Cada conector vira projeto unico — sem oportunidade de produto repetivel. |
| Empresa em recuperacao judicial            | Risco de inadimplencia.                                                   |
| Setor sem fiscalizacao (ex. interno-grupo) | Dor fiscal nao existe.                                                    |

## 3. Sinais de Qualificacao MQL -> SQL

Lead vira SQL quando >=2 destes sinais sao confirmados em conversa de descoberta:

1. **Dor fiscal declarada**: divergencia recorrente entre nota fiscal e ticket de pesagem.
2. **Auditoria fiscal aberta** nos ultimos 12 meses (Receita, ICMS, ITR).
3. **Contador externo reclamando** de retrabalho ou achado.
4. **Tempo manual**: >5h/mes de reconciliacao planilha vs ERP.
5. **Sancao recente** (multa ANTT, autuacao IBAMA, glosa de cliente).
6. **Crescimento**: nova balanca/filial planejada nos proximos 6m.

Sem >=2 sinais: lead vira nurturing (newsletter trimestral), nao SQL.

## 4. Personas

### Diretor de Operacoes (decisor tecnico)

- Idade 35-55, formacao engenharia/agronomia.
- Dor: parada de balanca = caminhao parado = penalidade contratual.
- Compra por: confiabilidade, suporte 24/7, simplicidade no chao de fabrica.
- Canal: indicacao por par, evento setorial, demo presencial.

### CFO / Controller (decisor financeiro)

- Idade 40-60, formacao contabeis/admin.
- Dor: glosa fiscal, multa Receita, retrabalho do contador.
- Compra por: ROI demonstravel, reducao de risco fiscal, audit trail.
- Canal: case study, calculadora ROI, conversa com par CFO.

### Diretor Fiscal / Compliance (decisor compliance — em empresas >R$ 200M)

- Idade 35-55, formacao direito/contabeis com OAB ou CRC.
- Dor: SPED inconsistente, NFe rejeitada, autuacao.
- Compra por: rastreabilidade, conformidade Receita Federal, certificacao.
- Canal: webinar tecnico, white paper regulatorio, advogado tributarista.

## 5. TAM / SAM / SOM (Brasil)

| Camada        | Definicao                                                       | Volume estimado          |
| ------------- | --------------------------------------------------------------- | ------------------------ |
| **TAM**       | Empresas BR com balanca veicular critica (Sebrae + ABNT + ANTT) | ~50.000 empresas         |
| **SAM**       | TAM filtrado por porte 50-500 + ERP medio + >=3 balancas        | 3.000-5.000 empresas     |
| **SOM (18m)** | 1-3% do SAM com squad/canal atual                               | 30-150 clientes pagantes |

Premissas:

- TAM via cruzamento Sebrae (industria de transformacao) + bases de aferimento INMETRO.
- SAM derivado de share TOTVS/Bling/Omie no segmento medio (~60% combinado).
- SOM conservador dado capacidade comercial de 1 squad (4 vendedores Fase 2).

## 6. Casos de Uso por Vertical

### Agronegocio (cooperativas, tradings de graos)

- Recebimento de soja com classificacao + ticket + NFe entrada automatica.
- Saida de farelo com integracao ERP TOTVS Agro + romaneio digital.
- Conciliacao mensal com produtor rural + Livro Caixa Digital.

### Mineracao (areia, brita, minerio nao-metalico)

- Pesagem de carregamento + emissao MDFe + NFe + ANM royalties.
- Reconciliacao ICMS-ST com ERP Protheus.
- Auditoria de tonelagem extraida vs licenca ambiental IBAMA.

### Residuos Solidos (gestao ambiental, MTR/CTR)

- Pesagem de residuo recebido + MTR (Manifesto Transporte Residuos) IBAMA.
- Geracao de CDF (Certificado Destinacao Final) integrado ao ERP.
- Faturamento por tonelagem + NFSe servico ambiental.

## 7. Atualizacao deste Documento

- Trimestral (PM + Comercial + CFO).
- Insumos: DISCOVERY-LOG.md, dados CRM, taxa de conversao por vertical.
- Mudanca de ICP que afete pricing requer aprovacao Steering.
