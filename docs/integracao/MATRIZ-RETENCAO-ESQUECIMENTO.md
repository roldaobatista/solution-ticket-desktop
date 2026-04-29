# Matriz Retenção × Esquecimento — Integração ERP

**Versão**: 1.0 — 2026-04-27
**Cross-link**: `docs/legal/POLITICA-PRIVACIDADE.md` §9; `docs/integracao/005-seguranca-credenciais.md` §9.

---

## 1. Propósito

Resolver o **conflito retenção fiscal × direito ao esquecimento (LGPD art.
18 VI)**: campos com obrigação de retenção fiscal (5 anos — Decreto
9.580/2018, art. 195 CTN) **não podem ser apagados** mesmo a pedido do
titular, mas campos pessoais associados **podem e devem ser pseudonimizados**
fora do necessário.

Esta matriz é a **fonte canônica** consultada pelo job de retenção
(`backend/src/integracao/retention/retention.service.ts`) e pelo fluxo de
exercício de direitos do titular (Política §7).

---

## 2. Bases legais usadas

| Sigla   | Base legal LGPD                                                                   |
| ------- | --------------------------------------------------------------------------------- |
| **CTR** | Execução de contrato (art. 7º V)                                                  |
| **OBR** | Cumprimento de obrigação legal/regulatória (art. 7º II)                           |
| **LIN** | Legítimo interesse (art. 7º IX)                                                   |
| **CON** | Consentimento (art. 7º I)                                                         |
| **FRA** | Prevenção a fraude / segurança do titular (art. 7º IX combinado com art. 11 II g) |

---

## 3. Matriz por campo

| Campo                                      | Categoria                    | Base legal                         | TTL                                            | Forma de minimização ao expirar                                                                                                  |
| ------------------------------------------ | ---------------------------- | ---------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `cpfMotorista`                             | PII direta                   | CTR + LIN(FRA)                     | 90 dias após pesagem                           | **Pseudonimização**: substituir por `sha256(cpf+salt)[:16]`; salt por tenant; preservar coluna pseudonimizada para reconciliação |
| `nomeMotorista`                            | PII direta                   | CTR                                | 90 dias após pesagem                           | **Apagar** (substituir por `[anonimizado]`)                                                                                      |
| `cnhMotorista`                             | PII sensível                 | CTR + OBR (transporte de carga)    | 5 anos                                         | Manter cifrado; após 5 anos, apagar                                                                                              |
| `placaVeiculo`                             | PII indireta                 | CTR                                | 5 anos (vínculo fiscal)                        | Manter; após 5 anos, apagar                                                                                                      |
| `cnpjCliente`                              | Dado empresarial             | OBR (fiscal)                       | 5 anos                                         | Manter (não é dado pessoal de PF; representante PJ pseudonimizado abaixo)                                                        |
| `cpfRepresentantePJ`                       | PII direta                   | CTR + OBR                          | 5 anos                                         | Após 5 anos, pseudonimizar (sha256 truncado)                                                                                     |
| `nfNumero` / `nfChaveAcesso`               | Doc fiscal                   | OBR                                | 5 anos                                         | Manter; após 5 anos, apagar                                                                                                      |
| `nfValor`                                  | Doc fiscal                   | OBR                                | 5 anos                                         | Manter; após 5 anos, apagar                                                                                                      |
| `nfXmlIntegro`                             | Doc fiscal                   | OBR                                | 5 anos                                         | Manter cifrado; após 5 anos, apagar                                                                                              |
| `ticketId`                                 | Identificador operacional    | CTR                                | Indefinido enquanto ticket existir             | Vinculado ao ticket; segue retenção do ticket-pai                                                                                |
| `pesagemBruto/Tara/Liquido`                | Operacional                  | CTR                                | 5 anos (vínculo fiscal)                        | Manter; após 5 anos, apagar                                                                                                      |
| `emailCliente` (assinante)                 | PII direta                   | CTR                                | Vigência contrato + 90 dias                    | Apagar                                                                                                                           |
| `telefoneCliente` (assinante)              | PII direta                   | CTR                                | Vigência contrato + 90 dias                    | Apagar                                                                                                                           |
| `dadosPagamento`                           | PII sensível                 | OBR (fiscal/contábil)              | 5 anos                                         | Manter cifrado; tokenizar PAN; após 5 anos, apagar                                                                               |
| `logsAuditoria` (`tabela_auditoria`)       | Operacional                  | LIN + OBR (registro de tratamento) | 1 ano (operacional) / 5 anos (eventos fiscais) | Após 1 ano, eventos não-fiscais são apagados; eventos fiscais migram para arquivo frio                                           |
| `logsOperacionais` (electron.log, hub.log) | Operacional + telemetria     | LIN                                | **30 dias**                                    | Apagar (rotação por tamanho + idade)                                                                                             |
| `payloadIntegracao` (request/response ERP) | Operacional + PII transitiva | LIN + CTR                          | 90 dias completo / metadata indefinido         | Após 90 dias, apagar `requestBody`/`responseBody`; manter `eventId`, `status`, `hashIntegridade`, `correlationId`                |
| `nonceConsumido`                           | Segurança                    | LIN                                | **10 min**                                     | Job de limpeza apaga (cache de replay, ADR-015)                                                                                  |
| `oauthRefreshToken`                        | Credencial                   | CTR                                | Vigência da sessão                             | Rotacionado a cada uso (ADR-012); revogado em ≤7 dias se vazado                                                                  |
| `dadosTelemetriaOptIn`                     | Operacional                  | CON                                | 12 meses ou até revogação                      | Apagar                                                                                                                           |

---

## 4. Resolução do conflito retenção fiscal × esquecimento

Quando um titular exerce direito ao esquecimento (LGPD art. 18 VI) sobre
dados que estão em campos com TTL fiscal de 5 anos:

1. **Não apagar** campos fiscais (CNPJ, NF, valores, chave de acesso) — base
   legal OBR prevalece (art. 16 I).
2. **Pseudonimizar** PII vinculada ao mesmo registro: CPF do motorista vira
   hash sha256 truncado (16 chars), nome vira `[anonimizado]`, CNH é
   apagada se já passou TTL próprio.
3. **Notificar o titular** que a pseudonimização foi aplicada e que dados
   fiscais permanecem por obrigação legal, com prazo até a expiração
   (art. 9º II).
4. **Registrar** o exercício no `tabela_auditoria` com `acao =
"DIREITO_ESQUECIMENTO_PARCIAL"`, `recurso` apontando para o registro,
   prazo até apagamento total.

Após 5 anos, o job de retenção apaga também os campos fiscais.

---

## 5. Pseudonimização — especificação técnica

- **Algoritmo**: `sha256(valorCanonico || tenantSalt)[:16]` em hex.
- **Canonização**: trim, lowercase, remoção de pontuação para CPF/CNPJ.
- **Salt por tenant**: 256 bits aleatórios, gerados na criação do tenant,
  protegidos via DPAPI (mesma KEK, kekVersion separada).
- **Não-reversibilidade**: o salt **nunca** é exportado nem registrado em
  log; perda do salt invalida a reconciliação, mas é aceitável (não
  comprometemos privacidade).

---

## 6. Job de retenção

`retention.service.ts` roda diariamente à 03:00 BRT e:

1. Carrega esta matriz de `MATRIZ-RETENCAO-ESQUECIMENTO.md` (parser do
   markdown ou cópia compilada em `retention.config.ts`).
2. Para cada campo, executa a forma de minimização declarada quando
   `agora - createdAt > TTL`.
3. Registra em `tabela_auditoria` o sumário (quantidade de registros
   afetados por campo).
4. Falha visível se a matriz e o código divergirem (gate de CI).

---

## 7. Cross-references

- **Política de Privacidade** §9 — base legal e direitos.
- **Doc 005 §9.2** — direitos do titular (consome esta matriz).
- **ADR-012** — refresh token rotation (campo `oauthRefreshToken`).
- **ADR-015** — TTL `nonceConsumido` 10 min.
- **POLITICA-PRIVACIDADE §3** — bases legais (deve listar FRA conforme
  edição Rodada 5).
