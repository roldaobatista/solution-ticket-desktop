# Auditoria 03: Hardware/Balança (serialport + modbus-serial)

**Data:** 2026-04-25 | **Auditor:** Claude (Haiku 4.5) | **Escopo:** `backend/src/balanca/` + `backend/src/camera/`

---

## Resumo Executivo

Analisados **30 arquivos fonte** (adapters, parsers, services) + **21 testes unitários**.

**Severidade:**

- **CRITICAL:** 2 findings
- **HIGH:** 5 findings
- **MEDIUM:** 4 findings

**Cobertura de testes:** 14 dos 30 parsers/adapters têm testes (47%). Faltam testes e2e para múltiplas balanças simultâneas.

---

## Top 3 Findings

### 1. **CRITICAL: Modbus parser sem validação CRC**

- **Arquivo:** `backend/src/balanca/parsers/modbus.parser.ts:1–57`
- **Descrição:** Parser Modbus não implementa cálculo ou verificação de CRC-16/CCITT. Modbus RTU requer CRC em cada frame; sem validação, frames corrompidos passam silenciosamente.
- **Risco:** Corrupção de dados de pesagem sem detecção.

### 2. **CRITICAL: ReconnectingAdapter sem idempotência em flush**

- **Arquivo:** `backend/src/balanca/adapters/reconnecting.adapter.ts:73–112`
- **Descrição:** Método `agendarReconexao()` privado não possui guard contra chamadas concorrentes. Se `inner.close()` dispara 'close' enquanto `setTimeout` está agendando, múltiplas reconexões são disparadas.
- **Risco:** Dupla tentativa de conexão, buffer overflow, contenção de porta serial.

### 3. **HIGH: BalancaConnectionService sem mutex em operações concorrentes**

- **Arquivo:** `backend/src/balanca/balanca-connection.service.ts:108–244`
- **Descrição:** Múltiplas balanças podem chamar `processarChunk()` simultaneamente sem lock. Race condition em `conexao.buffer.concat()` + `parser.parse()`.
- **Risco:** Leitura parcial de frame; peso duplicado ou perdido em carga alta.

---

## Findings por Severidade

**CRITICAL (2):** Modbus CRC missing, ReconnectingAdapter race
**HIGH (5):** Serial timeout missing, Toledo checksum missing, Modbus slave ID missing, Camera offline handling, BalancaConnectionService mutex
**MEDIUM (4):** Buffer unbounded growth, Generic marcador unvalidated, Buffer trim hardcoded 4KB, TCP keepalive missing

---

## Cobertura de Testes

- Parsers com testes: 14 de 30 (47%)
- Adapters com testes: 5 de 7 (71%)
- Faltam: e2e concorrência, fuzzing frames, frame parcial/corrompido

---

## Recomendações Imediatas

1. Implementar CRC-16 em Modbus parser
2. Adicionar mutex/lock em BalancaConnectionService.processarChunk()
3. Guard em ReconnectingAdapter.agendarReconexao() contra calls concorrentes
4. Testes de frame corrompido/parcial para todos os parsers

## Status pós-Sprint 1 (2026-04-25)

- **H1 (CRITICAL — CRC Modbus): NÃO-APLICÁVEL.** ModbusParser não recebe frames Modbus RTU brutos. O `ModbusAdapter` (`backend/src/balanca/adapters/modbus.adapter.ts`) usa a lib `modbus-serial`, que valida CRC internamente em `readHoldingRegisters()`; só então o valor numérico é injetado no parser via `${valor}\n`. CRC já é responsabilidade da camada anterior, não do parser. Finding rebaixado para "informativo".
- **H2 (CRITICAL — idempotência ReconnectingAdapter): RESOLVIDO** em commit `91f4637`. Guard `if (this.timer) return;` no início de `agendarReconexao()` + teste cobrindo rajada de 3 closes → 1 reconexão.
- **H3 (HIGH — mutex BalancaConnectionService.processarChunk): NÃO-APLICÁVEL no estado atual.** Função é totalmente síncrona; em JS single-thread os callbacks de `'data'` são serializados pelo event loop. Mutex só seria necessário se introduzirmos `await` dentro do loop de parse — revisitar nesse caso.
- **H4.a (smoke parsers):** RESOLVIDO em commit `ab74662`. `backend/scripts/smoke-balanca.ts` cobre 13/13 parsers com frames-amostra (linha de base verificável a cada release).
