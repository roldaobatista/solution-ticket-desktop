---
name: pesolog-inspector
description: Use this skill to inspect the PesoLog system (concurrent/reference product for Solution Ticket) — its Access database, config files, ticket templates, Delphi forms, and runtime screenshots. Trigger when the user mentions "PesoLog", "banco do PesoLog", "schema do concorrente", "telas do PesoLog", "comparar com PesoLog", or asks to audit features against the reference system.
---

# PesoLog Inspector

PesoLog é o sistema concorrente/referência que o Solution Ticket está replicando.
Este skill documenta TUDO que foi extraído dele e como acessar cada artefato.

---

## 1. Localização do PesoLog no disco

**Instalação:** `C:\PesoLog\`

```
C:\PesoLog\
├── PesoLog.exe                 ← binário Delphi (compilado)
├── PesoLog.ico
├── Configuracao.ini            ← feature flags (SIM/NAO)
├── serial1.ini                 ← config da porta serial da balança
├── DB\
│   ├── PesoLog.mdb            ← banco Microsoft Access (30 tabelas)
│   ├── configBD.ini
│   └── libmysql.dll
├── Relatorios\
│   ├── TICKET001-010 *.fr3    ← templates FastReport
│   ├── TICKET *.png           ← preview visual de cada template
│   └── RelMovimentacao *.fr3
└── Utilitarios\
    ├── CH340 - Drivers - 32bits\
    ├── CH340 - Drivers - 64bits\
    └── hercules_3-2-8.exe     ← terminal serial de teste
```

**Credenciais do app PesoLog:** usuário `admin`, senha `admin`

---

## 2. Ler o banco Access (PesoLog.mdb)

**IMPORTANTE:** O OLEDB Provider da Microsoft NÃO está instalado. Não tente `ADODB.Connection` nem `pyodbc`. Use **Python com `access-parser`** (já instalado):

### Script mínimo para listar tabelas e contar registros

```python
from access_parser import AccessParser
db = AccessParser(r"C:\PesoLog\DB\PesoLog.mdb")
for tname in sorted(db.catalog.keys()):
    if tname.startswith("MSys") or tname.startswith("~"):
        continue
    t = db.parse_table(tname)
    n = max((len(v) for v in t.values()), default=0) if t else 0
    print(f"{tname}: {n} registros, {len(t) if t else 0} colunas")
```

### Script para detalhar colunas e 1ª linha de exemplo

```python
from access_parser import AccessParser
db = AccessParser(r"C:\PesoLog\DB\PesoLog.mdb")
t = db.parse_table("tpesagens")  # trocar pelo nome
cols = list(t.keys())
print("Colunas:", cols)
if max((len(v) for v in t.values()), default=0) > 0:
    print("Primeiro registro:", {c: t[c][0] for c in cols if t[c]})
```

### Tabelas já mapeadas (30)

`tarmazens`, `tclientes`, `tdescontospesagem`, `tdestinos`, `tdocumentospesagem`,
`tempresas`, `tequipamentos`, `tfaturas`, `tformaspagamento`, `tfreteprodutos`,
`tindicadores`, `tmotoristas`, `tpagamentosfatura`, `tpermissoes`, `tpesagens`,
`tpesagensafaturar`, `tpesagenshistorico`, `tprecoprodutos`, `tprodutos`,
`trecibos`, `trelatorios`, `tsaldosfinanceiro`, `ttipodescontos`, `ttipofaturas`,
`ttipoveiculos`, `ttransportadoras`, `tumidades`, `tunidades`, `tusuarios`, `tveiculos`

### Tabelas críticas (colunas importantes)

- **tpesagens (80 colunas)** — tabela principal; inclui `numeroPesagemXXX`, `seriePesagem`, `status`, `veiculo/placaVeiculo`, `cliente/nomeCliente`, `produto/descricaoProduto`, pesos (`pesoEntrada`, `pesoSaida`, `pesoReal`, `tara`, `totalDescontos`), `dataEntrada`, `dataSaida`, `balancaEntrada`, `balancaSaida`, campos financeiros `rf_*` (fatura vinculada)
- **tpermissoes (102 colunas)** — `usuario`, P1..P100 (flags booleanas granulares)
- **tindicadores (15 colunas)** — configuração de leitura serial: `inicioPeso`, `tamanhoPeso`, `tamanhoString`, `marcador`, `baudrate`, `fator`, `invertePeso`, `fabricante`, `modelo`
- **tequipamentos (22 colunas)** — balanças: `portaIP`, `portaSerial`, `tipo` (Serial/TCP), `indicador` (FK)
- **ttipofaturas** — 6 tipos padrão: ADIANTAMENTO VENDA/COMPRA, FATURA VENDA/COMPRA, RECEITA, DESPESA
- **tformaspagamento** — 8 padrão: DINHEIRO, CARTAO DEBITO/CREDITO, CHEQUE, TRANSF.BANCARIA, BOLETO, CRIAÇÃO DE SALDO, RESGATE

### 12 indicadores pré-configurados no seed (pesquisáveis em `tindicadores`)

ALFA 3102, WEIGHTECH WT1000/WT3000/genérico, JUNDIAI BJ-850, MASTERTEC MASTERPRO,
SATURNO com/sem indicador, TOLEDO 9091 P03, DIGITRON 5/6 dígitos, MULLER CRM 80000.

---

## 3. Feature flags (Configuracao.ini)

Arquivo: `C:\PesoLog\Configuracao.ini` — controla módulos habilitados.

Seções:

- `[FUNCIONALIDADE]` — PESAGEM_COM_TARA, PESAGEM_ENTRADA, PESAGEM_SAIDA, FINANCEIRO, CAMERAS
- `[CADASTROS]` — TRANSPORTADORA, MOTORISTA, ARMAZEM, MANUTENCAO_TICKET
- `[REGRAS]` — CONVERSAO_UNIDADE, PRECO_VENDA, BILHETAGEM, ORIGEM_DESTINO, CALCULO_FRETE,
  TABELA_UMIDADE, DESCONTOS, EMISSAO_ROMANEIO, EDICAO_ROMANEIO, HABILITA_BAIXA, LISTA_DOCUMENTOS
- `[BALANCA]` — PADRAO_ENTRADA, PADRAO_SAIDA
- `[IMPRESSAO]` — PREVIEW, NR_COPIAS, MANTEM_ABERTA, MODELO_TICKET, LOGOMARCA, LOGORELATORIOS
- `[PESAGEM]` — ADICIONAL_1/2, OBSERVACAO, RODAPE, MANTEM_TARACADASTRADA

---

## 4. Templates de ticket (FastReport `.fr3`)

Pasta: `C:\PesoLog\Relatorios\`

Cada template tem um `.png` ao lado para preview visual. Lista:

- **TICKET001** A5 1PF (1 passagem tara referenciada)
- **TICKET002** A4 2PF (bruto/tara) em 5 variações: padrão, Dif. Nota, Valor, INTEIRO, Sem Desconto
- **TICKET003** A4 3PF (com passagem de controle)
- **TICKET004** CUPOM em 5 variações: padrão, Com Desconto, Gertec, Resumido, Resumido Produtor, SemAssinatura
- **TICKET005A/B/C** A4 com Descontos (com/sem valor, com tabela umidade)
- **TICKET010** CUPOM Generic Text (impressora matricial)

Relatórios: RelMovimentacao001/002, RelPesagensAlteradas, RelPesagensExcluidas.

**Para inspecionar um template:** abra o `.png` correspondente. O `.fr3` é XML de FastReport.

---

## 5. Extrair informação do executável Delphi

O `PesoLog.exe` tem strings úteis embedadas (nomes de forms, labels, mensagens de erro).

### Extrair nomes de formulários

```python
import re
with open(r"C:\PesoLog\PesoLog.exe", "rb") as f: data = f.read()
# Forms Delphi: TF<Nome>, TCad<Nome>, TLista<Nome>
forms = sorted({m.decode('latin1') for m in re.findall(rb'TF(?:Cad|Lista|)[A-Z][a-zA-Z]+', data)})
for f in forms: print(f)
```

### Units/módulos Delphi do PesoLog (34 identificados)

`ULogin`, `UDashBoard`, `UPesagemEntrada`, `UPesagemSaida`, `UManutencao`, `URelatorios`,
`UConfiguracoes`, `UConfBancoDados`, `UFinanceiro`, `UCancelFatura`, `UAjustePreco`,
`UCalibracao`, `UImpressaoTicket`, `UErrosTicket`, `UDiagMessage`, `UImagem`,
`UCadArmazens`, `UCadClientes`, `UCadEmpresas`, `UCadMotoristas`, `UCadProdutos`,
`UCadTipoVeiculos`, `UCadTransportadoras`, `UCadUnidades`, `UCadUsuarios`, `UCadVeiculos`,
`UListaArmazens`, `UListaClientes`, `UListaMotoristas`, `UListaProdutos`, `UListaPSaida`,
`UListaTransportadoras`, `UListaUsuarios`, `UListaVeiculos`.

---

## 6. Rodar o PesoLog e capturar telas

```powershell
Start-Process "C:\PesoLog\PesoLog.exe"
# credenciais: admin / admin
# Como é app Delphi Windows, UIAutomation expõe MUITO pouco (controles custom).
# Use PowerShell + user32.dll (mouse_event, SetCursorPos) para clique,
# System.Windows.Forms.SendKeys para teclas.
# Para capturar: System.Drawing.Bitmap + Graphics.CopyFromScreen.
```

Exemplo completo de screenshot em `C:\PesoLog\*.ps1` (arquivos `do_login.ps1`, `nav_menus.ps1`, etc. — scripts já existentes).

**Screenshots já capturados** em `C:\PesoLog\`:

- `screen_login.png`, `screen_logged.png`, `screen_main.png`, `screen_invoke.png`
- `nav_01_main.png` até `nav_07_configuracoes.png`
- `after_cancel.png`, `bottom_area.png`, etc.

**Observação chave:** o app é DPI-aware 125%; `UIAutomation BoundingRectangle` reporta em coordenadas lógicas (1920×1080), e `SetCursorPos` usa o mesmo espaço. O screenshot é capturado em pixels físicos (1536×864). Para clicar em elemento encontrado via UIAutomation, use as coordenadas de `BoundingRectangle` DIRETAMENTE no `SetCursorPos`.

---

## 7. Scripts Python já prontos em `C:\PesoLog\`

- `read_db.py` — lista tabelas e contagens
- `read_db_detail.py` — detalha colunas e amostra de cada tabela
- `extract_strings.py` — grep de strings interessantes no .exe
- `extract_ui.py` — extrai forms/labels/mensagens do binário
- Saídas: `db_schema.json`, `db_detail.json`, `strings_found.txt`, `ui_forms.txt`

Para rodar: `python C:\PesoLog\read_db_detail.py`.

---

## 8. Auditoria comparativa já feita

Arquivo: `C:\PROJETOS\Plataforma de Pesagem Veicular\solution-ticket-desktop\docs\AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md`

Contém 6 seções: resumo executivo, comparação por módulo (18 módulos), o que Solution Ticket tem a mais, gaps críticos, gaps menores, estimativa de esforço.

---

## 9. Regras para usar este skill

- **NÃO abra ou modifique o `.mdb` do PesoLog** — é referência somente leitura.
- **NÃO execute o `PesoLog.exe` sem motivo** — ele mantém sessão aberta e pode conflitar com testes.
- Se precisar de dado novo do banco, use `access-parser` em Python, NÃO tente ODBC.
- Sempre cite o arquivo fonte ao reportar ("extraído de `C:\PesoLog\Relatorios\TICKET002-A4-2PF.fr3`").
- Se o usuário pedir "compare com PesoLog" e já existir a auditoria, aponte para `AUDITORIA-PESOLOG-vs-SOLUTION-TICKET.md` antes de reconstruir do zero.
