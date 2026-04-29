# ADR-018 — Audit Trail Tamper-Evident (hash chain + Object Lock)

**Status**: Aceita
**Data**: 2026-04-27
**Autor**: SRE / Segurança
**Decisores**: CTO, Tech Lead, DPO
**Cross-link**: `docs/integracao/005-seguranca-credenciais.md`, ADR-017, `docs/integracao/RELAY-CLOUD-SECURITY-SPEC.md`

---

## 1. Contexto

A tabela `integracao_log` registra cada evento crítico do módulo (envio para ERP, falha, retry, edição manual, reprocessamento). Três pressões convergem:

1. **Auditoria fiscal**: cliente Enterprise tem obrigação de manter trilha por **5 anos** (norma fiscal/contábil brasileira).
2. **SQLite local é editável**: o arquivo do banco está no PC do cliente. Funcionário interno mal-intencionado pode `UPDATE integracao_log SET status='SENT'` sem deixar rastro.
3. **Defesa em fraude interna**: cenário comum (operador apaga registro de pesagem fora da curva). Sem garantia criptográfica, log local não vale como prova.

Sem solução, a tabela é só "informativa" — não serve de evidência forense.

---

## 2. Decisão

Implementamos **trilha tamper-evident** em três camadas:

### 2.1 Hash chain local

Cada linha de `integracao_log` ganha duas colunas:

- `prev_hash` — `SHA-256` da concatenação canônica das colunas relevantes da linha **anterior** (ordenado por `id`).
- `signature` — `HMAC-SHA256(prev_hash || row_payload, audit_key)`, onde `audit_key` é gravada via DPAPI (escopo `CurrentUser`, ver ADR-016).

Linha 1 (genesis) usa `prev_hash = '0'*64`.

```
linha N:  hash_N = SHA256(prev_hash_N || canonical(row_N))
          sig_N  = HMAC(hash_N, audit_key)
linha N+1.prev_hash = hash_N
```

Qualquer adulteração quebra a cadeia — `audit verify` detecta.

### 2.2 Export para S3 Object Lock a cada ≤24h

Export **diário** (não semanal) — janela de no máximo 24h entre slices.
O desktop exporta o slice incremental, assina com chave RSA do tenant e
envia para bucket S3 com **Object Lock em modo Compliance + retenção
5 anos**. Nem a operadora pode deletar antes do prazo.

**Justificativa para 24h (e não semanal/periódico genérico)**: janela
maior permite truncamento sem detecção. Atacante que comprometa a estação
e tenha acesso à chave HMAC pode reescrever a chain dentro do gap; se o
gap for de 7 dias, ele tem 7 dias de adulteração possível antes do sealed
witness em S3. **Para a trilha valer juridicamente como prova fiscal de
5 anos**, a janela tem que ser pequena o suficiente para que adulteração
seja detectada antes que o ciclo fiscal a consuma. **24h é o teto
aceitável** — qualquer valor maior compromete o valor probatório.

Tradeoff: ~7× mais escritas em S3 vs export semanal. Custo permanece
baixo (~R$ 50/cliente/ano) porque o slice diário é pequeno (≤15 MB).

### 2.3 Sealed-time-witness via relay (a cada hora)

A cada **1 hora** (não 15 min, ajustado para reduzir tráfego), o cliente
envia ao relay o **hash do último registro** + timestamp + tenant_id.

**Diferencial vs S3 Object Lock**: o timestamp do testemunho é o
**timestamp do relay** (servidor cloud, NTP confiável), **não do cliente**.
Isso permite provar que registro X já existia em momento Y mesmo se o
cliente posteriormente adulterar o relógio do sistema operacional.

Cenário típico: atacante interno troca relógio da máquina para data
passada, executa `UPDATE` no SQLite, "ressuscita" registros. A chain local
fica internamente consistente (HMAC válido). Mas o hash que o relay
testemunhou às 14h00 do dia D não bate com a nova chain reescrita — relay
preserva snapshot externo, com timestamp não-falsificável pelo cliente.

Implementação: relay armazena `(tenant_id, hash, relay_ts)` em tabela
append-only com replicação em 2 regiões + recibo assinado HMAC retornado
ao cliente. Cliente guarda recibo localmente para usar em `audit verify`.

### 2.4 Comando de verificação local

```
solution-ticket audit verify [--from <data>] [--to <data>]
```

Recalcula a chain do trecho informado, compara com `signature` armazenada e com recibos do relay. Saída:

- `OK — N registros íntegros`
- `FALHA — quebra na linha X (timestamp Y), divergência em Z`

Operador pode rodar sob demanda; é parte do drill mensal de SRE.

---

## 3. Consequências

### Positivas

- Adulteração interna detectável (defesa contra fraude).
- Recibo do relay cloud serve como **prova externa** (sealed time witness) — útil em disputa fiscal/judicial.
- Object Lock 5 anos atende exigência regulatória sem operação manual.
- Comando `audit verify` permite ao próprio cliente Enterprise auditar.

### Negativas

- **Overhead leitura**: ~5 % em consultas que listam log (cálculo de hash incremental para verificação).
- **Overhead escrita**: ~10 % em insert (HMAC + leitura da linha anterior). Aceitável: log é caminho frio.
- Custo S3 Object Lock: ~R$ 50/cliente/ano (estimado 100 MB/ano comprimido).
- Recovery em quebra: depende do sealed-time-witness do relay para reconstruir confiança a partir do último ponto íntegro.

### Riscos

- **Perda da chave HMAC**: chain quebra para frente. **Mitigação**: rotação anual com período de grace (chain dupla por 30 dias) + backup da chave em DPAPI machine scope (a definir em iteração).
- **Cliente offline > 7 dias**: relay perde testemunhos intermediários. **Mitigação**: aceitar gap, registrar como "low-confidence window" no relatório de verificação.

---

## 4. Alternativas consideradas

| Alternativa                                      | Por que descartado                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| **Apenas log append-only sem hash**              | Não detecta `UPDATE` direto no SQLite.                                     |
| **Blockchain pública (Bitcoin OP_RETURN, etc.)** | Custo + complexidade desproporcional ao caso de uso.                       |
| **Banco externo (PostgreSQL central)**           | Quebra premissa local-first; cliente sem internet ficaria sem audit trail. |
| **Assinatura digital RSA por linha**             | Custo computacional alto (~50× HMAC) sem ganho prático.                    |

---

## 5. Implementação

- Migration: adicionar colunas `prev_hash`, `signature` em `integracao_log`.
- Trigger NestJS no insert (transacional dentro do mesmo lock do outbox).
- Job agendado 15min — push hash ao relay.
- Job semanal — export S3.
- CLI `audit verify` em `keygen/` ou módulo separado.
- Drill mensal incluído em `CHAOS-ENGINEERING-PLAN.md`.

---

## 6. Referências

- ADR-016 — DPAPI escopo CurrentUser
- ADR-017 — Pipeline observabilidade
- `docs/integracao/005-seguranca-credenciais.md`
- `docs/integracao/RELAY-CLOUD-SECURITY-SPEC.md`
- AWS S3 Object Lock — https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- RFC 2104 — HMAC
