# Validação com ferramentas de simulação

Pasta: `C:\PROJETOS\Plataforma de Pesagem Veicular\FERRAMENTAS PARA TESTES\`

## Inventário

| Ferramenta                                          | Uso                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `EmuladorBalanca.exe`                               | Simula balança numa porta serial (`EmuladorBalanca.INI` define `PortaComunicacao=COM7`). Ideal para testes do Solution Ticket sem hardware. |
| `SimulaBal.exe`, `BalancaTeste.exe`, `TesteBal.exe` | Variantes legadas de simulação/diagnóstico.                                                                                                 |
| `hercules.exe`                                      | Terminal serial/TCP — útil para inspecionar tramas brutas.                                                                                  |
| `putty.exe`                                         | Terminal serial alternativo.                                                                                                                |
| `HW Virtual Serial Port.lnk` (HW VSP3)              | Cria pares de COM virtuais (ex: `COM7 ↔ COM8`) para emulador escrever em uma e Solution Ticket ler na outra.                                |
| `Gateway Virtual.lnk`                               | Bridge serial ↔ TCP (testar adapter TCP sem rede física).                                                                                   |
| `USR-TCP232-M4_E45 ... Saturno.exe`                 | Configuração do conversor serial-TCP da Saturno.                                                                                            |
| `BalLog.txt`                                        | Log histórico capturado de balanças reais (Toledo Protocol C, Genéricas) — usado como **fixture** para os testes de parser.                 |
| `LogPeso.txt`                                       | Histórico de leituras (peso, tara, hora).                                                                                                   |

## Achados validados nos parsers

A análise de `BalLog.txt` revelou tramas reais que confirmam/corrigem nossos parsers:

### 1. Toledo Protocolo C (request/response)

```
TX -> [ENQ]
RX <- [STX]i2  00010000000[CR][ENQ]
```

**Estrutura:** `STX + 'i' + status + (espaços) + peso(11) + CR + ENQ`
**Status:** `'2'` = estável, `'0'` = movimento.

✅ Implementado em `toledo-c.parser.ts` + spec com a trama real do log.

> O parser anterior `toledo.parser.ts` cobre o **Protocolo B** (`STX + status_byte + peso(6) + CR`). Agora ambos coexistem; o cadastro escolhe via `parserTipo: 'toledo' | 'toledo-c'`.

### 2. Genérica modo "D"

```
RX <- D000.318[CR]
```

**Estrutura:** `'D' + peso decimal(7) + CR`. Pode chegar duplicado: `D000.318[CR]D000.318[CR]`.

✅ Coberto pelo `GenericParser` configurando `inicioPeso=2, tamanhoPeso=7, marcador=13`. Spec do log real adicionado.

### 3. Genérica modo 7-bit ASCII

```
RX <- [20][STX][STX].318[CR]
```

✅ Coberto com `inicioPeso=4, tamanhoPeso=4, marcador=13`. Spec validado contra trama real.

## Procedimento para validar fim-a-fim com EmuladorBalanca

Pré-requisitos:

- HW VSP3 instalado (cria par COM7↔COM8).
- `EmuladorBalanca.exe` configurado em COM7 (já está no INI).

Passos:

1. Abrir HW Virtual Serial Port → criar par `COM7 ↔ COM8`.
2. Iniciar `EmuladorBalanca.exe` (vai escrever em COM7).
3. Cadastrar balança no Solution Ticket apontando para `COM8`, parser `toledo-c` (ou conforme emulador).
4. Acessar `/cadastros/balancas` → "Testar Conexão" → status verde esperado.
5. Em `/pesagem`, criar ticket e clicar "Capturar Peso" (ou F1).
6. Validar:
   - Leitura aparece igual à definida no emulador.
   - Status `estavel` reflete o byte status.
   - Trama bruta logada em `%APPDATA%/SolutionTicket/logs/electron.log`.

## Bridge serial→TCP (testar adapter TCP)

1. `Gateway Virtual.lnk` → configurar `COM8` ↔ TCP `127.0.0.1:4001`.
2. Cadastrar balança com protocolo `tcp`, host `127.0.0.1`, porta `4001`.
3. Repetir passos 4-6 acima.

## Próximos passos

- 🟡 Testar todos os 12 modelos pré-cadastrados via emulador (ver `HARDWARE-COMPATIBILITY.md`).
- 🟡 Capturar 1 trama real de cada modelo no emulador → adicionar como fixture-spec (mesma técnica do `toledo-c.parser.spec.ts`).
- 🟢 Parser Toledo C, Genérica D e Genérica 7-bit já têm cobertura via fixture do log real.
