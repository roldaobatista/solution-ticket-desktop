# Modulo Cadastro de Balanca Completo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o cadastro de balancas em um modulo completo de configuracao, diagnostico e criacao de protocolos/indicadores customizados, aproveitando os presets, parsers, captura raw, auto-detect, Modbus, calibracao e telemetria que ja existem.

**Architecture:** Manter `IndicadorPesagem` como catalogo de protocolo/modelo reutilizavel e `Balanca` como equipamento fisico instalado. A configuracao efetiva continua centralizada em `backend/src/balanca/config-resolver.ts`, com precedencia `override da balanca > indicador > default`. O modo de leitura usa nomes canonicos persistidos como `readMode`, `readCommandHex`, `readIntervalMs` e `readTimeoutMs`; no objeto efetivo interno aparece como `config.read.mode`, `config.read.commandHex`, `config.read.intervalMs` e `config.read.timeoutMs`. O frontend passa a expor essa arquitetura em abas: cadastro geral, comunicacao, protocolo/parser, diagnostico, calibracao e historico.

**Tech Stack:** NestJS 10, Prisma 5, SQLite, Next.js 15 App Router, React Query, Zustand, Tailwind, Jest, Testing Library.

---

## Estado Atual Aproveitavel

- `backend/src/prisma/schema.prisma`
  - `Balanca` ja possui `baudRate`, `ovrDataBits`, `ovrParity`, `ovrStopBits`, `ovrFlowControl`, overrides de parser, estabilidade, `debugMode`, campos TCP e Modbus.
  - `IndicadorPesagem` ja guarda presets e protocolos customizados: serial, parser, baudrate, databits, parity, stopbits, flowControl, inicio/tamanho/marcador/fator.
- `backend/src/balanca/presets.ts`
  - Ja tem presets Toledo, Filizola, Digitron, Urano, Saturno, SICS, Modbus, genericos e `SERIAL_OPTIONS`.
- `backend/src/balanca/presets.controller.ts`
  - Ja expõe presets, serial-options, captura raw, capture-and-detect, auto-detect, parser test e discovery TCP.
- `backend/src/indicadores/*`
  - Ja existe CRUD de indicador e wizard backend para anotar bytes, testar parser e criar indicador a partir de captura.
- `backend/src/balanca/config-resolver.ts`
  - Ja resolve config efetiva usando overrides por balanca, indicador e default.
- `backend/src/balanca/balanca-connection.service.ts`
  - Ja conecta adapter, parser, SSE, debug log, estabilidade, teste e captura.
- `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx`
  - Ja lista/cria/edita balanca basica, tipo de conexao, porta/IP, Modbus, ajuste de leitura e calibracao.
- `frontend/src/app/(authenticated)/utilitarios/terminal-serial/page.tsx`
  - Ja testa serial com baudrate, data bits, parity e stop bits, mas nao salva na balanca.
- `frontend/src/components/balanca/BalancaConfigWizard.tsx`
  - Ja possui UI parcial para preset/autodetect, mas nao esta integrada ao cadastro de balanca atual.

## Lacunas Funcionais

1. A tela de balancas nao expõe parametros seriais persistentes: `baudRate`, `dataBits`, `parity`, `stopBits`, `flowControl`.
2. A tela nao expõe todos os overrides existentes de parser: `ovrInicioPeso`, `ovrTamanhoPeso`, `ovrTamanhoString`, `ovrMarcador`, `ovrFator`, `ovrInvertePeso`, `ovrAtraso`, `ovrParserTipo`.
3. O frontend nao envia/mapeia quase todos os campos `ovr*`.
4. O backend aceita pouco no DTO; `UpdateBalancaDto` tem só `ovrFator`, embora o schema e resolver suportem varios overrides.
5. Protocolos request/response ainda dependem de hard-code em `parserPrecisaEnq()`. Para protocolos desconhecidos, falta salvar comando de leitura configuravel.
6. O CRUD visual de `IndicadorPesagem` e o wizard de protocolo desconhecido estao incompletos/desconectados da tela principal.
7. Falta endpoint e UI de "configuracao efetiva" para mostrar exatamente de onde cada parametro veio: default, indicador ou override da balanca.
8. Diagnostico esta espalhado: terminal serial, capture raw, auto-detect, teste de balanca e debug log nao formam um fluxo unico.

## Modelo Conceitual

- **Indicador/Protocolo:** template reutilizavel do modelo da balanca. Deve conter fabricante, modelo, protocolo, parametros seriais padrao, parser, exemplo de trama, notas e comando de polling quando existir.
- **Balanca:** equipamento instalado em uma unidade. Deve conter nome operacional, unidade, direcao entrada/saida, porta/IP, status, indicador vinculado e overrides locais.
- **Configuracao efetiva:** resultado calculado usado pelo adapter. Deve ser visivel para o operador tecnico antes de testar.
- **Protocolo desconhecido:** criado por wizard: capturar bytes, anotar trama, testar parser, salvar como indicador customizado, aplicar na balanca.

## Estrutura de Arquivos

### Backend

- Modify: `backend/src/prisma/schema.prisma`
  - Adicionar campos de modo/comando de leitura que ainda nao existem.
- Create: `backend/src/prisma/migrations/<timestamp>_balanca_read_command/migration.sql`
  - Migration SQLite para novos campos.
- Modify: `backend/src/balanca/dto/create-balanca.dto.ts`
  - Expor todos os overrides e campos de comando.
- Modify: `backend/src/balanca/dto/update-balanca.dto.ts`
  - Expor todos os overrides e campos de comando.
- Create: `backend/src/indicadores/dto/create-indicador.dto.ts`
  - DTO runtime para validar CRUD/wizard de indicadores.
- Create: `backend/src/indicadores/dto/update-indicador.dto.ts`
  - DTO runtime para validar update parcial e permitir limpeza com `null`.
- Modify: `backend/src/indicadores/indicador.service.ts`
  - Aceitar campos de comando no indicador customizado.
- Modify: `backend/src/indicadores/indicador.controller.ts`
  - Usar DTOs reais em vez de interface TypeScript em runtime.
- Modify: `backend/src/indicadores/wizard.controller.ts`
  - Persistir campos de comando criados no wizard.
- Modify: `backend/src/balanca/presets.ts`
  - Enriquecer presets request/response com `readMode` e `readCommandHex`.
- Modify: `backend/src/balanca/config-resolver.ts`
  - Incluir `readMode`, `readCommandHex`, `readIntervalMs`, `readTimeoutMs` na configuracao efetiva.
- Modify: `backend/src/balanca/balanca-connection.service.ts`
  - Usar `config.read` para polling e manter `parserPrecisaEnq()` apenas como fallback temporario de compatibilidade.
- Modify: `backend/src/balanca/capture-raw.service.ts`
  - Aceitar comando hex arbitrario alem de `enviarEnq`.
- Modify: `backend/src/balanca/balanca.controller.ts`
  - Expor endpoint de effective-config em `/balancas/:id/effective-config`.
- Modify: `backend/src/balanca/presets.controller.ts`
  - Manter endpoints globais de config e adicionar capture com comando customizado.
- Test: `backend/src/balanca/config-resolver.spec.ts`
- Test: `backend/src/balanca/balanca.service.spec.ts`
- Test: `backend/src/balanca/balanca.controller.spec.ts` (se existir padrao local para controllers)
- Test: `backend/src/balanca/balanca-connection-effective-config.spec.ts`
- Test: `backend/src/indicadores/indicador.service.spec.ts` (criar se nao existir)
- Test: `backend/src/indicadores/dto/dto-validation.spec.ts` (criar se nao existir)

### Frontend

- Modify: `frontend/src/types/index.ts`
  - Expandir `Balanca` e `IndicadorPesagem`.
- Modify: `frontend/src/lib/api/balanca.ts`
  - Mapear payload e response com todos os campos novos/existentes.
- Modify: `frontend/src/lib/api/indicador.ts`
  - Remover `tenantId` manual dos calls, usar JWT, adicionar campos novos.
- Modify: `frontend/src/lib/api/balanca-config.ts`
  - Adicionar effective-config, capture com comando customizado e test-parser helpers.
- Replace/Split: `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx`
  - Quebrar em componentes menores.
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaList.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaEditorDialog.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaGeralTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaComunicacaoTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaProtocoloTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaDiagnosticoTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaConfigEfetiva.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/IndicadorWizardDialog.tsx`
- Modify: `frontend/src/app/(authenticated)/cadastros/indicadores/page.tsx`
  - Transformar lista readonly em CRUD completo ou redirecionar para wizard a partir da balanca.
- Test: `frontend/src/app/(authenticated)/cadastros/balancas/__tests__/balanca-mapper.test.ts`
- Test: `frontend/src/app/(authenticated)/cadastros/balancas/__tests__/BalancaComunicacaoTab.test.tsx`
- Test: `frontend/src/app/(authenticated)/cadastros/balancas/__tests__/IndicadorWizardDialog.test.tsx`

### Docs

- Modify: `docs/HARDWARE-COMPATIBILITY.md`
- Modify: `docs/FERRAMENTAS-TESTE.md`
- Create: `docs/runbooks/CADASTRO-BALANCA.md`

---

## Decisoes de Produto

1. **O operador comum nao configura protocolo.** O modulo deve ser protegido por `CONFIG_GERENCIAR`.
2. **Preset primeiro, override depois.** O fluxo principal deve pedir o indicador/modelo e mostrar a configuracao herdada. Overrides ficam em uma secao explicita.
3. **Tudo testavel antes de salvar.** Captura raw, parser e conexao precisam rodar antes do tecnico aplicar em campo.
4. **Protocolos desconhecidos viram IndicadorPesagem customizado.** Nao criar "protocolo solto" dentro da balanca sem catalogo, para reaproveitar em outras unidades.
5. **Configuracao efetiva sempre visivel.** Mostrar parametro, valor e origem: `balanca`, `indicador` ou `default`.
6. **Sem inventar parser dinamico perigoso.** V1 usa parser `generic` parametrizado e parsers conhecidos. Codigo de parser customizado executavel fica fora de escopo.
7. **Compatibilidade primeiro.** Protocolos ja suportados por hard-code, como Toledo C e Filizola `@`, nao podem parar de funcionar durante a migracao para comando configuravel.
8. **Contrato validado em runtime.** Todo endpoint sensivel que recebe body deve usar DTO de classe, nao interface TypeScript, porque o `ValidationPipe` global usa `whitelist` e `forbidNonWhitelisted`.

## Correcoes de Execucao Obrigatorias

- **Nao executar o plano literalmente sem estes ajustes.** Esta versao corrige pontos de risco encontrados na auditoria do plano original.
- **Padronizar nomes:** persistencia usa `readIntervalMs`; nao introduzir `pollIntervalMs`.
- **Backfill de polling:** a migration de `read_*` deve atualizar indicadores existentes com `parser_tipo in ('toledo-c', 'filizola-at', 'filizola-@')` para `read_mode='polling'` e `read_command_hex='05'`.
- **Fallback temporario de ENQ:** manter `parserPrecisaEnq()` como compatibilidade apenas quando `config.read` nao tiver comando efetivo; remover so em uma tarefa futura com evidence de migration/seed.
- **`testar()` tambem usa comando configuravel:** trocar o envio hard-coded de ENQ no teste de conexao, nao apenas no polling continuo.
- **Update valida estado combinado:** `BalancaService.update()` deve validar `atual + dto`, incluindo `portaTcp`, campos Modbus e overrides, nao somente o DTO parcial.
- **`null` limpa override:** payload frontend e DTO/backend devem preservar `null`; filtrar apenas `undefined` e string vazia quando a string vazia nao for uma limpeza intencional.
- **Permissao em diagnostico/protocolo:** endpoints de captura, auto-detect, annotate/test-config e wizard devem exigir `CONFIG_GERENCIAR`.
- **Indicador precisa DTO:** criar DTOs de indicador antes do CRUD visual completo, para nao depender de interface sem validacao runtime.

---

## Tarefas

### Task 1: Completar contrato backend dos campos ja existentes

**Files:**

- Modify: `backend/src/balanca/dto/create-balanca.dto.ts`
- Modify: `backend/src/balanca/dto/update-balanca.dto.ts`
- Modify: `backend/src/balanca/balanca.service.ts`
- Test: `backend/src/balanca/dto/dto-validation.spec.ts`
- Test: `backend/src/balanca/balanca.service.spec.ts`

- [ ] **Step 1: Escrever testes de DTO para overrides seriais e parser**

Adicionar casos validando:

- `baudRate` aceita inteiros comuns.
- `ovrDataBits` aceita `7 | 8` e rejeita qualquer outro inteiro.
- `ovrParity` aceita `N | E | O | none | even | odd`.
- `ovrStopBits` aceita `1 | 2` e rejeita qualquer outro inteiro.
- `ovrFlowControl` aceita `NONE | XON_XOFF | RTS_CTS | DTR_DSR | none | software | hardware`.
- `ovrParserTipo`, `ovrInicioPeso`, `ovrTamanhoPeso`, `ovrTamanhoString`, `ovrMarcador`, `ovrFator`, `ovrInvertePeso`, `ovrAtraso`, `toleranciaEstabilidade`, `janelaEstabilidade`, `debugMode`.
- `null` é aceito para campos opcionais em update, porque `null` limpa override e volta a herdar do indicador.
- campos desconhecidos continuam rejeitados pelo `ValidationPipe` global.

Run:

```bash
pnpm --filter ./backend test dto-validation.spec.ts --runInBand
```

Expected: FAIL porque os campos ainda nao estao no DTO.

- [ ] **Step 2: Adicionar campos aos DTOs**

Adicionar nos DTOs. Importar tambem `Min` e `Max` quando ainda nao existirem. Para update, manter `@IsOptional()` para aceitar `undefined` e `null`; `null` deve chegar ao Prisma para limpar override.

```ts
@ApiPropertyOptional()
@IsOptional()
@IsInt()
@IsIn([7, 8])
ovrDataBits?: number;

@ApiPropertyOptional()
@IsOptional()
@IsString()
@IsIn(['N', 'E', 'O', 'none', 'even', 'odd'])
ovrParity?: string;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@IsIn([1, 2])
ovrStopBits?: number;

@ApiPropertyOptional()
@IsOptional()
@IsString()
@IsIn(['NONE', 'XON_XOFF', 'RTS_CTS', 'DTR_DSR', 'none', 'software', 'hardware'])
ovrFlowControl?: string;

@ApiPropertyOptional()
@IsOptional()
@IsString()
ovrParserTipo?: string;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(0)
ovrInicioPeso?: number;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(1)
ovrTamanhoPeso?: number;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(1)
ovrTamanhoString?: number;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(0)
@Max(255)
ovrMarcador?: number;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(1)
ovrFator?: number;

@ApiPropertyOptional()
@IsOptional()
@IsBoolean()
ovrInvertePeso?: boolean;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(0)
ovrAtraso?: number;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(0)
toleranciaEstabilidade?: number;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(1)
janelaEstabilidade?: number;

@ApiPropertyOptional()
@IsOptional()
@IsBoolean()
debugMode?: boolean;
```

- [ ] **Step 3: Garantir validacao sem quebrar compatibilidade**

Em `BalancaService.validarProtocoloEPorta`, manter aliases existentes e adicionar regra:

- se `baudRate` ou overrides seriais vierem em protocolo TCP puro, permitir porque TCP pode ser conversor serial-Ethernet e o valor ainda documenta a origem.
- se `ovrDataBits`, `ovrStopBits` vierem fora do range, rejeitar.
- em `update`, montar `estado = { ...atual, ...data }` antes de validar, para alterações parciais como `portaTcp`, `modbusUnitId`, `modbusRegister`, `ovrDataBits` ou `ovrStopBits` nao escaparem da regra.
- chamar a validacao sempre que qualquer campo de conexao/protocolo/Modbus/override serial relevante vier no payload, nao apenas `protocolo`, `porta` ou `enderecoIp`.
- manter a decisao de conflito de porta global por maquina e documentar em teste, porque uma porta COM fisica nao pode ser usada por duas balancas ativas no mesmo host.

- [ ] **Step 4: Rodar testes backend de balanca**

Run:

```bash
pnpm --filter ./backend test balanca --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/balanca/dto backend/src/balanca/*.spec.ts backend/src/balanca/balanca.service.ts
git commit -m "feat: expose scale serial overrides in balanca api"
```

### Task 2: Adicionar modo de leitura e comando configuravel

**Files:**

- Modify: `backend/src/prisma/schema.prisma`
- Create: `backend/src/prisma/migrations/<timestamp>_balanca_read_command/migration.sql`
- Modify: `backend/src/balanca/dto/create-balanca.dto.ts`
- Modify: `backend/src/balanca/dto/update-balanca.dto.ts`
- Modify: `backend/src/balanca/presets.ts`
- Modify: `backend/src/indicadores/indicador.service.ts`
- Create/Modify: `backend/src/indicadores/dto/create-indicador.dto.ts`
- Create/Modify: `backend/src/indicadores/dto/update-indicador.dto.ts`
- Modify: `backend/src/indicadores/wizard.controller.ts`
- Modify: `backend/src/balanca/config-resolver.ts`
- Modify: `backend/src/balanca/balanca-connection.service.ts`
- Modify: `backend/src/balanca/capture-raw.service.ts`
- Test: `backend/src/balanca/config-resolver.spec.ts`
- Test: `backend/src/balanca/balanca-connection-effective-config.spec.ts`
- Test: `backend/src/balanca/dto/dto-validation.spec.ts`
- Test: `backend/src/indicadores/indicador.service.spec.ts`

- [ ] **Step 1: Escrever teste para config efetiva com polling**

Em `config-resolver.spec.ts`, adicionar:

```ts
it('resolve modo request-response e comando de leitura por override da balanca', () => {
  const cfg = resolveEffectiveConfig(
    {
      ...baseBalanca,
      readMode: 'polling',
      readCommandHex: '05',
      readIntervalMs: 500,
      readTimeoutMs: 2000,
    } as any,
    { ...indToledo, readMode: 'continuous', readCommandHex: null } as any,
  );
  expect(cfg.read).toMatchObject({
    mode: 'polling',
    commandHex: '05',
    intervalMs: 500,
    timeoutMs: 2000,
  });
});
```

Expected: FAIL.

- [ ] **Step 2: Criar migration**

Adicionar colunas em `indicador_pesagem`:

```sql
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_mode" TEXT NOT NULL DEFAULT 'continuous';
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_command_hex" TEXT;
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_interval_ms" INTEGER;
ALTER TABLE "indicador_pesagem" ADD COLUMN "read_timeout_ms" INTEGER;
```

Adicionar colunas em `balanca`:

```sql
ALTER TABLE "balanca" ADD COLUMN "read_mode" TEXT;
ALTER TABLE "balanca" ADD COLUMN "read_command_hex" TEXT;
ALTER TABLE "balanca" ADD COLUMN "read_interval_ms" INTEGER;
ALTER TABLE "balanca" ADD COLUMN "read_timeout_ms" INTEGER;
```

Backfill obrigatorio para manter compatibilidade com modelos que hoje dependem de `parserPrecisaEnq()`:

```sql
UPDATE "indicador_pesagem"
SET
  "read_mode" = 'polling',
  "read_command_hex" = '05',
  "read_interval_ms" = COALESCE("atraso", 500),
  "read_timeout_ms" = 2000
WHERE lower("parser_tipo") IN ('toledo-c', 'filizola-at', 'filizola-@');
```

Adicionar teste/smoke de upgrade para garantir que um banco com indicador Toledo C existente passa a ter `read_mode='polling'`.

- [ ] **Step 3: Atualizar Prisma schema**

Em `IndicadorPesagem`:

```prisma
readMode       String  @default("continuous") @map("read_mode")
readCommandHex String? @map("read_command_hex")
readIntervalMs Int?    @map("read_interval_ms")
readTimeoutMs  Int?    @map("read_timeout_ms")
```

Em `Balanca`:

```prisma
readMode       String? @map("read_mode")
readCommandHex String? @map("read_command_hex")
readIntervalMs Int?    @map("read_interval_ms")
readTimeoutMs  Int?    @map("read_timeout_ms")
```

- [ ] **Step 4: Atualizar presets**

Para Toledo Protocolo C e Filizola `@`:

```ts
read: { mode: 'polling', commandHex: '05', intervalMs: 500, timeoutMs: 2000 }
```

Para streaming:

```ts
read: { mode: 'continuous', commandHex: null, intervalMs: null, timeoutMs: 2000 }
```

Atualizar tambem `PresetBalanca`:

```ts
export interface ReadConfigPreset {
  mode: 'continuous' | 'polling' | 'manual';
  commandHex: string | null;
  intervalMs: number | null;
  timeoutMs: number;
}

export interface PresetBalanca {
  // campos existentes...
  read?: ReadConfigPreset;
}
```

Em `IndicadorService.seedBuiltins`, persistir `p.read` nos novos campos. Para presets sem `read`, usar `continuous/null/null/2000`.

- [ ] **Step 5: Resolver config efetiva**

Adicionar em `ConfigEfetiva`:

```ts
read: {
  mode: 'continuous' | 'polling' | 'manual';
  commandHex: string | null;
  intervalMs: number;
  timeoutMs: number;
}
```

Regra:

- balanca override prevalece.
- indicador vem depois.
- default: continuous, command null, interval 500, timeout 2000.
- validar `commandHex` com regex `^([0-9a-fA-F]{2})+$` apos remover espacos.
- se `readMode` for `polling` sem `commandHex`, retornar `continuous` ou rejeitar na validacao de service/DTO; preferir rejeitar em payload salvo e ser tolerante apenas para dados legados.
- manter helper pequeno, por exemplo `normalizarCommandHex(value)`, que remove espacos, upper-caseia e retorna `null` quando vazio.

Adicionar aos DTOs de balanca e indicador. Importar `Matches` junto com os validadores ja usados:

```ts
@ApiPropertyOptional({ enum: ['continuous', 'polling', 'manual'] })
@IsOptional()
@IsIn(['continuous', 'polling', 'manual'])
readMode?: 'continuous' | 'polling' | 'manual';

@ApiPropertyOptional({ example: '05' })
@IsOptional()
@IsString()
@Matches(/^([0-9a-fA-F]{2}\s*)+$/)
readCommandHex?: string | null;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(200)
readIntervalMs?: number | null;

@ApiPropertyOptional()
@IsOptional()
@IsInt()
@Min(200)
readTimeoutMs?: number | null;
```

- [ ] **Step 6: Substituir hard-code de ENQ**

Em `BalancaConnectionService.iniciarPollingComando`, usar `config.read`:

```ts
if (config.read.mode !== 'polling' || !config.read.commandHex || !conexao.adapter.write) return;
const command = Buffer.from(config.read.commandHex.replace(/\s+/g, ''), 'hex');
const enviar = () => conexao.adapter.write?.(command).catch(() => undefined);
enviar();
conexao.comandoTimer = setInterval(enviar, Math.max(config.read.intervalMs, 200));
```

Aplicar a mesma configuracao em `BalancaConnectionService.testar()`. O teste de conexao nao pode continuar enviando ENQ hard-coded quando `config.read.commandHex` for outro comando.

Manter `parserPrecisaEnq()` apenas como fallback deprecated:

```ts
const legacyNeedsEnq = this.parserPrecisaEnq(config.parser.parserTipo);
const commandHex = config.read.commandHex ?? (legacyNeedsEnq ? '05' : null);
const readMode = config.read.mode === 'polling' || legacyNeedsEnq ? 'polling' : config.read.mode;
```

Adicionar teste cobrindo:

- `read.mode='polling'` envia `read.commandHex`.
- `testar()` envia o mesmo comando configurado.
- `parserTipo='toledo-c'` sem campos `read_*` ainda envia `05` via fallback.
- `read.mode='continuous'` com parser comum nao escreve comando.

- [ ] **Step 7: Captura raw com comando customizado**

Em `CaptureRequest`, adicionar:

```ts
commandHex?: string;
commandIntervalMs?: number;
```

Regra:

- `commandHex` prevalece sobre `enviarEnq`.
- validar hex par antes de abrir serial/TCP.
- se `commandIntervalMs` vier, reenviar ate terminar a captura; minimo 200ms.
- manter `enviarEnq` como atalho de compatibilidade para `commandHex='05'`.

- [ ] **Step 8: Rodar Prisma e testes**

Run:

```bash
pnpm --filter ./backend db:generate
pnpm --filter ./backend test config-resolver balanca-connection-effective-config dto-validation indicador.service --runInBand
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/prisma backend/src/balanca backend/src/indicadores
git commit -m "feat: support configurable scale read commands"
```

### Task 3: Expor endpoint de configuracao efetiva

**Files:**

- Modify: `backend/src/balanca/balanca.service.ts`
- Modify: `backend/src/balanca/balanca.controller.ts`
- Test: `backend/src/balanca/balanca.service.spec.ts`
- Test: `backend/src/balanca/balanca.controller.spec.ts` (se houver padrao local)

- [ ] **Step 1: Criar metodo service**

Adicionar:

```ts
type OrigemConfig = 'balanca' | 'indicador' | 'default';

function origem<T>(
  balancaValue: T | null | undefined,
  indicadorValue: T | null | undefined,
): OrigemConfig {
  if (balancaValue != null) return 'balanca';
  if (indicadorValue != null) return 'indicador';
  return 'default';
}

async effectiveConfig(id: string, tenantId: string) {
  const balanca = await this.prisma.balanca.findFirst({
    where: { id, tenantId },
    include: { indicador: true },
  });
  if (!balanca) throw new NotFoundException('Balanca nao encontrada');
  const config = resolveEffectiveConfig(balanca, balanca.indicador);
  return {
    config,
    origem: {
      protocolo: origem(balanca.protocolo, balanca.indicador?.protocolo),
      serial: {
        baudRate: origem(balanca.baudRate, balanca.indicador?.baudrate),
        dataBits: origem(balanca.ovrDataBits, balanca.indicador?.databits),
        parity: origem(balanca.ovrParity, balanca.indicador?.parity),
        stopBits: origem(balanca.ovrStopBits, balanca.indicador?.stopbits),
        flowControl: origem(balanca.ovrFlowControl, balanca.indicador?.flowControl),
      },
      parser: {
        parserTipo: origem(balanca.ovrParserTipo, balanca.indicador?.parserTipo),
        inicioPeso: origem(balanca.ovrInicioPeso, balanca.indicador?.inicioPeso),
        tamanhoPeso: origem(balanca.ovrTamanhoPeso, balanca.indicador?.tamanhoPeso),
        tamanhoString: origem(balanca.ovrTamanhoString, balanca.indicador?.tamanhoString),
        marcador: origem(balanca.ovrMarcador, balanca.indicador?.marcador),
        fator: origem(balanca.ovrFator, balanca.indicador?.fator),
        invertePeso: origem(balanca.ovrInvertePeso, balanca.indicador?.invertePeso),
      },
      read: {
        mode: origem(balanca.readMode, balanca.indicador?.readMode),
        commandHex: origem(balanca.readCommandHex, balanca.indicador?.readCommandHex),
        intervalMs: origem(balanca.readIntervalMs, balanca.indicador?.readIntervalMs),
        timeoutMs: origem(balanca.readTimeoutMs, balanca.indicador?.readTimeoutMs),
      },
    },
  };
}
```

Incluir tambem origem para Modbus e endereco se a UI for exibir esses grupos na mesma tabela. Se `findAll/findOne` precisarem mostrar o indicador na lista, adicionar `include: { empresa: true, unidade: true, indicador: true }` sem quebrar mapper existente.

- [ ] **Step 2: Expor rota**

Preferir `GET /api/balancas/:id/effective-config` no `BalancaController`, pois é uma balanca especifica, nao config global.

```ts
@Get(':id/effective-config')
@Roles(Permissao.CONFIG_GERENCIAR)
@ApiOperation({ summary: 'Mostra configuracao efetiva da balanca e origem de cada campo' })
effectiveConfig(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
  return this.balancaService.effectiveConfig(id, tenantId);
}
```

- [ ] **Step 3: Testar tenant safety**

Adicionar teste: balanca de outro tenant retorna NotFound. Nao retornar Forbidden com detalhe, para nao vazar existencia cross-tenant.

- [ ] **Step 4: Rodar testes**

```bash
pnpm --filter ./backend test balanca.service.spec.ts --runInBand
```

Expected: PASS.

### Task 4: Atualizar tipos e mappers frontend

**Files:**

- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api/balanca.ts`
- Modify: `frontend/src/lib/api/mappers.ts`
- Modify: `frontend/src/lib/api/balanca-config.ts`
- Test: `frontend/src/app/(authenticated)/cadastros/balancas/__tests__/balanca-mapper.test.ts`

- [ ] **Step 1: Criar teste de mapper/payload**

Testar que `Partial<Balanca>` com overrides gera payload:

```ts
expect(
  mapBalancaPayload({
    tipoConexao: 'SERIAL',
    baudRate: 4800,
    ovrDataBits: 7,
    ovrParity: 'E',
    ovrStopBits: 2,
    ovrFlowControl: 'NONE',
    ovrParserTipo: 'generic',
    ovrInicioPeso: 1,
    ovrTamanhoPeso: 6,
    ovrMarcador: 13,
    readMode: 'polling',
    readCommandHex: '05',
  }),
).toMatchObject({
  protocolo: 'serial',
  baudRate: 4800,
  ovrDataBits: 7,
  ovrParity: 'E',
  readMode: 'polling',
  readCommandHex: '05',
});
```

Adicionar caso de limpeza:

```ts
expect(
  mapBalancaPayload({
    ovrDataBits: null,
    ovrParity: null,
    readCommandHex: null,
  } as Partial<Balanca>),
).toMatchObject({
  ovrDataBits: null,
  ovrParity: null,
  readCommandHex: null,
});
```

Preferir mover para `frontend/src/lib/api/balanca-payload.ts` e exportar `mapBalancaPayload`; isso evita `_test_*` em modulo de API de producao.

- [ ] **Step 2: Expandir `Balanca`**

Adicionar camelCase e snake_case quando ja houver compat legada:

```ts
baudRate?: number;
baud_rate?: number;
ovrDataBits?: number;
ovr_data_bits?: number;
ovrParity?: string;
ovr_parity?: string;
ovrStopBits?: number;
ovr_stop_bits?: number;
ovrFlowControl?: string;
ovr_flow_control?: string;
ovrParserTipo?: string;
ovr_parser_tipo?: string;
ovrInicioPeso?: number;
ovr_inicio_peso?: number;
ovrTamanhoPeso?: number;
ovr_tamanho_peso?: number;
ovrTamanhoString?: number;
ovr_tamanho_string?: number;
ovrMarcador?: number;
ovr_marcador?: number;
ovrInvertePeso?: boolean;
ovr_inverte_peso?: boolean;
ovrAtraso?: number;
ovr_atraso?: number;
toleranciaEstabilidade?: number;
janelaEstabilidade?: number;
debugMode?: boolean;
readMode?: 'continuous' | 'polling' | 'manual';
read_mode?: 'continuous' | 'polling' | 'manual';
readCommandHex?: string;
read_command_hex?: string;
readIntervalMs?: number;
read_interval_ms?: number;
readTimeoutMs?: number;
read_timeout_ms?: number;
```

Expandir tambem `IndicadorPesagem`/`IndicadorBalanca` com `readMode`, `readCommandHex`, `readIntervalMs`, `readTimeoutMs`, `builtin`, `descricao`, `ativo`, `exemploTrama`, `notas` e `cor` quando o CRUD visual consumir esses campos.

- [ ] **Step 3: Atualizar mapper response**

Mapear `raw.baudRate`, `raw.ovrDataBits`, `raw.readMode`, etc. Manter tanto camelCase quanto snake_case quando o tipo ja tiver compatibilidade legada. Corrigir tambem a lista de balancas para receber `indicador` quando o backend passar `include`.

- [ ] **Step 4: Atualizar payload**

Enviar todos os campos no POST/PATCH, filtrando `undefined` e string vazia. Nao filtrar `null`, porque `null` é a operacao de "usar valor do indicador" para overrides.

Implementar helper:

```ts
function limparPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  );
}
```

- [ ] **Step 5: Rodar typecheck frontend**

```bash
pnpm --filter ./frontend typecheck
```

Expected: PASS.

### Task 5: Redesenhar tela de Balancas em abas

**Files:**

- Modify: `frontend/src/app/(authenticated)/cadastros/balancas/page.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaList.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaEditorDialog.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaGeralTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaComunicacaoTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaProtocoloTab.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaConfigEfetiva.tsx`

- [ ] **Step 1: Extrair lista atual sem mudar comportamento**

Mover tabela, busca, paginacao, botoes editar/excluir para `BalancaList.tsx`.

- [ ] **Step 2: Criar editor com Tabs**

Usar componente existente de tabs se houver (`frontend/src/components/ui/tabs.tsx`). Abas:

1. **Geral**
   - Nome
   - Unidade
   - Indicador de Pesagem
   - Direcao: Entrada, Saida, Ambos, Nao definido (`tipoEntradaSaida`)
   - Ativa
2. **Comunicacao**
   - Tipo: Serial RS-232/RS-485, TCP/IP, Modbus RTU, Modbus TCP
   - Serial: porta, baudRate, dataBits, parity, stopBits, flowControl
   - TCP: host/IP, porta TCP
   - Modbus: unitId, register, function, byte/word order, signed, scale, offset
   - Modo leitura: continuous/polling/manual, comando hex, intervalo, timeout
3. **Protocolo**
   - Preset/indicador atual
   - Overrides de parser
   - Botao "Criar protocolo desconhecido"
   - Preview da configuracao efetiva
4. **Diagnostico**
   - Testar conexao
   - Capturar bytes raw
   - Testar parser nos bytes
   - Ativar debugMode
5. **Calibracao**
   - Reusar `AjusteLeituraSection`
   - Reusar `CalibracaoSection`

- [ ] **Step 3: Preservar ergonomia**

Nao colocar cards dentro de cards. O dialog pode ter um header e as abas; cada aba usa grupos com bordas leves e grid responsivo.

- [ ] **Step 4: Salvar parcial**

Permitir salvar balanca mesmo sem teste fisico, mas destacar "Nao testada" no status quando nunca houve leitura.

- [ ] **Step 5: Rodar app e checar visual**

```bash
pnpm dev:frontend
```

Verificar em:

```text
http://127.0.0.1:3000/cadastros/balancas
```

Expected: lista carrega, editar abre dialog com abas, campos atuais preenchidos.

### Task 6: Integrar wizard de protocolo desconhecido

**Files:**

- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/IndicadorWizardDialog.tsx`
- Modify: `frontend/src/components/balanca/BalancaConfigWizard.tsx`
- Modify: `frontend/src/lib/api/indicador.ts`
- Modify: `frontend/src/lib/api/balanca-config.ts`
- Modify: `backend/src/balanca/capture-raw.service.ts`
- Test: `frontend/src/app/(authenticated)/cadastros/balancas/__tests__/IndicadorWizardDialog.test.tsx`

- [ ] **Step 1: Definir fluxo**

Fluxo do wizard:

1. Escolher meio: serial ou TCP/IP. Modbus fica na aba Comunicacao/Diagnostico, a menos que seja criado endpoint especifico de leitura Modbus no backend.
2. Informar parametros de comunicacao.
3. Capturar bytes por 1-5 segundos.
4. Opcional: enviar comando hex (`05` para ENQ, outro para fabricante desconhecido).
5. Mostrar bytes em hex e ASCII.
6. Rodar auto-detect.
7. Se detectado: aplicar candidato.
8. Se nao detectado: abrir configurador generic.
9. Testar parser.
10. Salvar como novo indicador customizado.
11. Aplicar indicador na balanca atual.

- [ ] **Step 2: Captura com comando customizado**

Extender request:

```ts
{
  protocolo: 'serial' | 'tcp',
  endereco: string,
  serial?: SerialConfig,
  durationMs: number,
  enviarEnq?: boolean,
  commandHex?: string,
  commandIntervalMs?: number
}
```

No backend, `commandHex` prevalece sobre `enviarEnq`.

- [ ] **Step 3: Criar configurador generic**

Campos:

- `parserTipo`: default `generic`
- `inicioPeso`
- `tamanhoPeso`
- `tamanhoString`
- `marcador`
- `fator`
- `invertePeso`
- `readMode`
- `readCommandHex`
- `readIntervalMs`

Botao "Testar nos bytes capturados" chama `/indicadores/wizard/test-config` ou `/balanca/config/test-parser-on-bytes`.

- [ ] **Step 4: Criar indicador customizado**

Usar `/indicadores/wizard/criar`, sem enviar `tenantId` no body. O backend deve obter tenant do JWT.

Atualizar `frontend/src/lib/api/indicador.ts`:

```ts
export async function criarFromWizard(input: {
  fabricante: string;
  modelo: string;
  descricao?: string;
  protocolo: 'serial' | 'tcp' | 'modbus';
  serial: SerialConfig;
  parserTipo: string;
  inicioPeso?: number;
  tamanhoPeso?: number;
  tamanhoString?: number;
  marcador?: number;
  fator?: number;
  invertePeso?: boolean;
  atraso?: number;
  readMode?: 'continuous' | 'polling' | 'manual';
  readCommandHex?: string | null;
  readIntervalMs?: number | null;
  readTimeoutMs?: number | null;
  bytesCapturados?: string;
  notas?: string;
}) {
  const res = await apiClient.post('/indicadores/wizard/criar', input);
  return res.data as IndicadorBalanca;
}
```

Remover `tenantId` das props do wizard existente `WizardProtocoloDesconhecido`; nenhum componente frontend deve montar tenant manualmente para esses calls.

- [ ] **Step 5: Aplicar indicador a balanca**

Depois de criar indicador, setar:

```ts
setForm((f) => ({
  ...f,
  indicadorId: indicador.id,
  tipoConexao:
    indicador.protocolo === 'tcp'
      ? 'TCP'
      : indicador.protocolo === 'modbus'
        ? 'MODBUS_RTU'
        : 'SERIAL',
}));
```

Nao sobrescrever porta/IP ja digitados.

Ao aplicar indicador, copiar `read*` para a balanca somente se o tecnico marcar explicitamente "usar comando do indicador como override local". O caminho principal deve vincular o indicador e deixar a configuracao efetiva herdar dele.

### Task 7: CRUD completo de Indicadores

**Files:**

- Modify: `frontend/src/app/(authenticated)/cadastros/indicadores/page.tsx`
- Create: `frontend/src/app/(authenticated)/cadastros/indicadores/components/IndicadorEditorDialog.tsx`
- Modify: `frontend/src/lib/api/indicador.ts`
- Create/Modify: `backend/src/indicadores/dto/create-indicador.dto.ts`
- Create/Modify: `backend/src/indicadores/dto/update-indicador.dto.ts`
- Modify: `backend/src/indicadores/indicador.controller.ts`
- Modify: `backend/src/indicadores/indicador.service.ts`
- Test: `backend/src/indicadores/dto/dto-validation.spec.ts`
- Test: `backend/src/indicadores/indicador.service.spec.ts`
- Test: `frontend/src/app/(authenticated)/cadastros/indicadores/__tests__/IndicadorEditorDialog.test.tsx`

- [ ] **Step 1: Transformar lista readonly em CRUD**

Manter coluna `builtin`. Para builtin:

- permitir "Duplicar como customizado".
- evitar delete.
- nao editar builtin na UI por padrao. Se for necessario permitir edicao de builtin, isso deve virar decisao explicita e teste de auditoria, porque altera preset global daquele tenant.
- remover `tenantId` manual de `listIndicadores`, `seedBuiltins` e `criarFromWizard`; o backend ja usa `CurrentUser('tenantId')`.

Criar DTOs backend de indicador antes de liberar CRUD visual. Nao usar `IndicadorInput` como tipo de `@Body()`, pois interface TypeScript nao valida em runtime.

- [ ] **Step 2: Editor de indicador**

Campos:

- Fabricante
- Modelo
- Descricao
- Protocolo
- Serial defaults
- Parser config
- Modo de leitura/comando
- Exemplo trama
- Notas
- Cor

Campos de modo de leitura:

- `readMode`
- `readCommandHex`
- `readIntervalMs`
- `readTimeoutMs`

Adicionar acao "Duplicar como customizado" que envia os campos do builtin para `POST /indicadores` com `builtin=false` no service, sem mandar `tenantId`.

- [ ] **Step 3: Integrar com balanca**

Da tela de balancas, o botao "Gerenciar indicadores" abre a rota `/cadastros/indicadores` em nova navegacao normal.

### Task 8: Diagnostico unificado da balanca

**Files:**

- Create: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaDiagnosticoTab.tsx`
- Modify: `frontend/src/lib/api/balanca-config.ts`
- Modify: `frontend/src/lib/api/balanca.ts`
- Modify: `backend/src/balanca/balanca.controller.ts`
- Modify: `backend/src/balanca/presets.controller.ts`
- Modify: `docs/runbooks/CADASTRO-BALANCA.md`

- [ ] **Step 1: Estado de conexao**

Mostrar:

- online/offline/erro
- ultima leitura
- ultima leitura em
- ultima conexao
- ultima mensagem de erro
- botao conectar/desconectar
- botao testar por 2s
- link/estado da configuracao efetiva usando `GET /balancas/:id/effective-config`

- [ ] **Step 2: Captura raw**

Campos:

- duracao
- comando hex opcional
- enviar ENQ shortcut
- resultado: count, hex, ASCII, bytes anotados

Usar `commandHex` quando preenchido; `enviarEnq` deve apenas preencher/enviar `05`.

- [ ] **Step 3: Teste parser**

Usar config efetiva ou override temporario para testar sem salvar.

Adicionar helper de API para `/balanca/config/test-parser-on-bytes` com `tamanhoString`, `read*` apenas como metadados de UI; parser test nao deve abrir porta nem executar polling.

- [ ] **Step 4: Debug log**

`debugMode` liga dump em `logs/balanca-<id>.log`. Expor texto curto com caminho relativo redigido pelo backend, sem vazar usuario Windows se possivel.

Nao retornar caminho absoluto em endpoint publico. Retornar algo como:

```ts
{ enabled: true, relativePath: 'logs/balanca-<id>.log' }
```

Se a UI precisar abrir arquivo no desktop, isso deve ser feito por canal Electron controlado, fora da API HTTP.

### Task 9: Validacao de UX e regras de negocio

**Files:**

- Modify: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaComunicacaoTab.tsx`
- Modify: `frontend/src/app/(authenticated)/cadastros/balancas/components/BalancaProtocoloTab.tsx`
- Modify: `backend/src/balanca/balanca.service.ts`
- Test: `backend/src/balanca/balanca.service.spec.ts`

- [ ] **Step 1: Regras por tipo**

Serial/Modbus RTU:

- exige porta.
- recomenda baud/data/parity/stop.

TCP/Modbus TCP:

- exige host e porta.
- aceita serial config como metadata quando for conversor serial-Ethernet.

Modbus:

- exige unitId e register.
- function default `holding`.
- scale default `1`, offset default `0`.

Modo de leitura:

- `continuous`: ignora `readCommandHex`.
- `polling`: exige `readCommandHex` hex par valido.
- `manual`: salva comando, mas nao inicia timer automatico.
- `readIntervalMs` minimo 200ms.
- `readTimeoutMs` minimo 200ms.

- [ ] **Step 2: Conflitos**

Conflito de porta serial deve continuar global por processo desktop e `ativo=true`, porque a mesma porta COM fisica nao pode ser aberta por duas balancas ativas no mesmo host, ainda que os registros sejam de tenants diferentes. Registrar essa decisao no teste e na mensagem de erro.

Adicionar teste de update parcial:

- balanca atual `serial` com `porta='COM3'`;
- update envia apenas `porta: 'COM4'` e valida conflito;
- update envia apenas `portaTcp` quando protocolo final é TCP e valida host+porta;
- update envia apenas `ovrDataBits: 9` e rejeita.

- [ ] **Step 3: Reset de override**

Cada override deve ter "Usar valor do indicador" para setar `null`. O payload precisa permitir limpar campo, nao apenas omitir.

Implementar helper de payload que preserva `null`.

Adicionar teste frontend e backend garantindo que `PATCH /balancas/:id` com `{ ovrParity: null }` persiste `null` e a configuracao efetiva passa a herdar `indicador.parity`.

### Task 10: Auditoria e permissao

**Files:**

- Modify: `backend/src/balanca/balanca.service.ts`
- Modify: `backend/src/common/interceptors/audit.interceptor.ts` se necessario
- Modify: `docs/MATRIZ-PERMISSOES.md`
- Test: `backend/src/balanca/balanca.service.spec.ts`

- [ ] **Step 1: Eventos auditaveis**

Auditar:

- criar balanca
- alterar comunicacao
- alterar parser/protocolo
- ligar/desligar debug
- criar indicador customizado
- excluir indicador
- calibrar

- [ ] **Step 2: PII/log safety**

IP/porta de balanca nao é PII critica, mas paths de logs podem conter usuario Windows. Redigir caminhos quando exibidos no frontend.

- [ ] **Step 3: Permissoes**

Confirmar que tudo sensivel usa `CONFIG_GERENCIAR`.

Endpoints que devem exigir `CONFIG_GERENCIAR`:

- `POST /balanca/config/capture-raw`
- `POST /balanca/config/capture-and-detect`
- `POST /balanca/config/auto-detect`
- `POST /balanca/config/test-parser-on-bytes`
- `POST /balanca/config/discover`
- `POST /indicadores/wizard/annotate-bytes`
- `POST /indicadores/wizard/test-config`
- `POST /indicadores/wizard/criar`
- `POST/PUT/DELETE /indicadores`
- `GET /balancas/:id/effective-config`

Leitura simples de presets e serial-options pode continuar apenas autenticada se nao abrir hardware nem gerar trafego.

### Task 11: Documentacao de campo

**Files:**

- Create: `docs/runbooks/CADASTRO-BALANCA.md`
- Modify: `docs/HARDWARE-COMPATIBILITY.md`
- Modify: `docs/FERRAMENTAS-TESTE.md`

- [ ] **Step 1: Runbook**

Criar seções:

- Como cadastrar uma balanca Toledo/Filizola comum.
- Como configurar RS-232/RS-485.
- Como configurar conversor TCP/IP.
- Como configurar Modbus RTU/TCP.
- Como diagnosticar sem leitura.
- Como criar protocolo desconhecido.
- Como usar ENQ/comando polling.
- Como calibrar e validar peso.

- [ ] **Step 2: Matriz de fabricantes**

Atualizar tabela com:

- fabricante
- modelo
- protocolo
- serial default
- parser
- modo leitura
- comando
- observacoes

### Task 12: Verificacao final

**Files:** todos acima.

- [ ] **Step 1: Backend fast suite**

```bash
pnpm --filter ./backend test balanca --runInBand
pnpm --filter ./backend test indicadores --runInBand
pnpm --filter ./backend test dto-validation --runInBand
pnpm --filter ./backend typecheck
```

Expected: PASS.

- [ ] **Step 2: Frontend checks**

```bash
pnpm --filter ./frontend typecheck
pnpm --filter ./frontend test -- --runInBand
```

Expected: PASS.

- [ ] **Step 3: Manual browser verification**

Com dev server aberto:

```bash
pnpm dev:backend
pnpm dev:frontend
```

Verificar:

- Login.
- `/cadastros/balancas`.
- Criar balanca serial 9600/8/N/1.
- Editar para 4800/7/E/2.
- Salvar.
- Reabrir e conferir campos.
- Ver configuracao efetiva.
- Testar conexao sem hardware deve falhar com erro compreensivel.
- Criar indicador customizado via wizard usando bytes colados.
- Aplicar indicador na balanca.
- Criar/editar balanca Toledo C e conferir que `readMode=polling` envia comando `05`.
- Limpar override com "Usar valor do indicador", reabrir e conferir que o campo voltou herdado.
- Rodar captura raw com `commandHex` customizado e confirmar que `enviarEnq` ainda funciona como atalho.

- [ ] **Step 4: Build proporcional**

```bash
pnpm build:backend
pnpm build:frontend
```

Expected: PASS.

---

## Ordem Recomendada de Entrega

1. Contrato backend dos campos existentes, validacao de update combinado e mappers frontend com `null`.
2. UI minima de comunicacao serial persistente e overrides no cadastro de balanca.
3. Modo/comando de leitura configuravel com migration, backfill e fallback de ENQ.
4. Endpoint e UI de configuracao efetiva.
5. Captura raw com comando customizado e diagnostico unificado.
6. Wizard integrado para protocolo desconhecido, sem `tenantId` manual.
7. CRUD completo de indicadores com DTO runtime.
8. Auditoria, permissoes, docs e verificacao manual.

Essa ordem entrega valor rapido: primeiro resolve a dor atual de configurar velocidade/paridade/bits/stop bits, depois troca a camada de polling/ENQ com backfill seguro e entao torna a configuracao efetiva completa visivel.

## Riscos

- **Schema atual vs migrations:** ja houve divergencia em `balanca.tenant_id` no ambiente local. Ao criar migration nova, rodar smoke de upgrade em SQLite limpo e em banco existente.
- **Limpeza de overrides:** payload atual remove strings vazias e `undefined`; para limpar override precisa enviar `null`.
- **Backfill de ENQ:** sem update dos indicadores existentes, Toledo C/Filizola `@` podem parar de ler ao trocar para `readMode`.
- **DTO de indicador:** controller atual usa interface em `@Body()`; CRUD completo sem DTO real reduz a eficacia do `ValidationPipe`.
- **Permissao de diagnostico:** endpoints de auto-detect/anotacao/teste geram informacao tecnica e/ou trafego; precisam de `CONFIG_GERENCIAR`.
- **Token em memoria:** navegação direta recarrega e perde token; para testes manuais, navegar pelo menu ou melhorar auth depois. Fora do escopo deste plano, mas afeta verificacao.
- **Hardware real:** testes automatizados devem mockar serial/modbus; validacao final com balanca real precisa runbook de campo.

## Fora de Escopo Inicial

- Execução de codigo de parser customizado definido pelo usuario.
- Compra/instalacao automatica de drivers seriais.
- Calibracao metrologica oficial com lacre/inmetro.
- Suporte a todos os tipos numericos Modbus exoticos; V1 cobre int16/int32/float32 se adicionado, ou os campos atuais signed/scale/offset se mantido simples.
