# Decisoes Pendentes

## 1. Modelo FilaVeiculo ausente no schema

O arquivo `src/fila/fila.service.ts` referenciava `prisma.filaVeiculo`, mas esse modelo nao existe em `src/prisma/schema.prisma`. Como correcao para desbloquear o build, o service foi convertido em stub (retorna dados em memoria).

Pendente: decidir se:

- Adicionar o modelo `FilaVeiculo` ao schema (campos sugeridos: `id`, `unidadeId`, `veiculoId`, `motoristaId`, `ordemChegada`, `status`, `dataChamada`, `dataSaida`, `criadoEm`)
- OU remover o modulo `fila` definitivamente do projeto.

## 2. Ajustes em `tabela-umidade`

Os campos `umidadeMinima`/`umidadeMaxima`/`percentualDesconto` usados pelo codigo antigo nao existem no schema atual. Foram mapeados para `faixaInicial`/`faixaFinal`/`descontoPercentual` (que existem no model `TabelaUmidade`). Confirmar se a semantica e equivalente do ponto de vista de negocio.

## 3. Auditoria: campos `estadoAnterior` / `estadoNovo` agora sao `String?`

Convertidos para `JSON.stringify(...)` ao gravar. Consumidores precisam fazer `JSON.parse(...)` ao ler. O campo `payload` nao existe mais no DTO de `AuditoriaService.registrar` — interceptor foi ajustado para usar `estadoNovo`.

## 4. Seed.ts: valores de enum "livres"

O `seed.ts` usa valores como `TaraReferenciaTipo.CAPTURADA_EM_BALANCA`, `ModoComercial.INFORMATIVO/OBRIGATORIO`, `TipoPassagem.ENTRADA/SAIDA`, `OrigemLeitura.AUTOMATICA`. Como os enums viraram `String` no SQLite, esses valores passam direto. Confirmar se devem ser padronizados junto com o restante do dominio.

## X. Modulo Balanca - Hardware

### Schema

- `IndicadorPesagem` foi estendido com campos de parsing de hardware (parserTipo, baudrate, databits, stopbits, parity, flowControl, inicioPeso, tamanhoPeso, tamanhoString, marcador, fator, invertePeso). Modelos "categoria" antigos (Pesagem Normal, Urgente, etc.) continuam compativeis — todos os novos campos sao opcionais.
- `Balanca` ganhou `indicadorId` (FK opcional -> IndicadorPesagem) para referenciar o modelo de hardware.
- Aplicado via `prisma db push --accept-data-loss`. Recomenda-se criar migration formal antes do release.

### Bindings nativos (serialport, modbus-serial)

- Pacotes instalados: `serialport`, `@serialport/parser-readline`, `modbus-serial`, `@types/serialport` (dev).
- `@serialport/bindings-cpp` usa prebuilds via `node-gyp-build` — instalou sem precisar de toolchain.
- Para empacotamento com Electron sera necessario rodar `electron-rebuild` na etapa de build do desktop (nao feito aqui).
- O require do `serialport` e do `modbus-serial` e feito lazy dentro de `connect()` dos adapters, para nao quebrar o build/start em ambientes sem o binding.

### Parsers implementados

- `generic` (PesoLog: inicioPeso/tamanhoPeso/marcador/fator/invertePeso)
- `toledo` (STX + status + peso 6 digits + CR)
- `filizola` (alias Toledo)
- `sics` (MT-SICS - Mettler Toledo)
- `modbus` (le 2 holding registers, 32-bit BE)

### Estabilidade

- Algoritmo: 5 leituras consecutivas com variacao <= 2 kg marca `estavel=true`. Constantes em `BalancaConnectionService`.

### Pendencias

- Adicionar testes unitarios dos parsers (ver task #15 - emulador).
- Validar protocolos com hardware real (Toledo 9091, Alfa 3102, etc.) — valores de `inicioPeso/tamanhoPeso` foram migrados do PesoLog mas precisam aferir contra balanca.
