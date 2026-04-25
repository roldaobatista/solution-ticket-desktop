# Compatibilidade de hardware — Balanças

## Status atual

**Nenhum modelo testado em hardware real.** Adapters e parsers foram implementados conforme datasheets, mas precisam validação em campo. Esta página rastreia o status de cada modelo.

## Matriz de modelos pré-cadastrados

| Modelo                 | Protocolo     | Adapter          | Parser            | Status         | Anotações                                                           |
| ---------------------- | ------------- | ---------------- | ----------------- | -------------- | ------------------------------------------------------------------- |
| TOLEDO 9091            | Serial RS-232 | `serial.adapter` | `toledo.parser`   | 🟡 Não testado | Trama: STX + status + 6 bytes peso + CR. Status bit0 = estabilidade |
| TOLEDO 9090            | Serial RS-232 | `serial.adapter` | `toledo.parser`   | 🟡 Não testado | Idêntico ao 9091 conforme manual                                    |
| FILIZOLA               | Serial RS-232 | `serial.adapter` | `filizola.parser` | 🟡 Não testado | Reusa Toledo (estrutura compatível)                                 |
| ALFA 3102              | Modbus RTU    | `modbus.adapter` | `modbus.parser`   | 🟡 Não testado | Holding registers, ler doc fabricante para endereço                 |
| WEIGHTECH WT1000       | TCP/IP        | `tcp.adapter`    | `generic.parser`  | 🟡 Não testado | Porta padrão 4001                                                   |
| WEIGHTECH WT3000       | TCP/IP        | `tcp.adapter`    | `generic.parser`  | 🟡 Não testado | Idem WT1000                                                         |
| JUNDIAI BJ-850         | Serial        | `serial.adapter` | `generic.parser`  | 🟡 Não testado | Configurar marcador e tamanho via cadastro                          |
| MASTERTEC MASTERPRO    | Serial        | `serial.adapter` | `generic.parser`  | 🟡 Não testado | —                                                                   |
| SATURNO                | Serial        | `serial.adapter` | `generic.parser`  | 🟡 Não testado | —                                                                   |
| DIGITRON 5/6           | Serial        | `serial.adapter` | `generic.parser`  | 🟡 Não testado | —                                                                   |
| MULLER CRM 80000       | Serial        | `serial.adapter` | `generic.parser`  | 🟡 Não testado | —                                                                   |
| METTLER TOLEDO MT-SICS | Serial        | `serial.adapter` | `sics.parser`     | 🟡 Não testado | Trama "S S 12.345 kg\r\n"                                           |

Legenda: 🟢 testado ok · 🟡 não testado · 🔴 falha conhecida

## Procedimento de smoke test (por modelo)

### Pré-requisitos

- Balança ligada e em modo de transmissão contínua.
- Cabo serial DB9/USB-Serial (verificar `COM` no Gerenciador de Dispositivos do Windows) ou IP/porta TCP.
- Aplicativo `Solution Ticket` rodando localmente.
- Permissão `config:gerenciar` no usuário de teste.

### Passos

1. **Cadastrar a balança** em `/cadastros/balancas`:
   - Nome: `[Modelo] - Lab`
   - Protocolo: `serial` | `tcp` | `modbus`
   - Porta: `COM3` (serial) ou `192.168.x.x:4001` (TCP)
   - BaudRate: 9600 (padrão Toledo); ajustar conforme manual
   - Parser: selecionar correspondente

2. **Conectar**: clicar "Testar Conexão". Aguardar status verde (online).

3. **Capturar peso** com peso conhecido (calibrado):
   - Colocar massa de referência (ex.: 100 kg).
   - Acessar `/pesagem`, criar ticket de teste.
   - Capturar peso. Repetir 5 vezes.
   - Esperado: leituras dentro de ±0,5% do peso real e marcadas como `estavel: true` após 1-2 segundos sem variação.

4. **Estabilidade**: agitar suavemente a plataforma. As capturas devem ficar `estavel: false` enquanto há variação.

5. **Desconectar/reconectar**: derrubar conexão (puxar cabo / `iptables`), aguardar erro, religar. Sistema deve reconectar sem reiniciar app.

6. **Documentar resultado** atualizando esta página + capturando 2 logs:
   - `%APPDATA%/SolutionTicket/logs/electron.log` (últimas 100 linhas)
   - Trama bruta capturada (campo `bruto` do `LeituraPeso` no backend)

### Critério de aceitação por modelo

- ✅ Conexão estabelece em < 5s
- ✅ 95% das leituras dentro de ±0,5%
- ✅ Estabilidade detectada corretamente
- ✅ Reconexão após queda em < 10s
- ✅ Sem leak de memória após 1h ininterrupta

## Bugs conhecidos para revalidar em campo

- Modbus: `modbus.adapter` lê o peso, mas não interpreta status-bits — extensão dependente do mapa de holding registers de cada fabricante.
- Generic parser: `inicioPeso` e `tamanhoPeso` precisam ser ajustados manualmente no cadastro para cada modelo desconhecido.
- TCP adapter: timeout fixo em 5s — modelos lentos podem precisar tunning.

## Referências

- Datasheet Toledo 9091: protocolo "STX + status + peso(6) + ETX + CR"
- MT-SICS Reference Manual: `S S` (stable), `S D` (dynamic)
- Modbus RTU spec: registros 0x0000-0x0010 normalmente expõem peso bruto
