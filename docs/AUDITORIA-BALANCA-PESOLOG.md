# Auditoria PesoLog — Cadastro e configuração de balança

Documento focado: como o concorrente trata o ciclo "cadastrar balança → configurar protocolo → editar parâmetros → calibrar". Fontes: `C:\PesoLog\` (binário Delphi), `PesoLog.mdb` (Access), `Configuracao.ini`, `serial1.ini`, screenshots, e extração de strings/forms do `.exe`.

---

## 1. Arquitetura PesoLog (referência)

### Modelo de dados — duas tabelas em camadas

| Tabela            | Papel                                                                                                                                | Colunas-chave                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **tindicadores**  | **Catálogo** de modelos de balança (preset por fabricante+modelo). 12 registros pré-instalados.                                      | `idtindicador, fabricante, modelo, baudrate, databits, stopbits, parity, flowControl, inicioPeso, tamanhoPeso, tamanhoString, marcador, fator, inverterPeso, atraso`                                                                                           |
| **tequipamentos** | **Instância** — uma balança específica em uma unidade. Referencia `tindicadores` via FK e **pode sobrescrever** todos os parâmetros. | `idtequipamentos, nomeSistema, tipo (SERIAL/TCP), portaSerial, ip, portaIP, indicador (FK), baudrate, databits, stopbits, parity, flowcontrol, inicioPeso, tamanhoPeso, tamanhoString, marcador, fator, invertePeso, atraso, modelo, informacao, desabilitado` |

**Insight crítico:** o usuário pode **criar/editar/excluir indicadores** dentro do app — não é hardcoded. O form `Cadastro de Indicador de Pesagem` (extraído do binário) prova isso. Os 12 indicadores pré-cadastrados são apenas **seed inicial**, totalmente editáveis depois.

### Fluxo de cadastro (deduzido dos forms + schema)

1. **Cadastros → Indicadores** abre form `TFCadIndicadores`. Lista de indicadores existentes + botão "Novo Indicador". Para cada indicador o usuário define: fabricante, modelo, baud, data, stop, parity, flow control, posição/tamanho do peso na trama, marcador (terminador), tamanho da string total, fator divisor, inverter peso, atraso entre leituras.
2. **Cadastros → Equipamentos** abre form `TFCadEquipamentos`. Cria uma instância: nome do sistema (ex.: "BALANÇA RODOVIÁRIA"), tipo (SERIAL ou TCP/IP), porta serial OU IP+porta TCP, **escolhe um indicador do catálogo**, opcionalmente sobrescreve qualquer parâmetro herdado.
3. **Manutenção → Calibração** (`UCalibracao.pas`) — testa conexão, mostra trama bruta, ajusta `inicioPeso/tamanhoPeso/marcador` ao vivo até o peso aparecer correto.

### Stack técnica

- **Componente serial**: `CPort` (TComPort do Delphi). String exportada `@Cportctl@TComSelect@SelectBaudRate/SelectDataBits/SelectStopBits` mostra que existem comboboxes pré-prontos da biblioteca para os parâmetros — UI profissional pronta.
- **Tipo de conexão**: SERIAL ou TCP. Não há Modbus (é gap do PesoLog).
- **Persistência da última config "padrão" ativa**: arquivo `serial1.ini`:
  ```ini
  [Comport1]
  Port=
  BaudRate=9600
  StopBits=1
  DataBits=8
  Parity=None
  FlowControl=None
  ```

### Configuração operacional `Configuracao.ini`

```ini
[BALANCA]
PADRAO_ENTRADA=1
PADRAO_SAIDA=1
```

Apenas FK do equipamento padrão para entrada/saída. O resto é em `tequipamentos`.

### Configuração das tramas — exemplo real do banco

**Indicador ALFA 3102** (`idtindicador=8`):

```
fabricante=ALFA, modelo=3102
baud=9600, data=8, stop=1, parity=None, flowControl=None
inicioPeso=5, tamanhoPeso=6, tamanhoString=22, marcador=13, fator=1
inverterPeso=False, atraso=10
```

Significado: trama de 22 bytes, peso começa no byte 5 (1-indexed) com 6 dígitos, terminada em CR (13), sem fator, sem inversão, polling a cada 10ms.

**Equipamento "BALANÇA RODOVIÁRIA"** (`idtequipamentos=1`):

```
nomeSistema=BALANÇA RODOVIÁRIA
tipo=SERIAL, portaSerial='', ip=null, portaIP=null
indicador=3 (FK), modelo='DIGITRON - 6 DIGITOS'
baud=9600, data=8, stop=1, parity=None, flowControl=None
inicioPeso=2, tamanhoPeso=6, tamanhoString=9, marcador=13, fator=1
desabilitado=False
```

Override do indicador 3 com config compatível Digitron 6-dígitos.

---

## 2. Solution Ticket atual

### O que já temos

| Item                     | Status                                                                                                  | Onde                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Catálogo de presets      | ✅ 23 presets hardcoded                                                                                 | `backend/src/balanca/presets.ts` |
| Modelos suportados       | ✅ Toledo (5 variantes), Filizola, Digitron, Urano, Saturno, AFTS, MT-SICS, Alfa, + 7 reusos do generic | parsers + presets                |
| Auto-detect              | ✅ `AutoDetectService` ranqueado por confiança                                                          | `auto-detect.service.ts`         |
| Capture-raw (serial+TCP) | ✅ Abre porta, captura bytes, fecha                                                                     | `capture-raw.service.ts`         |
| Discovery de rede        | ✅ Scan TCP do segmento /24                                                                             | `network-discovery.service.ts`   |
| Tabela `Balanca`         | ✅ Modelo Prisma com `protocolo, porta, baudRate, etc.`                                                 | `schema.prisma`                  |
| UI Wizard                | 🟡 Componente existe, **não plugado** na página de cadastros                                            | `BalancaConfigWizard.tsx`        |
| Modbus                   | ✅ Adapter + parser                                                                                     | melhor que PesoLog               |

### O que faltam (gaps reais frente ao PesoLog)

| Gap                                                                       | Impacto                                                    | Severidade |
| ------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| **Catálogo de indicadores editável pelo usuário** (CRUD em runtime)       | Usuário não consegue cadastrar protocolo novo sem código   | 🔴 Crítico |
| **Override por equipamento** dos parâmetros do indicador                  | Toda balança tem que usar config exata do preset           | 🔴 Crítico |
| **Wizard guiado de criação de protocolo novo**                            | Operador técnico precisa entender bytes/parsers para criar | 🔴 Alto    |
| **Tela de calibração ao vivo** (vê trama bruta + ajusta posições)         | Sem feedback visual durante setup                          | 🟠 Alto    |
| **Painel de teste de conexão profissional** (com hex/ascii em tempo real) | Diagnóstico só por logs do backend                         | 🟠 Médio   |
| **Persistência de "última config" para restaurar**                        | —                                                          | 🟡 Baixo   |
| **Configuração de balança padrão por unidade (entrada/saída)**            | Já temos via `tipoEntradaSaida`, mas falta UI              | 🟡 Baixo   |

### Diferenças arquiteturais — quem ganha em quê

| Aspecto                           | PesoLog                       | Solution Ticket                       |
| --------------------------------- | ----------------------------- | ------------------------------------- |
| Catálogo de protocolos editável   | ✅ tabela do banco            | ❌ hardcoded em `presets.ts`          |
| Auto-detect                       | ❌ inexistente                | ✅ tem                                |
| Network discovery                 | ❌ inexistente                | ✅ tem                                |
| Modbus RTU                        | ❌ inexistente                | ✅ tem                                |
| Multi-tenant                      | ❌ não tem                    | ✅ tem                                |
| 23 presets prontos                | 12 indicadores                | **23 presets** + auto-detect          |
| Calibração visual ao vivo         | ✅ tem (form `UCalibracao`)   | 🟡 só captura+detect, sem ajuste vivo |
| Wizard guiado para protocolo novo | 🟡 form direto sem orientação | ❌ não tem                            |

**Conclusão:** Solution Ticket está tecnicamente à frente em descoberta/auto-detect/Modbus/multi-tenant, **mas atrás em "operador técnico cadastra protocolo novo sem código"** — exatamente o pedido do usuário.

---

## 3. Plano S6 — Configuração profissional e guiada de balança

Objetivo: **qualquer operador técnico**, em campo, sem acesso ao código, deve conseguir:

1. Cadastrar uma balança nova (modelo conhecido) em 30 segundos.
2. Cadastrar uma balança **com protocolo desconhecido** em 5-10 minutos via wizard guiado.
3. Calibrar a balança vendo a trama bruta + ajustando posições do peso ao vivo até bater com a balança física.

### S6.1 — Catálogo de indicadores no banco (preset persistido) 🔴

- [ ] Modelo Prisma novo `IndicadorBalanca`:

  ```prisma
  model IndicadorBalanca {
    id              String  @id @default(uuid())
    tenantId        String  @map("tenant_id")
    fabricante      String
    modelo          String
    parserTipo      String  @map("parser_tipo") // toledo, toledo-c, digitron, generic, etc.
    protocolo       String  @default("serial") // serial | tcp | modbus
    // Serial defaults
    baudRate        Int     @default(9600)
    dataBits        Int     @default(8)
    parity          String  @default("N") // N, E, O
    stopBits        Int     @default(1)
    flowControl     String  @default("NONE")
    // Parser defaults
    inicioPeso      Int?
    tamanhoPeso     Int?
    tamanhoString   Int?
    marcador        Int?    @default(13) // CR
    fator           Float   @default(1)
    invertePeso     Boolean @default(false)
    atraso          Int     @default(0)
    exemploTrama    String?
    notas           String?
    builtin         Boolean @default(false) // true para os 23 vindos do seed
    criadoEm        DateTime @default(now())
    atualizadoEm    DateTime @updatedAt

    @@unique([tenantId, fabricante, modelo])
    @@map("indicador_balanca")
  }
  ```

- [ ] Migration formal.
- [ ] Seed dos 23 presets atuais como `builtin: true` (não-deletáveis na UI; editáveis sim).
- [ ] CRUD endpoints `/api/indicadores`: list, create, update, delete (rejeita delete se `builtin`).

### S6.2 — Override por balança 🔴

- [ ] Schema `Balanca` ganha FK `indicadorId` + colunas opcionais espelhando todos os parâmetros (que se preenchidos fazem override do indicador).
- [ ] `BalancaConnectionService` resolve config: pega indicador → aplica override do equipamento → conecta.
- [ ] UI: form de balança mostra "Configuração herdada do indicador X" + checkbox "Personalizar" que libera campos para override.

### S6.3 — Wizard "Adicionar protocolo desconhecido" 🔴

Objetivo: operador chega numa balança que ninguém ainda integrou. Em vez de mexer em código, segue um fluxo guiado de 4 passos:

**Passo 1 — Identificar tipo de conexão**

- Pergunta: "Sua balança conecta via cabo serial (DB9/USB-Serial) ou rede (cabo Ethernet)?"
- Resposta serial → próximo passo serial. TCP → próximo passo TCP.

**Passo 2 — Capturar trama bruta**

- Serial: usuário escolhe COM e clica "Capturar 5 segundos". Sistema mostra hex + ascii ao vivo.
- TCP: usuário informa IP:porta. Mesma captura. Botão "Enviar ENQ" para protocolos request/response.
- Saída: bytes capturados são exibidos com **annotations** (STX, ETX, CR, LF coloridos; bytes imprimíveis em ASCII).

**Passo 3 — Auto-detect + escolha**

- Sistema roda `AutoDetectService` nos bytes capturados.
- Mostra top 5 candidatos com confiança + peso lido + estabilidade.
- Se acertou (>80% confiança), usuário clica "Aplicar" e fim.
- Se não acertou, vai para Passo 4 (manual guiado).

**Passo 4 — Configurar manualmente (guiado)**

- UI mostra a trama capturada destacada byte por byte.
- Usuário aponta visualmente: "Onde começa o peso?" (clica no primeiro dígito) → preenche `inicioPeso` automático.
- "Quantos dígitos?" → arrasta seletor visual; sistema mostra prévia de qual número está sendo extraído em tempo real.
- "Qual o terminador?" → dropdown CR/LF/CR+LF/STX/ETX/custom.
- "Tem byte de status?" → se sim, "Qual posição?" + "Qual byte indica estabilidade?".
- "Fator divisor (kg vs g)?" → calcular automático: peso colocado na balança vs peso lido.
- Botão "Testar agora" → captura nova trama, aplica config, mostra peso resultante. Loop até bater.
- Botão "Salvar como novo indicador" → cria registro em `IndicadorBalanca` com nome editável.

### S6.4 — Tela de calibração ao vivo 🟠

- [ ] Página `/balanca/:id/calibracao`. Para balança já cadastrada.
- [ ] 3 painéis lado a lado:
  - **Trama bruta**: hex + ascii em tempo real (refresh 200ms), com bytes destacados conforme `inicioPeso/tamanhoPeso`.
  - **Peso interpretado**: número grande, status estável/movimento, fator aplicado.
  - **Histograma de estabilidade**: últimas 20 leituras para validar variação.
- [ ] Slider para ajustar inicioPeso/tamanhoPeso/marcador/fator e ver efeito IMEDIATO sem salvar.
- [ ] Botões: "Resetar para indicador padrão" / "Salvar override no equipamento" / "Promover para indicador novo".

### S6.5 — Painel de teste de conexão profissional 🟠

- [ ] Componente `<TerminalSerial>`:
  - Hex + ASCII split view.
  - Send box: pode enviar bytes em hex/ascii.
  - Botões macros: ENQ (0x05), STX (0x02), reset balança (sequência custom por modelo).
  - Log com timestamps.
  - Status de conexão visual.
- [ ] Pode ser usado para diagnosticar balança de forma similar ao Hercules — embutido no app.

### S6.6 — Persistência da última conexão 🟡

- [ ] Quando usuário conecta com sucesso uma balança, salvar timestamp em `Balanca.ultimaConexao`.
- [ ] Dashboard mostra "última leitura" e "última conexão" por balança — ajuda a detectar quando uma balança parou de responder.

### S6.7 — Configurador de balança padrão por unidade 🟡

- [ ] UI em `/cadastros/unidades/:id`: dropdown "Balança padrão entrada" + "Balança padrão saída".
- [ ] Equivalente ao `Configuracao.ini [BALANCA] PADRAO_ENTRADA/SAIDA`.
- [ ] Já existe `tipoEntradaSaida` no schema atual, mas operador escolhe ao iniciar pesagem; aqui é default da unidade.

---

## 4. Estimativa de esforço S6

| Item                                  | Esforço  | Bloqueador?      |
| ------------------------------------- | -------- | ---------------- |
| S6.1 Catálogo no banco + CRUD         | 1-2 dias | 🔴               |
| S6.2 Override por balança             | 1 dia    | 🔴               |
| S6.3 Wizard de protocolo desconhecido | 3-4 dias | 🔴 (UI complexa) |
| S6.4 Tela de calibração ao vivo       | 2 dias   | 🟠               |
| S6.5 Terminal serial profissional     | 1-2 dias | 🟠               |
| S6.6 Persistência última conexão      | 0.5 dia  | 🟡               |
| S6.7 Default por unidade              | 0.5 dia  | 🟡               |

**Total estimado:** 2 semanas de trabalho focado, com validação visual no Electron.

---

## 5. Critério de superioridade definitiva

Após S6 completo, o Solution Ticket cobre **100% do que o PesoLog faz** + tem:

- ✅ Auto-detect (PesoLog não tem)
- ✅ Network discovery (PesoLog não tem)
- ✅ Modbus RTU/TCP (PesoLog não tem)
- ✅ Wizard guiado para protocolo desconhecido (PesoLog não tem — usuário tem que decifrar a trama por trás de um manual)
- ✅ Terminal serial embutido (PesoLog usa Hercules separado)
- ✅ 23 presets pré-cadastrados (PesoLog tem 12)
- ✅ Multi-tenant (PesoLog é single-tenant)

E mantém paridade total em:

- Catálogo de protocolos editável pelo usuário
- Override por equipamento
- Calibração visual
- Configuração de balança padrão por unidade
