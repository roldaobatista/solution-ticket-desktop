# Plano de Execução — Solution Ticket

## App Desktop Windows — Clone do PesoLog + Melhorias

**Data:** 2026-04-24  
**Produto:** Solution Ticket  
**Estratégia:** Replicar 100% o PesoLog no MVP (tudo que ele faz), depois aplicar melhorias por cima.

---

## 1. Estratégia

O PesoLog é um produto maduro e funcional. Reinventar dá errado. O caminho é:

1. **MVP — Clone funcional completo do PesoLog** (banco, telas, fluxos, protocolos de balança, templates, permissões)
2. **Fase 2 — Melhorias técnicas e comerciais** por cima do MVP

Tudo que o PesoLog tem, o Solution Ticket terá. Nada a menos. O que vier adicional é diferencial de venda.

---

## 2. Mapeamento Completo do PesoLog

### 2.1 Banco de Dados (30 tabelas — Access/MDB)

| Tabela                 | Função                                      | Colunas |
| ---------------------- | ------------------------------------------- | ------- |
| **tpesagens**          | Pesagens (registro principal)               | 80      |
| **tpermissoes**        | Permissões P1–P100 por usuário              | 102     |
| **tequipamentos**      | Balanças (config serial/TCP)                | 22      |
| **tfaturas**           | Faturas                                     | 24      |
| **tveiculos**          | Veículos                                    | 18      |
| **tindicadores**       | Modelos de indicador pré-configurados       | 15      |
| **tclientes**          | Clientes                                    | 14      |
| **tmotoristas**        | Motoristas                                  | 14      |
| **tdescontospesagem**  | Descontos aplicados em pesagem              | 14      |
| **ttipodescontos**     | Tipos de desconto com visibilidade por tela | 14      |
| **ttransportadoras**   | Transportadoras                             | 11      |
| **tempresas**          | Empresa operadora                           | 11      |
| **tpagamentosfatura**  | Pagamentos de faturas                       | 10      |
| **tdocumentospesagem** | Documentos fiscais (NF-e, NF)               | 10      |
| **tpesagenshistorico** | Auditoria de alterações de pesagem          | 10      |
| **tpagamentosfatura**  | Pagamentos                                  | 10      |
| **tpesagensafaturar**  | Pesagens pendentes de faturamento           | 9       |
| **tarmazens**          | Armazéns                                    | 8       |
| **trecibos**           | Recibos                                     | 11      |
| **tsaldosfinanceiro**  | Saldos financeiros por cliente              | 8       |
| **tusuarios**          | Usuários                                    | 8       |
| **tprodutos**          | Produtos                                    | 7       |
| **tprecoprodutos**     | Tabela de preços (com preço por cliente)    | 7       |
| **tfreteprodutos**     | Tabela de frete por produto                 | 5       |
| **tumidades**          | Tabela de umidade por produto               | 5       |
| **trelatorios**        | Filtros salvos de relatório                 | 12      |
| **ttipofaturas**       | Tipos de fatura                             | 4       |
| **tunidades**          | Unidades de medida (TON, KG, M3, SACAS, LT) | 4       |
| **tformaspagamento**   | Formas de pagamento                         | 4       |
| **tdestinos**          | Destinos por cliente                        | 4       |
| **ttipoveiculos**      | Tipos de veículo com preço de pesagem       | 3       |

### 2.2 Telas Identificadas (via binário Delphi)

| Unit                      | Tela                                              |
| ------------------------- | ------------------------------------------------- |
| **ULogin**                | Login                                             |
| **UDashBoard**            | Dashboard / KPIs                                  |
| **UPesagemEntrada**       | Pesagem de entrada                                |
| **UPesagemSaida**         | Pesagem de saída                                  |
| **UManutencao**           | Manutenção de tickets (edição pós-fechamento)     |
| **URelatorios**           | Relatórios (Movimentação / Alteradas / Excluídas) |
| **UConfiguracoes**        | Configurações gerais                              |
| **UConfBancoDados**       | Configuração de banco de dados                    |
| **UFinanceiro**           | Módulo financeiro (faturas / pagamentos / saldos) |
| **UCancelFatura**         | Cancelar fatura                                   |
| **UAjustePreco**          | Ajuste de preço                                   |
| **UCalibracao**           | Calibração de balança                             |
| **UImpressaoTicket**      | Impressão de ticket                               |
| **UErrosTicket**          | Tratamento de erros de ticket                     |
| **UDiagMessage**          | Diagnóstico                                       |
| **UImagem**               | Gestão de imagens                                 |
| **UCadArmazens**          | Cadastro de armazéns                              |
| **UCadClientes**          | Cadastro de clientes                              |
| **UCadEmpresas**          | Cadastro de empresas                              |
| **UCadMotoristas**        | Cadastro de motoristas                            |
| **UCadProdutos**          | Cadastro de produtos                              |
| **UCadTipoVeiculos**      | Cadastro de tipo de veículos                      |
| **UCadTransportadoras**   | Cadastro de transportadoras                       |
| **UCadUnidades**          | Cadastro de unidades                              |
| **UCadUsuarios**          | Cadastro de usuários                              |
| **UCadVeiculos**          | Cadastro de veículos                              |
| **UListaArmazens**        | Busca/listagem armazéns                           |
| **UListaClientes**        | Busca/listagem clientes                           |
| **UListaMotoristas**      | Busca/listagem motoristas                         |
| **UListaProdutos**        | Busca/listagem produtos                           |
| **UListaPSaida**          | Busca pesagens pendentes (saída)                  |
| **UListaTransportadoras** | Busca/listagem transportadoras                    |
| **UListaUsuarios**        | Busca/listagem usuários                           |
| **UListaVeiculos**        | Busca/listagem veículos                           |

### 2.3 Indicadores de Balança Pré-Configurados (12 modelos)

| Fabricante | Modelo         | Baud | Tamanho | Início | Marcador |
| ---------- | -------------- | ---- | ------- | ------ | -------- |
| ALFA       | 3102           | 9600 | 6       | 5      | CR (13)  |
| WEIGHTECH  | WT1000 LED A12 | 4800 | 5       | 4      | CR       |
| WEIGHTECH  | WT3000 I       | 9600 | 6       | 9      | LF (10)  |
| WEIGHTECH  | WT genérico    | 9600 | 6       | 8      | CR       |
| JUNDIAI    | BJ-850         | 9600 | 6       | 10     | `:` (58) |
| MASTERTEC  | MASTERPRO      | 4800 | 6       | 1      | CR       |
| SATURNO    | com indicador  | 4800 | 6       | 1      | CR       |
| SATURNO    | sem indicador  | 4800 | 6       | 1      | CR       |
| TOLEDO     | 9091 P03       | 9600 | 6       | 6      | CR       |
| DIGITRON   | 6 dígitos      | 9600 | 6       | 2      | CR       |
| DIGITRON   | 5 dígitos      | 9600 | 5       | 2      | CR       |
| MULLER     | CRM 80000      | 1200 | 6       | 2      | CR       |

Todos com: databits=8, stopbits=1, parity=None, flowControl=None, fator configurável.

Também suporta: conexão serial (portaSerial COM1–COM99) **e** TCP/IP (ip + portaIP).

### 2.4 Templates de Ticket (FastReport .fr3)

- **TICKET001** — A5 1PF (1 pesagem referenciada)
- **TICKET002** — A4 2PF (bruto/tara) — 6 variações (padrão, Dif. Nota, Valor, Inteiro, Sem Desconto)
- **TICKET003** — A4 3PF (com passagem de controle)
- **TICKET004** — CUPOM (6 variações: padrão, com desconto, Gertec, resumido, produtor, sem assinatura, Generic Text)
- **TICKET005A/B/C** — A4 com Descontos (valor e tabela umidade)
- **TICKET010** — CUPOM Generic Text (impressora matricial)

### 2.5 Relatórios

- RelMovimentacao (3 variações: original, com motorista, com 2 decimais)
- RelPesagensAlteradas
- RelPesagensExcluidas

### 2.6 Dados Pré-Cadastrados

**Tipos de Fatura (6):**  
ADIANTAMENTO VENDA, ADIANTAMENTO COMPRA, FATURA DE VENDA, FATURA DE COMPRA, RECEITA, DESPESA

**Formas de Pagamento (8):**  
DINHEIRO, CARTÃO DÉBITO, CARTÃO CRÉDITO, CHEQUE, TRANSF. BANCÁRIA, BOLETO, CRIAÇÃO DE SALDO (exclusivo), RESGATE DE SALDO ANTERIOR (exclusivo)

**Unidades de Medida (5):**  
TON (Toneladas), M3 (Metro Cúbico), KG (Quilos), SACAS, LT (Litros)

### 2.7 Configuração do Sistema (Configuracao.ini)

Feature flags do PesoLog (SIM/NAO):

- PESAGEM_COM_TARA, PESAGEM_ENTRADA, PESAGEM_SAIDA
- FINANCEIRO, CAMERAS, MANUTENCAO_TICKET
- TRANSPORTADORA, MOTORISTA, ARMAZEM
- CONVERSAO_UNIDADE, PRECO_VENDA, BILHETAGEM, ORIGEM_DESTINO
- CALCULO_FRETE, TABELA_UMIDADE, DESCONTOS
- EMISSAO_ROMANEIO, EDICAO_ROMANEIO, HABILITA_BAIXA, LISTA_DOCUMENTOS
- Impressão: PREVIEW, NR_COPIAS, MANTEM_ABERTA, MODELO_TICKET, LOGOMARCA, LOGORELATORIOS
- Campos adicionais, observação, rodapé, tara cadastrada

### 2.8 Trial / Licenciamento

- 15 dias de demonstração OU 100 pesagens (o que terminar primeiro)
- Após trial: requer chave de licença
- Toda operação é local (SQLite/MDB na pasta)

---

## 3. Arquitetura Alvo

```
Instalador Windows (.exe) - "Solution Ticket Setup.exe"
└── Electron (janela principal)
    ├── NestJS API (127.0.0.1:3001)
    │   ├── Módulo de balança (serial + TCP) com 12+ protocolos
    │   ├── 30 tabelas SQLite (Prisma)
    │   ├── 100 permissões granulares
    │   ├── Sistema de licença RSA local
    │   └── Impressão FastReport → PDF
    └── Frontend React (SPA estático)
        └── 34 telas (todas do PesoLog)
```

### Princípios

- Offline-first, auto-contido, sem servidor externo
- SQLite em `%APPDATA%\SolutionTicket\data.db`
- Porta local 127.0.0.1:3001 (não exposta na rede)
- Suporte a serial (RS-232/485) e Ethernet (TCP/IP) para balança

---

## 4. Planos Comerciais

|                       | **Padrão**             | **Pro**                |
| --------------------- | ---------------------- | ---------------------- |
| Preço (vitalício)     | R$ 4.500               | R$ 6.800               |
| Suporte anual         | R$ 2.000/ano           | R$ 4.000/ano           |
| Máquinas por licença  | 1                      | Até 3                  |
| Balanças simultâneas  | 1                      | Múltiplas              |
| Unidades operacionais | 1                      | Até 3                  |
| Pesagens              | Ilimitadas             | Ilimitadas             |
| Relatórios avançados  | —                      | Sim                    |
| Trial                 | 15 dias / 100 pesagens | 15 dias / 100 pesagens |

---

## 5. MVP — Clone Funcional do PesoLog

### ETAPA 1 — Consolidação e Setup

**Esforço:** 1–2 dias

- Escolher entre as 4 versões atuais a mais completa
- Limpar pasta, remover Docker, monorepo pnpm com: `backend/`, `frontend/`, `electron/`, `keygen/`
- Rodar em modo dev (backend + frontend separados)

### ETAPA 2 — Modelar Banco Idêntico ao PesoLog

**Esforço:** 2 dias

- Schema Prisma SQLite replicando as 30 tabelas do PesoLog
- Mesmos nomes de tabela e coluna (para compatibilidade / migração futura)
- Seed inicial com:
  - 12 indicadores de balança pré-configurados (ALFA, WEIGHTECH, JUNDIAI, MASTERTEC, SATURNO, TOLEDO, DIGITRON, MULLER)
  - 6 tipos de fatura
  - 8 formas de pagamento
  - 5 unidades de medida
  - 1 empresa demo, 1 unidade, 1 usuário admin com todas permissões

### ETAPA 3 — Backend NestJS (todos os módulos)

**Esforço:** 5–7 dias

Módulos a implementar (replicando PesoLog):

| Módulo              | Endpoints principais                                        |
| ------------------- | ----------------------------------------------------------- |
| **Auth**            | login / logout / permissões P1–P100                         |
| **Empresas**        | CRUD tempresas                                              |
| **Unidades**        | CRUD tunidades                                              |
| **Usuários**        | CRUD tusuarios + tpermissoes                                |
| **Clientes**        | CRUD tclientes + tdestinos                                  |
| **Motoristas**      | CRUD tmotoristas (com bloqueio)                             |
| **Transportadoras** | CRUD ttransportadoras                                       |
| **Veículos**        | CRUD tveiculos (com tara cadastrada, tipo, bloqueio)        |
| **TipoVeículos**    | CRUD ttipoVeiculos (com precoPesagem)                       |
| **Produtos**        | CRUD tprodutos (com densidade, unidade, fracionado)         |
| **Armazéns**        | CRUD tarmazens (com capacidade, limites, saldo)             |
| **Indicadores**     | CRUD tindicadores (modelos de balança)                      |
| **Balanças**        | CRUD tequipamentos (serial/TCP) + leitura peso + calibração |
| **Pesagens**        | Entrada, saída, cálculo, histórico, exclusão com motivo     |
| **Manutenção**      | Editar pesagem pós-fechamento com auditoria                 |
| **Descontos**       | Tipos + aplicação em pesagem com visibilidade por tela      |
| **Umidade**         | Tabela de umidade por produto                               |
| **Preços**          | Tabela de preço geral e por cliente                         |
| **Frete**           | Tabela de frete por produto                                 |
| **Faturas**         | CRUD tfaturas + pagamentos + baixa + cancelamento           |
| **Saldos**          | Saldo financeiro por cliente                                |
| **Recibos**         | Emissão de recibos                                          |
| **Documentos**      | NF-e e NF vinculados a pesagem                              |
| **Relatórios**      | Movimentação, Alteradas, Excluídas                          |
| **Dashboard**       | KPIs                                                        |
| **Licença**         | Trial + ativação                                            |
| **Configurações**   | Feature flags do Configuracao.ini                           |
| **Backup**          | Backup e restore do SQLite                                  |

### ETAPA 4 — Módulo de Balança (serial + TCP)

**Esforço:** 4–5 dias

Replicar a lógica do PesoLog:

- `serialport` para RS-232/RS-485 (COM1–COM99)
- `net` (Node nativo) para TCP/IP
- Parser configurável via `tindicadores`: `inicioPeso`, `tamanhoPeso`, `tamanhoString`, `marcador`, `fator`, `invertePeso`
- 12 modelos pré-configurados funcionando de saída
- Leitura contínua com estabilidade
- Calibração (tela UCalibracao)
- Status: online / offline / erro
- Suporte a "peso manual" quando balança offline

### ETAPA 5 — Frontend React (todas as 34 telas)

**Esforço:** 7–10 dias

Dividido em grupos:

**Grupo A — Autenticação e base (1 dia)**

- Login, Dashboard, layout principal com menus idênticos ao PesoLog (Cadastros, Relatórios, Manutenção, Configurações)

**Grupo B — Cadastros (2–3 dias)**

- 10 telas de cadastro (mesma estrutura: form + lista de busca)

**Grupo C — Pesagem (2 dias)**

- Pesagem Entrada (UPesagemEntrada): form completo igual PesoLog
- Pesagem Saída (UPesagemSaida)
- Impressão de ticket (UImpressaoTicket)
- Calibração (UCalibracao)

**Grupo D — Financeiro (2 dias)**

- Financeiro (UFinanceiro)
- Cancelar fatura (UCancelFatura)
- Ajuste de preço (UAjustePreco)
- Lista pesagens a faturar (UListaPSaida)

**Grupo E — Operação e utilitários (1–2 dias)**

- Manutenção (UManutencao)
- Relatórios (URelatorios) — Movimentação, Alteradas, Excluídas
- Configurações (UConfiguracoes)
- Configuração banco (UConfBancoDados)
- Diagnóstico (UDiagMessage)
- Erros ticket (UErrosTicket)
- Gestão imagem (UImagem)

### ETAPA 6 — Impressão de Tickets

**Esforço:** 2–3 dias

Replicar os 10+ templates do PesoLog:

- TICKET001 (1PF A5)
- TICKET002 (2PF A4 — 6 variações)
- TICKET003 (3PF A4)
- TICKET004 (CUPOM — 6 variações)
- TICKET005 (A4 com descontos)
- TICKET010 (CUPOM matricial)

Usar biblioteca tipo `pdfkit` ou `puppeteer` para gerar PDF que replica FastReport.  
Templates configuráveis pelo usuário (escolhido em `Configuracao.ini` → `MODELO_TICKET`).

### ETAPA 7 — Electron Wrapper

**Esforço:** 2 dias

- Main process inicia NestJS como processo filho
- Splash screen enquanto backend sobe
- Carrega frontend na BrowserWindow
- Menu nativo Windows
- Ícone customizado

### ETAPA 8 — Instalador Windows

**Esforço:** 1–2 dias

- electron-builder + NSIS
- Inclui binários nativos (`serialport`, Prisma engine Windows)
- Arquivo `Solution Ticket Setup 1.0.0.exe`
- Wizard de primeiro acesso (empresa, unidade, admin)

### ETAPA 9 — Testes de Aceitação

**Esforço:** 2–3 dias

- Testar com balança real (serial e TCP)
- Testar cada uma das 34 telas
- Validar cálculo de pesagem (1PF, 2PF, 3PF)
- Validar cálculo de frete, descontos, umidade
- Validar impressão de todos os templates
- Rodar 100 pesagens de teste

**Total MVP: 26–37 dias**

---

## 6. Fase 2 — Melhorias sobre o MVP

Aplicadas somente depois do MVP funcionando completo.

### Melhoria 1 — Sistema de Licença RSA

**Esforço:** 2 dias

O licenciamento do PesoLog é simples e quebrável. Substituir por:

- Fingerprint de hardware real (MAC + hostname + serial volume C:)
- Chave JWT assinada com RSA-2048 (chave pública embutida, privada só com você)
- Validação offline
- Padrão: 1 máquina / Pro: até 3 máquinas por chave
- Ferramenta keygen separada para geração

### Melhoria 2 — Auto-update

**Esforço:** 1 dia

- electron-updater configurado com GitHub Releases
- App verifica versão ao abrir
- Download em segundo plano + prompt para reiniciar

### Melhoria 3 — UI Moderna

**Esforço:** 3–4 dias

PesoLog tem UI Delphi clássica (funcional mas datada). Aplicar:

- Design system com Tailwind + shadcn/ui (já no stack)
- Componentes responsivos
- Atalhos de teclado padronizados
- Dark mode opcional
- Acessibilidade

### Melhoria 4 — Banco SQLite em vez de Access

**Esforço:** já incluído no MVP

Vantagens sobre o MDB do PesoLog:

- Não precisa do Access Database Engine instalado
- Melhor integridade transacional
- Backup via cópia de arquivo único
- Concorrência segura
- Prisma ORM para manutenção fácil

### Melhoria 5 — Dashboard Avançado

**Esforço:** 2 dias

Além dos KPIs do PesoLog:

- Gráficos temporais (pesagens por hora/dia/mês)
- Top clientes, produtos, motoristas
- Análise de eficiência da balança
- Alertas configuráveis

### Melhoria 6 — Relatórios em Excel

**Esforço:** 1 dia

PesoLog exporta só PDF. Adicionar:

- Exportação para XLSX
- Exportação para CSV
- Filtros avançados

### Melhoria 7 — Backup automático

**Esforço:** 1 dia

- Backup automático diário do SQLite
- Restauração com 1 clique
- Retenção configurável (ex: últimos 30 backups)
- Opcional: backup para pasta de rede ou pen drive

### Melhoria 8 — API REST aberta (Pro)

**Esforço:** 2 dias

Expor endpoints REST para integração com:

- Sistemas ERP do cliente
- Scripts de automação
- Consultas externas

### Melhoria 9 — Logs estruturados e telemetria local

**Esforço:** 1 dia

- Logs rotativos em `%APPDATA%\SolutionTicket\logs\`
- Tela de diagnóstico melhorada (UDiagMessage)
- Exportação de log para suporte

**Total Fase 2: 13–16 dias**

---

## 7. Cronograma Consolidado

| Fase                    | Duração    | Entregável                              |
| ----------------------- | ---------- | --------------------------------------- |
| **MVP — Clone PesoLog** | 26–37 dias | Solution Ticket 1.0 instalador completo |
| **Fase 2 — Melhorias**  | 13–16 dias | Solution Ticket 2.0                     |
| **Total**               | 39–53 dias | —                                       |

---

## 8. Stack Final

| Componente      | Tecnologia                         |
| --------------- | ---------------------------------- |
| Desktop wrapper | Electron 30.x                      |
| Empacotador     | electron-builder 24.x              |
| Auto-update     | electron-updater + GitHub Releases |
| Backend         | NestJS 10 + TypeScript             |
| ORM + Banco     | Prisma 5 + SQLite                  |
| Hardware serial | serialport 12                      |
| Hardware TCP    | net (Node nativo)                  |
| Frontend        | React 18 + Vite 5                  |
| UI              | Tailwind + shadcn/ui               |
| Licença         | JWT + RSA-2048 (Fase 2)            |
| Impressão       | pdfkit ou puppeteer                |
| Instalador      | NSIS via electron-builder          |

---

## 9. Checklist de Paridade com PesoLog (MVP Done)

### Cadastros (10)

- [ ] Armazéns
- [ ] Clientes (+ destinos por cliente)
- [ ] Empresas
- [ ] Motoristas (com bloqueio)
- [ ] Produtos (com densidade, unidade, fracionado)
- [ ] Tipo de Veículos (com preço de pesagem)
- [ ] Transportadoras
- [ ] Unidades (operacionais)
- [ ] Usuários (com 100 permissões)
- [ ] Veículos (com tara, dimensões)

### Operação (5)

- [ ] Pesagem de Entrada
- [ ] Pesagem de Saída
- [ ] Manutenção de Ticket
- [ ] Cancelamento de Pesagem
- [ ] Calibração de Balança

### Hardware (suportar 12 modelos)

- [ ] ALFA 3102
- [ ] WEIGHTECH WT1000 LED
- [ ] WEIGHTECH WT3000 I
- [ ] WEIGHTECH WT genérico
- [ ] JUNDIAI BJ-850
- [ ] MASTERTEC MASTERPRO
- [ ] SATURNO (com e sem indicador)
- [ ] TOLEDO 9091 P03
- [ ] DIGITRON (5 e 6 dígitos)
- [ ] MULLER CRM 80000
- [ ] Genérico configurável
- [ ] Serial + TCP/IP

### Financeiro (5)

- [ ] Faturas (6 tipos: Adiantamento Venda/Compra, Fatura Venda/Compra, Receita, Despesa)
- [ ] Pagamentos (8 formas: Dinheiro, Cartões, Cheque, Transf, Boleto, Saldos)
- [ ] Cancelar Fatura
- [ ] Ajuste de Preço
- [ ] Saldo Financeiro por Cliente

### Comercial

- [ ] Tabela de preços (por cliente)
- [ ] Tabela de frete por produto
- [ ] Tabela de umidade
- [ ] Descontos (tipos + aplicação)

### Relatórios (3)

- [ ] Movimentação
- [ ] Pesagens Alteradas
- [ ] Pesagens Excluídas

### Impressão (10+ templates)

- [ ] TICKET001 A5 1PF
- [ ] TICKET002 A4 2PF (6 variações)
- [ ] TICKET003 A4 3PF
- [ ] TICKET004 CUPOM (6 variações)
- [ ] TICKET005 A4 com Descontos
- [ ] TICKET010 Matricial

### Sistema

- [ ] Login + 100 permissões
- [ ] Dashboard com KPIs
- [ ] Configurações (feature flags)
- [ ] Trial 15 dias / 100 pesagens
- [ ] Backup/restore do banco
- [ ] Auditoria (histórico de alterações)
- [ ] Multi-unidade

---

## 10. Decisões Fechadas

- ✅ Nome: Solution Ticket
- ✅ Ícone: caminhão em cima de balança (a desenhar)
- ✅ Planos: Padrão R$ 4.500 / Pro R$ 6.800
- ✅ Suporte anual: R$ 2.000–4.000/ano
- ✅ Licença vitalícia
- ✅ Auto-update habilitado (Fase 2)
- ✅ Até 3 máquinas por licença Pro
- ✅ Hardware: obrigatório desde o MVP — todos protocolos que o PesoLog já suporta
- ✅ Suporte: WhatsApp + e-mail
- ✅ MVP = clone funcional completo do PesoLog
- ✅ Banco SQLite (moderniza o MDB do PesoLog mantendo mesma estrutura)
