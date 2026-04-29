# Auditoria Comparativa — PesoLog vs Solution Ticket

Data: 2026-04-24
Fontes: `C:\PesoLog\` (db*detail.json, db_schema.txt, Configuracao.ini, screenshots `nav*_.png`, templates `.fr3`, ui_forms.txt) e `C:\PROJETOS\Plataforma de Pesagem Veicular\solution-ticket-desktop\` (schema.prisma com 37 models, frontend `(authenticated)/_`, backend modules).

Convenções de tag de gap: `[CAMPO]`, `[TELA]`, `[FLUXO]`, `[RELATORIO]`, `[CONFIG]`, `[HARDWARE]`, `[VERIFICAR]`.

---

## 1. Resumo executivo

**Paridade estimada: ~72%**

O Solution Ticket já cobre todos os módulos estruturais do PesoLog (pesagem entrada/saída, cadastros completos, financeiro, romaneio, fatura, manutenção, configuração, relatórios, licenciamento) e possui superioridade arquitetural evidente: multi-tenant, matriz de regras operacionais, snapshot comercial versionado, licenciamento RSA com fingerprint, auditoria transversal e schema comercial mais rico (TabelaPrecoProdutoCliente, TabelaFrete por faixa, vigências).

Porém, em **fidelidade de detalhe comercial de ticket/impressão/documentos fiscais**, e em **integração a hardware real**, o PesoLog — por ser sistema legado de produção — tem refinamentos que ainda não foram portados.

### 5 maiores gaps

1. **Impressão FastReport / pacote de 24 templates `.fr3`** — só existe `impressao.service.ts` genérico; não há port dos 14 layouts de ticket A4/A5/cupom nem 4 relatórios de movimentação. `[RELATORIO][HARDWARE]`
2. **Integração real com 12 indicadores de pesagem** — parsers criados no schema (campos parser_tipo, baudrate...) mas adapters concretos para ALFA 3102, WEIGHTECH WT1000/WT3000, JUNDIAI BJ-850, MASTERTEC MASTERPRO, SATURNO c/s indicador, TOLEDO 9091 P03, DIGITRON 5/6 dígitos, MULLER CRM 80000 requerem validação contra balança real. `[HARDWARE][VERIFICAR]`
3. **Documentos fiscais (NFe/CTe) de pesagem** — tabela `tdocumentospesagem` do PesoLog suporta múltiplos documentos por ticket; no Solution Ticket existe `DocumentoPesagem` porém sem lista dedicada (feature flag `LISTA_DOCUMENTOS`) nem tela de vinculação múltipla. `[TELA][FLUXO]`
4. **Recibos financeiros** — PesoLog possui tabela `trecibos` e fluxo de emissão; Solution Ticket não tem model `Recibo` nem controller. `[TELA][FLUXO]`
5. **Câmeras / captura de imagem no ato da pesagem** — PesoLog tem `UImagem` e feature `CAMERAS=SIM` (captura foto da carreta na passagem); Solution Ticket tem campo `cameras` no ConfiguracaoOperacionalUnidade mas não há serviço de captura, armazenamento nem anexo a passagem. `[TELA][HARDWARE]`

---

## 2. Comparação por módulo

### 2.1 Autenticação e Usuários

Fontes PesoLog: `ULogin`, `UCadUsuarios`, `UListaUsuarios`, `tusuarios`, `tpermissoes`.

| Funcionalidade PesoLog                          | Solution Ticket tem? | Gap/observação                                                                                                  |
| ----------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Login usuário/senha local                       | SIM                  | `backend/src/auth`, JWT                                                                                         |
| Cadastro de usuário (nome, login, senha, ativo) | SIM                  | Model `Usuario` + `/cadastros/usuarios`                                                                         |
| Lista de usuários com busca/filtro              | SIM                  | Frontend `cadastros/usuarios`                                                                                   |
| Permissões por módulo/ação                      | SIM                  | Model `Permissao` + `UsuarioPerfil` (PesoLog tem apenas flat `tpermissoes`; nosso design com Perfil é superior) |
| Bloqueio por tentativas de login                | SIM (superior)       | `tentativasLogin`, `bloqueadoAte` — PesoLog não tem                                                             |
| Último acesso                                   | SIM                  | `ultimoAcesso`                                                                                                  |
| Troca de senha                                  | [VERIFICAR]          | Conferir endpoint dedicado                                                                                      |

### 2.2 Dashboard

| Funcionalidade PesoLog                      | Solution Ticket tem? | Gap/observação                                                           |
| ------------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| `UDashBoard` principal pós-login            | SIM                  | Frontend tem `(authenticated)/page.tsx` e módulo `backend/src/dashboard` |
| Totalizadores dia/mês (pesagens, toneladas) | [VERIFICAR]          | Conferir endpoints de dashboard                                          |
| Atalhos grandes para Entrada/Saída          | SIM                  | `nav_01_main.png` mostra padrão; nosso tem equivalente                   |
| Ticker/últimas pesagens                     | [VERIFICAR]          | Não confirmado no Solution Ticket                                        |

### 2.3 Pesagem de Entrada (UPesagemEntrada)

Screenshot de referência: `nav_02_pesagem_entrada.png`.

| Funcionalidade PesoLog                                         | Solution Ticket tem? | Gap/observação                                                                    |
| -------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| Tela dedicada de entrada                                       | SIM                  | `pesagem/entrada/`                                                                |
| Captura peso em tempo real da balança                          | PARCIAL              | `balanca-realtime.service.ts` existe; depende de adapter físico `[HARDWARE]`      |
| Seleção de indicador/balança                                   | SIM                  | `indicadorPesagemId`, `balancaId` na passagem                                     |
| Cliente + Produto + Transportadora + Motorista + Veículo       | SIM                  | Todos os FKs existem em `TicketPesagem`                                           |
| Tara cadastrada vs capturada (`taraReferenciaTipo`)            | SIM (superior)       | Solution Ticket distingue tara_snapshot, PesoLog usa flag `MANTEM_TARACADASTRADA` |
| Origem/Destino condicional (feature `ORIGEM_DESTINO`)          | SIM                  | `origemId`, `destinoId` + config `origem_destino`                                 |
| Armazém de destino (feature `ARMAZEM`)                         | SIM                  | `armazemId` + `armazem_habilitado`                                                |
| Nota Fiscal + Peso NF                                          | SIM                  | `notaFiscal`, `pesoNf`                                                            |
| Observação + 2 campos adicionais livres                        | SIM                  | `observacao`, `campo1`, `campo2`, `payloadCamposAdicionais`                       |
| Indicador de estabilidade                                      | SIM                  | `indicadorEstabilidade` na `PassagemPesagem`                                      |
| Captura de imagem pela câmera                                  | NAO                  | `[TELA][HARDWARE]` — gap crítico #5                                               |
| Bilhetagem (impressão automática de comprovante intermediário) | [VERIFICAR]          | Flag `BILHETAGEM` existe como config, falta fluxo de impressão                    |
| Label dos adicionais configurável                              | SIM                  | `labelAdicional1`, `labelAdicional2`                                              |
| Rodapé customizável                                            | SIM                  | `rodapeTexto`                                                                     |

### 2.4 Pesagem de Saída (UPesagemSaida, UListaPSaida)

| Funcionalidade PesoLog                       | Solution Ticket tem? | Gap/observação                                                                      |
| -------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| Tela de saída (buscar ticket aberto)         | SIM                  | `pesagem/saida/`                                                                    |
| Lista de pesagens em aberto (`UListaPSaida`) | SIM                  | Filtro por `statusOperacional`                                                      |
| Cálculo automático de líquido na 2ª passagem | SIM                  | `pesoBrutoApurado`, `pesoTaraApurada`, `pesoLiquidoSemDesconto`, `pesoLiquidoFinal` |
| Edição de dados antes de fechar              | SIM                  | Via manutenção                                                                      |
| Mais de 2 passagens (3PF, múltiplas)         | SIM                  | `totalPassagensPrevistas` (ticket003 suporta 3PF)                                   |

### 2.5 Tickets e Passagens (tpesagens, tpesagenshistorico)

| Funcionalidade PesoLog                   | Solution Ticket tem? | Gap/observação                                            |
| ---------------------------------------- | -------------------- | --------------------------------------------------------- |
| Ticket com número sequencial             | SIM                  | `numero`                                                  |
| Status operacional e comercial separados | SIM (superior)       | `statusOperacional` + `statusComercial`                   |
| Histórico de alterações do ticket        | SIM                  | Model `Auditoria` (substitui `tpesagenshistorico`)        |
| Cálculo bruto/tara/líquido               | SIM                  | Conforme schema                                           |
| Descontos múltiplos por pesagem          | SIM                  | Model `DescontoPesagem`                                   |
| Valor unitário + valor total             | SIM                  | `valorUnitario`, `valorTotal` + `SnapshotComercialTicket` |
| Cancelamento com motivo                  | SIM                  | `canceladoEm`, `motivoCancelamento`                       |
| Relacionar ticket a romaneio             | SIM                  | `ItemRomaneio`                                            |

### 2.6 Manutenção de Ticket (UManutencao)

Screenshot: `nav_06_manutencao.png`, `A06_manutencao.png`.

| Funcionalidade PesoLog   | Solution Ticket tem? | Gap/observação                                                   |
| ------------------------ | -------------------- | ---------------------------------------------------------------- |
| Tela `manutencao/`       | SIM                  | Existe rota + `backend/src/manutencao`                           |
| Editar ticket já fechado | SIM                  | Via `SolicitacaoAprovacao`                                       |
| Recalcular valores       | [VERIFICAR]          | Confirmar endpoint                                               |
| Fluxo de aprovação dupla | SIM (superior)       | `aprovadorPrimarioId`, `aprovadorSecundarioId` — PesoLog não tem |
| Reimprimir ticket        | [VERIFICAR]          | Depende de `impressao.service.ts`                                |

### 2.7 Configuração (UConfiguracoes, UConfBancoDados) — feature flags do `Configuracao.ini`

| Flag INI                                                                             | Solution Ticket (`ConfiguracaoOperacionalUnidade`)                                                                       | Gap                                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `PESAGEM_COM_TARA`                                                                   | `pesagemComTara`                                                                                                         | OK                                                             |
| `PESAGEM_ENTRADA`                                                                    | `pesagemEntrada`                                                                                                         | OK                                                             |
| `PESAGEM_SAIDA`                                                                      | `pesagemSaida`                                                                                                           | OK                                                             |
| `FINANCEIRO`                                                                         | `financeiro`                                                                                                             | OK                                                             |
| `CAMERAS`                                                                            | `cameras`                                                                                                                | Flag OK, fluxo pendente `[TELA]`                               |
| `TRANSPORTADORA`                                                                     | `transportadoraHabilitada`                                                                                               | OK                                                             |
| `MOTORISTA`                                                                          | `motoristaHabilitado`                                                                                                    | OK                                                             |
| `ARMAZEM`                                                                            | `armazemHabilitado`                                                                                                      | OK                                                             |
| `MANUTENCAO_TICKET`                                                                  | `manutencaoTicket`                                                                                                       | OK                                                             |
| `CONVERSAO_UNIDADE`                                                                  | `conversaoUnidade`                                                                                                       | Flag OK, lógica de conversão `[VERIFICAR]`                     |
| `PRECO_VENDA`                                                                        | `precoVenda`                                                                                                             | OK                                                             |
| `BILHETAGEM`                                                                         | `bilhetagem`                                                                                                             | Flag OK, fluxo de impressão de bilhete intermediário `[FLUXO]` |
| `ORIGEM_DESTINO`                                                                     | `origemDestino`                                                                                                          | OK                                                             |
| `CALCULO_FRETE`                                                                      | `calculoFrete`                                                                                                           | OK (TabelaFrete)                                               |
| `TABELA_UMIDADE`                                                                     | `tabelaUmidade`                                                                                                          | OK                                                             |
| `DESCONTOS`                                                                          | `descontos`                                                                                                              | OK                                                             |
| `EMISSAO_ROMANEIO`                                                                   | `emissaoRomaneio`                                                                                                        | OK                                                             |
| `EDICAO_ROMANEIO`                                                                    | `edicaoRomaneio`                                                                                                         | OK                                                             |
| `HABILITA_BAIXA`                                                                     | `habilitaBaixa`                                                                                                          | OK                                                             |
| `LISTA_DOCUMENTOS`                                                                   | `listaDocumentos`                                                                                                        | Flag OK, tela dedicada pendente `[TELA]`                       |
| `[BALANCA] PADRAO_ENTRADA/SAIDA`                                                     | `tipoEntradaSaida` em Balanca                                                                                            | OK                                                             |
| `[IMPRESSAO] PREVIEW/NR_COPIAS/MANTEM_ABERTA/MODELO_TICKET/LOGOMARCA/LOGORELATORIOS` | `previewImpressao`, `numeroCopias`, `manterPreviewAberto`, `modeloTicketPadrao`, `logomarcaPadrao`, `logomarcaRelatorio` | OK (mapeamento 1:1)                                            |
| `[PESAGEM] ADICIONAL_1/2, OBSERVACAO, RODAPE, MANTEM_TARACADASTRADA`                 | `labelAdicional1`, `labelAdicional2`, `observacaoHabilitada`, `rodapeTexto`, `manterTaraCadastrada`                      | OK                                                             |

Cobertura de feature flags: **100%** no schema. Tela de configuração (`config/page.tsx`) existe e está implementada `[VERIFICAR]` se expõe todas as 28 flags.

### 2.8 Financeiro (UFinanceiro, UCancelFatura, UAjustePreco, tfaturas, tpagamentosfatura, tsaldosfinanceiro, trecibos, tpesagensafaturar, ttipofaturas, tformaspagamento)

| Funcionalidade PesoLog                               | Solution Ticket tem? | Gap/observação                                                                                         |
| ---------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| Tela financeiro (`UFinanceiro`)                      | SIM                  | `financeiro/page.tsx` + `backend/src/financeiro` `[VERIFICAR]` — não listado na árvore; usar `fatura/` |
| Fatura (emissão, consulta)                           | SIM                  | Model `Fatura` + `fatura.controller.ts`                                                                |
| Cancelamento de fatura (`UCancelFatura`)             | SIM                  | Rota `financeiro/cancelar`                                                                             |
| Ajuste de preço (`UAjustePreco`)                     | SIM                  | Rota `financeiro/ajuste-preco` + `HistoricoPreco`                                                      |
| Pagamentos da fatura (multi-parcela)                 | SIM                  | `PagamentoFatura` com `dataVencimento`, `dataBaixa`                                                    |
| Formas de pagamento                                  | SIM                  | `FormaPagamento` + controller                                                                          |
| Saldos financeiros por cliente (`tsaldosfinanceiro`) | PARCIAL              | `Cliente.saldoFinanceiro` existe, mas não há tabela de extrato movimentado `[CAMPO]`                   |
| Recibos (`trecibos`)                                 | NAO                  | `[TELA]` — gap crítico #4                                                                              |
| Pesagens a faturar (`tpesagensafaturar`)             | SIM                  | Equivalente via `statusComercial=NAO_ROMANEADO` filtrado                                               |
| Tipo de fatura (`ttipofaturas`)                      | SIM                  | Model `TipoFatura`                                                                                     |
| Baixa de fatura (`HABILITA_BAIXA`)                   | SIM                  | Campos `dataBaixa`, `usuarioBaixa` em PagamentoFatura                                                  |
| Extrato / movimentação financeira                    | [VERIFICAR]          | Não há model dedicado de extrato                                                                       |

### 2.9 Cadastros gerais

| Cadastro PesoLog                                                     | Solution Ticket                                | Gap                                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `tclientes` / `UCadClientes` / `UListaClientes`                      | `Cliente` + `cadastros/clientes`               | OK                                                                        |
| `ttransportadoras` / `UCadTransportadoras` / `UListaTransportadoras` | `Transportadora` + `cadastros/transportadoras` | OK                                                                        |
| `tmotoristas` / `UCadMotoristas` / `UListaMotoristas`                | `Motorista` + `cadastros/motoristas`           | OK                                                                        |
| `tveiculos` / `UCadVeiculos` / `UListaVeiculos`                      | `Veiculo` + `cadastros/veiculos`               | OK                                                                        |
| `tprodutos` / `UCadProdutos` / `UListaProdutos`                      | `Produto` + `cadastros/produtos`               | OK                                                                        |
| `ttipoveiculos` / `UCadTipoVeiculos`                                 | `TipoVeiculo` + `cadastros/tipos-veiculo`      | OK                                                                        |
| `tarmazens` / `UCadArmazens` / `UListaArmazens`                      | `Armazem` + `cadastros/armazens`               | OK                                                                        |
| `tempresas` / `UCadEmpresas`                                         | `Empresa` + `cadastros/empresas`               | OK                                                                        |
| `tunidades` / `UCadUnidades`                                         | `Unidade` + `cadastros/unidades`               | OK                                                                        |
| `tdestinos`                                                          | `Destino`                                      | OK (controller, sem rota frontend dedicada — usa seleção inline) `[TELA]` |
| Origens                                                              | `Origem`                                       | OK (idem) `[TELA]`                                                        |

### 2.10 Balanças e Indicadores (tequipamentos, tindicadores, UCalibracao)

| Funcionalidade PesoLog                                                                                   | Solution Ticket tem? | Gap/observação                                                                                    |
| -------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| Cadastro de balança/equipamento                                                                          | SIM                  | `Balanca` + `cadastros/balancas`                                                                  |
| Cadastro de indicador                                                                                    | SIM                  | `IndicadorPesagem` + `cadastros/indicadores`                                                      |
| Parâmetros de protocolo serial (baud, databits, etc.)                                                    | SIM                  | 12 campos no `IndicadorPesagem`                                                                   |
| 12 indicadores pré-configurados (ALFA, WEIGHTECH, JUNDIAI, MASTERTEC, SATURNO, TOLEDO, DIGITRON, MULLER) | PARCIAL              | Seed tem 12, adapters em `backend/src/balanca/adapters` e `parsers` — validação real `[HARDWARE]` |
| Calibração (`UCalibracao`)                                                                               | NAO                  | `[TELA]` — não há rota/módulo de calibração                                                       |
| Leitura TCP/IP da balança                                                                                | SIM                  | `enderecoIp`, `portaTcp` no `Balanca`, protocolo serial/tcp                                       |
| Tela de diagnóstico serial/terminal                                                                      | NAO                  | `[TELA][HARDWARE]` — PesoLog usa Hercules externo mas ter builtin ajuda                           |

### 2.11 Comercial (tprecoprodutos, tfreteprodutos, tumidades, ttipodescontos, tdescontospesagem)

| Funcionalidade                         | Solution Ticket | Gap                                                                                                             |
| -------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| Preço produto base + por cliente       | SIM (superior)  | `TabelaPrecoProduto` + `TabelaPrecoProdutoCliente` com `prioridadeResolucao` e vigência. PesoLog é tabela única |
| Frete por produto/destino/faixa        | SIM (superior)  | `TabelaFrete` com faixas de peso. PesoLog: `tfreteprodutos` simples                                             |
| Tabela umidade (desconto por faixa)    | SIM             | `TabelaUmidade` por produto com vigência                                                                        |
| Tipos de desconto                      | PARCIAL         | `DescontoPesagem.tipo` é livre; PesoLog tem tabela `ttipodescontos` pré-cadastrada `[TELA]`                     |
| Descontos aplicados na pesagem         | SIM             | `DescontoPesagem`                                                                                               |
| Snapshot comercial congelado no ticket | SIM (superior)  | `SnapshotComercialTicket` com versão e origem de cada componente                                                |

### 2.12 Relatórios (URelatorios, trelatorios)

Relatórios PesoLog (arquivos `.fr3` + template):

- `RelMovimentacao001` (c/ 2 decimais, original)
- `RelMovimentacao002` (c/ motorista)
- `RelPesagensAlteradas`
- `RelPesagensExcluidas`

| Relatório PesoLog                                   | Solution Ticket | Gap                                                            |
| --------------------------------------------------- | --------------- | -------------------------------------------------------------- |
| Movimentação (período)                              | [VERIFICAR]     | `backend/src/relatorios` existe, conferir endpoints            |
| Movimentação com motorista                          | [VERIFICAR]     | `[RELATORIO]`                                                  |
| Pesagens alteradas (auditoria)                      | SIM             | Via `Auditoria`                                                |
| Pesagens excluídas/canceladas                       | SIM             | Filtro `statusOperacional=CANCELADO`                           |
| Cadastro de relatórios customizados (`trelatorios`) | NAO             | PesoLog permite cadastrar nome/path de novos `.fr3` `[CONFIG]` |
| Export Excel/PDF                                    | [VERIFICAR]     | Conferir frontend `relatorios/page.tsx`                        |

### 2.13 Impressão de Tickets (UImpressaoTicket, 24 templates `.fr3`)

Templates do PesoLog (14 variações de ticket + 4 relatórios):
TICKET001 A5 1PF · TICKET002 A4 2PF (6 variações: base, Valor, INTEIRO, INTEIRO-Sem Desconto, Dif. Nota) · TICKET003 A4 3PF · TICKET004 CUPOM (6 variações: base, Resumido, Resumido-Produtor, Com Desconto, SemAssinatura, Gertec) · TICKET005 A4 Descontos (3 variações) · TICKET010 CUPOM Generic Text.

| Funcionalidade                                    | Solution Ticket | Gap                                                                    |
| ------------------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| Engine de impressão                               | PARCIAL         | `impressao.service.ts` genérico — provavelmente HTML/PDF               |
| Suporte a múltiplos layouts por tipo de ticket    | [VERIFICAR]     | Campo `modeloTicketPadrao` existe, mas layouts concretos `[RELATORIO]` |
| Layouts A5/A4/Cupom 58mm/Gertec                   | NAO             | Precisa portar 14 templates `[RELATORIO]` — **gap crítico #1**         |
| Preview antes de imprimir                         | SIM (flag)      | `previewImpressao`                                                     |
| Manter preview aberto                             | SIM             | `manterPreviewAberto`                                                  |
| Nº de cópias configurável                         | SIM             | `numeroCopias`                                                         |
| Impressão de bilhete intermediário (bilhetagem)   | [VERIFICAR]     | `[FLUXO]`                                                              |
| Logomarca no ticket                               | SIM             | `logomarcaPadrao`                                                      |
| Tratamento de erros de impressão (`UErrosTicket`) | [VERIFICAR]     | `[TELA]`                                                               |

### 2.14 Documentos Fiscais (tdocumentospesagem)

| Funcionalidade                                      | Solution Ticket | Gap                                                                                                 |
| --------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Anexar NFe/CTe/outros documentos ao ticket          | PARCIAL         | Model `DocumentoPesagem` existe (tipo, número, arquivoUrl), porém sem tela de upload/lista `[TELA]` |
| Lista de documentos por ticket (`LISTA_DOCUMENTOS`) | NAO             | Flag existe, tela não `[TELA]` — **gap crítico #3**                                                 |
| Validação/consulta XML NFe                          | NAO             | `[FLUXO]`                                                                                           |

### 2.15 Recibos (trecibos)

| Funcionalidade                 | Solution Ticket | Gap                                              |
| ------------------------------ | --------------- | ------------------------------------------------ |
| Emissão de recibo financeiro   | NAO             | Sem model `Recibo` — **gap crítico #4** `[TELA]` |
| Impressão de recibo            | NAO             | `[RELATORIO]`                                    |
| Numeração sequencial de recibo | NAO             | `[CAMPO]`                                        |

### 2.16 Utilitários (UErrosTicket, UDiagMessage, UImagem, CH340, Hercules)

| Utilitário PesoLog                         | Solution Ticket | Gap                                                   |
| ------------------------------------------ | --------------- | ----------------------------------------------------- |
| Log de erros na impressão (`UErrosTicket`) | [VERIFICAR]     | Possivelmente via auditoria/log genérico `[TELA]`     |
| Mensagens de diagnóstico (`UDiagMessage`)  | NAO             | `[TELA]`                                              |
| Captura de imagem (`UImagem`)              | NAO             | `[TELA][HARDWARE]`                                    |
| Driver CH340 (USB-serial)                  | NAO             | Não distribuído — documentar no instalador `[CONFIG]` |
| Hercules (terminal serial externo)         | NAO             | Nice-to-have terminal builtin `[TELA]`                |

### 2.17 Licenciamento (diferencial do Solution Ticket)

| Funcionalidade                          | Solution Ticket | PesoLog           |
| --------------------------------------- | --------------- | ----------------- |
| Licença RSA com fingerprint dispositivo | SIM             | NAO (diferencial) |
| Trial com limite de pesagens            | SIM             | NAO               |
| Eventos de licenciamento (auditoria)    | SIM             | NAO               |
| Bloqueio/expiração por data             | SIM             | NAO               |
| Tela `licenca/page.tsx` para ativação   | SIM             | NAO               |

### 2.18 Tabela de Umidade (tumidades)

| Funcionalidade                              | Solution Ticket | Gap                                                        |
| ------------------------------------------- | --------------- | ---------------------------------------------------------- |
| Faixa inicial/final de umidade → % desconto | SIM             | `TabelaUmidade.faixaInicial/faixaFinal/descontoPercentual` |
| Vigência                                    | SIM (superior)  | `vigenciaInicio/vigenciaFim` — PesoLog não versiona        |
| Por produto                                 | SIM             | `produtoId`                                                |
| Integração automática no cálculo de ticket  | SIM             | Via `SnapshotComercialTicket.umidadeOrigem`                |

---

## 3. Funcionalidades do Solution Ticket que o PesoLog NÃO TEM

1. **Multi-tenant (`Tenant`)** — suporte a múltiplas organizações isoladas em uma instalação.
2. **Licenciamento RSA + fingerprint dispositivo** (`LicencaInstalacao`, `EventoLicenciamento`).
3. **Matriz de regras operacionais** (`MatrizRegraOperacional`) — controle de visibilidade/obrigatoriedade por combinação empresa/unidade/tipoOperacao/cliente/produto.
4. **Snapshot comercial versionado por ticket** (`SnapshotComercialTicket`) — congelamento auditável dos valores no momento da emissão.
5. **Preço por cliente-produto-destino com prioridade de resolução e vigência** (`TabelaPrecoProdutoCliente` com `prioridadeResolucao`).
6. **Frete por faixa de peso + cliente/destino/produto** (`TabelaFrete`).
7. **Solicitação de aprovação com aprovador primário e secundário** (`SolicitacaoAprovacao`).
8. **Auditoria transversal** (`Auditoria` em entidade/estado anterior/estado novo).
9. **Histórico de preço** (`HistoricoPreco`).
10. **Bloqueio automático por tentativas de login** (`tentativasLogin`, `bloqueadoAte`).
11. **Status operacional e comercial separados no ticket** (PesoLog tem status único).
12. **Arquitetura web moderna** (Next.js + NestJS + Prisma, vs Delphi + Access).
13. **Indicador de estabilidade da leitura** (`indicadorEstabilidade`).
14. **Rastreamento de sincronização de passagem** (`sequenceNoDispositivo`, `eventIdOrigem`, `receivedAtBackend`).

---

## 4. Gaps críticos para fechar paridade comercial

Ordenados por impacto comercial (dor se o cliente perceber ausência):

| #   | Gap                                                                                                                     | Tag                 | Motivo                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------- |
| 1   | Portar 14 templates de ticket `.fr3` (A5/A4/2PF/3PF/Cupom/Descontos/Gertec) para motor de impressão HTML-PDF ou similar | `[RELATORIO]`       | Sem ticket impresso equivalente, cliente não opera |
| 2   | Validar físicamente os 12 adapters de indicadores com balança real em campo                                             | `[HARDWARE]`        | Se peso não entra na tela, produto está morto      |
| 3   | Tela de calibração da balança (`UCalibracao`)                                                                           | `[TELA][HARDWARE]`  | Cliente precisa recalibrar periodicamente          |
| 4   | Fluxo de recibos (`trecibos`) com model + impressão                                                                     | `[TELA][RELATORIO]` | Obrigação contábil em muitos clientes              |
| 5   | Tela de lista/upload de documentos fiscais por ticket                                                                   | `[TELA]`            | Exigência em operações fiscalizadas                |
| 6   | Captura de imagem via webcam/IP cam por passagem (`UImagem`)                                                            | `[TELA][HARDWARE]`  | Fraude/auditoria visual de carreta                 |
| 7   | Relatório Movimentação 001/002 (período, c/ motorista) equivalente                                                      | `[RELATORIO]`       | Relatório diário padrão do operador                |
| 8   | Relatório Pesagens Alteradas / Excluídas (impressão formatada)                                                          | `[RELATORIO]`       | Auditoria interna                                  |
| 9   | Tela de erros de impressão (`UErrosTicket`) com reimpressão                                                             | `[TELA]`            | Operador precisa recuperar ticket travado          |
| 10  | Fluxo de bilhetagem (comprovante intermediário na 1ª passagem)                                                          | `[FLUXO]`           | Flag já existe; falta materializar                 |
| 11  | Cadastro de tipos de desconto pré-definidos (`ttipodescontos`)                                                          | `[TELA]`            | Hoje tipo é string livre                           |
| 12  | Extrato financeiro do cliente (movimentação/saldo)                                                                      | `[CAMPO]`           | `saldoFinanceiro` existe, faltam movimentos        |

---

## 5. Gaps menores (nice-to-have)

| Item                                                               | Tag                 |
| ------------------------------------------------------------------ | ------------------- |
| Terminal serial builtin (substituto do Hercules)                   | `[TELA]`            |
| Tela de diagnóstico de mensagens (`UDiagMessage`)                  | `[TELA]`            |
| Distribuição de driver CH340 no instalador                         | `[CONFIG]`          |
| Cadastro de relatórios customizados (`trelatorios`)                | `[CONFIG]`          |
| Rota dedicada para cadastro de Origens/Destinos (hoje só embutido) | `[TELA]`            |
| Conferir endpoint `change password` e recuperação de senha         | `[VERIFICAR]`       |
| Dashboard com totalizadores e últimas pesagens                     | `[TELA][VERIFICAR]` |
| Consulta XML NFe/CTe                                               | `[FLUXO]`           |
| Ticker/feed de atividade em tempo real                             | `[TELA]`            |

---

## 6. Estimativa de esforço

| #         | Gap                                                                      | Estimativa (dias/dev) |
| --------- | ------------------------------------------------------------------------ | --------------------- |
| 1         | Engine de impressão + 14 templates de ticket (porte layout+QA)           | 10-14                 |
| 2         | Validação de 12 adapters com hardware real (viagem/instalador + TDD)     | 8-12                  |
| 3         | Tela de calibração (zero + span + curva)                                 | 4-5                   |
| 4         | Módulo Recibo completo (model + service + controller + tela + impressão) | 4-6                   |
| 5         | Tela de documentos fiscais do ticket (upload + lista + download)         | 3-4                   |
| 6         | Captura de imagem por passagem (serviço + storage + viewer + integração) | 6-8                   |
| 7         | Relatório Movimentação 001/002                                           | 3-4                   |
| 8         | Relatórios Pesagens Alteradas/Excluídas formatados                       | 2-3                   |
| 9         | Tela de erros de impressão + reimpressão                                 | 2-3                   |
| 10        | Fluxo de bilhetagem (impressão intermediária)                            | 2                     |
| 11        | Cadastro de tipos de desconto                                            | 1-2                   |
| 12        | Extrato financeiro do cliente (model + endpoint + tela)                  | 4-5                   |
| 13        | Terminal serial builtin                                                  | 2-3                   |
| 14        | Tela de diagnóstico / log central                                        | 2                     |
| 15        | Distribuição driver CH340 no instalador                                  | 0.5                   |
| 16        | Cadastro de relatórios customizados                                      | 2                     |
| 17        | Rotas dedicadas Origem/Destino                                           | 1-2                   |
| 18        | Change password + recuperação                                            | 1-2                   |
| 19        | Dashboard totalizadores                                                  | 3-4                   |
| 20        | Consulta XML NFe/CTe                                                     | 4-5                   |
| 21        | Feed de atividade em tempo real                                          | 2-3                   |
| **Total** |                                                                          | **~67-92 dias/dev**   |

Prioridade de execução recomendada: 2 → 1 → 3 → 7 → 4 → 5 → 6 → 9 → 10 → 11 → 12 → demais.

---

## Reporte final

- **Documento:** `C:\PROJETOS\Plataforma de Pesagem Veicular\AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md`
- **Total de gaps encontrados:** 21 (12 críticos + 9 menores), excluindo 10 `[VERIFICAR]`.
- **Maior gap (mais esforço):** Portar os 14 templates de ticket FastReport para motor próprio (10-14 dias).
- **Top-5 prioridade:**
  1. Validar 12 adapters de indicadores com balança real `[HARDWARE]`
  2. Portar 14 templates de ticket `.fr3` `[RELATORIO]`
  3. Tela de calibração da balança `[TELA][HARDWARE]`
  4. Relatório Movimentação (período, c/ motorista) `[RELATORIO]`
  5. Módulo Recibo (model + impressão) `[TELA][RELATORIO]`
