# Política de Privacidade — Solution Ticket

**Versão**: 1.0 — 2026-04-26
**Última atualização**: 2026-04-26
**Vigência**: a partir da data de aceite pelo Cliente

> ⚠️ **Importante**: este documento é **rascunho técnico**. Antes de uso comercial real, **revisão obrigatória por advogado especializado em LGPD e direito digital**.

---

## 1. Identificação

**Controlador (do Solution Ticket)**:

- Razão social: {Solution Ticket Sistemas LTDA}
- CNPJ: {a preencher}
- Endereço: {a preencher}
- DPO: {nome / e-mail}

**Operador**:
Solution Ticket é **operador** dos dados pessoais que o Cliente trata por meio do produto. O Cliente é **controlador** dos dados de seus próprios clientes/parceiros/motoristas.

---

## 2. Dados pessoais tratados

O Solution Ticket trata os seguintes dados pessoais durante operação:

### 2.1 Dados do Cliente (assinante do produto)

- Nome, e-mail, telefone do administrador
- CNPJ da empresa
- Dados de pagamento (via processador externo)
- Logs de acesso ao produto

### 2.2 Dados de terceiros tratados pelo Cliente via produto

- CPF/CNPJ de parceiros (clientes finais, fornecedores, transportadoras)
- Nome de motoristas
- Placa de veículos
- Documentos fiscais (NF-e, CT-e)
- Dados de pesagem operacional

### 2.3 Dados técnicos (telemetria opt-in)

- Versão do produto
- Sistema operacional
- Logs de erro anonimizados (sem PII)

---

## 3. Bases legais

| Tipo de tratamento                                                            | Base legal LGPD                              |
| ----------------------------------------------------------------------------- | -------------------------------------------- |
| Execução de contrato (uso do produto)                                         | Art. 7º, V                                   |
| Representante PJ (dados pessoais de representante de pessoa jurídica)         | Art. 7º, V                                   |
| Cumprimento de obrigação legal (auditoria fiscal 5 anos)                      | Art. 7º, II                                  |
| Logs operacionais para suporte                                                | Art. 7º, IX (legítimo interesse)             |
| Prevenção a fraude e à segurança do titular                                   | Art. 7º, IX (combinado com art. 11, II, "g") |
| Exercício regular de direito em processo judicial, administrativo ou arbitral | Art. 7º, VI                                  |
| Proteção do crédito (consultas e registros)                                   | Art. 7º, X                                   |
| Marketing direto ao Cliente                                                   | Art. 7º, I (consentimento)                   |

---

## 4. Finalidades

### 4.1 Operação do produto

- Sincronização de pesagens com ERP do Cliente
- Geração de relatórios e auditoria
- Suporte técnico

### 4.2 Cumprimento legal

- Retenção de documentos fiscais (5 anos — Receita Federal)
- Atendimento a requisições de autoridades

### 4.3 Melhoria do produto (anonimizado)

- Métricas agregadas de uso
- Detecção de bugs

---

## 5. Compartilhamento de dados

### 5.1 Não compartilhamos

Solution Ticket **não vende, aluga ou compartilha** dados pessoais com terceiros para fins comerciais.

### 5.2 Compartilhamentos autorizados

- **ERP do Cliente**: dados que o próprio Cliente envia para integração
- **Cloudflare** (relay cloud): processamento temporário de webhooks (DPA em formalização — ver §9)
- **Provedor de pagamento**: dados de fatura
- **Autoridades**: mediante ordem judicial fundamentada

> 🔴 **GATE COMERCIAL**: Solution Ticket **não opera relay cloud com PII real** até que a **DPA Cloudflare** esteja formalmente assinada. Até essa data, o **modo polling-only é o default** para todos os tiers — eventos webhook são consumidos diretamente pelo agent local sem trânsito por edge global. Acompanhe progresso em `docs/legal/CHECKLIST-PREENCHIMENTO-LEGAL.md` e rascunho da DPA em `docs/legal/DPA-CLOUDFLARE-DRAFT.md`.

### 5.3 Subprocessadores — versionamento

Lista atualizada em **solution-ticket.com/subprocessors**, com:

- **Changelog público versionado** de adições, remoções e alterações de finalidade
- **Notificação prévia ao Cliente com antecedência mínima de 30 dias** antes de adicionar novo subprocessador que trate dados pessoais do Cliente
- Cliente Enterprise pode **opor-se motivadamente** dentro do prazo de notificação; havendo objeção, Solution Ticket apresenta alternativa ou faculta rescisão sem multa
- Histórico de versões mantido por no mínimo **5 anos** após a alteração

---

## 6. Armazenamento e segurança

### 6.1 Localização

- **Dados de operação**: SQLite local na máquina do Cliente
- **Relay cloud**: edge global (Cloudflare); região regulável a pedido
- **Backups corporativos do Solution Ticket**: Brasil (a definir provedor)

### 6.2 Medidas de segurança

- Criptografia em repouso (DPAPI / AES-256)
- TLS 1.3 em trânsito
- Cofre de credenciais (DPAPI)
- Mascaramento de PII em logs
- Permissões granulares
- Auditoria de acesso
- Backups criptografados

### 6.3 Retenção

- Dados de operação: enquanto o Cliente usa o produto + 90 dias após cancelamento
- Documentos fiscais: 5 anos (obrigação legal)
- Logs operacionais: 90 dias (mascarados)
- Auditoria de acesso: 1 ano

---

## 7. Direitos do titular (terceiros tratados pelo Cliente)

Quando o Cliente recebe pedido de exercício de direitos de seus próprios titulares:

| Direito                           | Como Solution Ticket atende                                   |
| --------------------------------- | ------------------------------------------------------------- |
| Confirmação                       | Cliente consulta relatórios pelo produto                      |
| Acesso                            | Export JSON via API ou painel                                 |
| Correção                          | Cliente edita no ERP; sincroniza                              |
| Anonimização                      | Substitui valores por hash (preserva fiscal)                  |
| Bloqueio                          | Marca registro como inativo                                   |
| Eliminação                        | Remove dados; mantém apenas o legalmente obrigatório (fiscal) |
| Portabilidade                     | Export estruturado                                            |
| Informação sobre compartilhamento | Lista de subprocessadores                                     |
| Revogação de consentimento        | Aplicável apenas onde consentimento é base                    |

**Prazo de atendimento**: 15 dias (LGPD) — Solution Ticket fornece ao Cliente meios para atender; responsabilidade primária é do Cliente como controlador.

**SLA operador → controlador**: quando um titular contata Solution Ticket
diretamente e o pedido precisa ser repassado ao Cliente (controlador),
Solution Ticket compromete-se a **encaminhar e instrumentar a resposta em
até 7 (sete) dias úteis** a partir do recebimento, preservando o prazo
legal de 15 dias de ponta-a-ponta. Eventos críticos (vazamento, suspeita de
fraude) seguem prazos do §11.

A matriz operacional que rege retenção e esquecimento por campo está em
`docs/integracao/MATRIZ-RETENCAO-ESQUECIMENTO.md`.

---

## 8. Cookies e tecnologias similares

Software desktop **não usa cookies**. Site institucional usa:

- Cookies essenciais (autenticação no portal)
- Analytics agregado (sem PII)
- Sem cookies de marketing por padrão

Política completa em solution-ticket.com/cookies.

---

## 9. Transferência internacional

> 🔴 **GATE COMERCIAL**: enquanto a **DPA Cloudflare não estiver assinada**, o relay cloud opera apenas em **modo simulado / polling-only** (sem PII real trafegando em edge global). A ativação do relay cloud com dados reais é condicionada à formalização da DPA. Acompanhe `docs/legal/CHECKLIST-PREENCHIMENTO-LEGAL.md` e rascunho em `docs/legal/DPA-CLOUDFLARE-DRAFT.md`.

- Backend opera localmente (Brasil)
- **Relay cloud Cloudflare** processa **eventos de notificação webhook** vindos dos ERPs cloud (Bling, Omie, ContaAzul, SAP S/4HANA Cloud, Dynamics)
- **Esses eventos podem conter dados pessoais** (CNPJ/CPF de parceiro, nome, e-mail, dados de pedido) por períodos curtos (TTL 7 dias Pro / 30 dias Enterprise) até serem consumidos pelo agent local
- Cloudflare opera em **edge global**; configuração regional Brasil/UE disponível para Enterprise mediante solicitação formal
- **DPA com Cloudflare**: em formalização — versão atual disponível mediante solicitação a `dpo@solution-ticket.com`; será publicada em solution-ticket.com/dpa quando concluída
- Subprocessador formalmente autorizado: lista atualizada em solution-ticket.com/subprocessors (em construção)
- Cliente pode optar por **não usar relay cloud** (apenas polling) — limitação: latência de eventos entrantes maior

Casos de transferência internacional (opcional):

- Cliente expressamente solicita backup em região global
- Suporte de emergência via equipe internacional

DPA com Cloudflare segue cláusulas-padrão UE (GDPR + LGPD).

---

## 10. Crianças e adolescentes

Solution Ticket é produto B2B operacional. **Não é direcionado a crianças ou adolescentes**. Não tratamos dados de menores intencionalmente.

---

## 11. Incidentes

### 11.1 Definição

Incidente = qualquer evento que possa comprometer confidencialidade, integridade ou disponibilidade de dados pessoais.

### 11.2 Procedimento

1. Detecção (alerta automático ou notificação)
2. Contenção (em < 1h)
3. Avaliação de impacto (em < 24h)
4. Notificação ao Cliente afetado (em < 48h)
5. Notificação à ANPD (se aplicável, em < 72h)
6. Post-mortem público (se aplicável)

### 11.3 Cliente também tem obrigação

Como controlador, o Cliente é o responsável primário por notificar seus titulares e a ANPD em incidentes envolvendo seus dados.

---

## 12. Revisão e atualizações

Esta política é revisada **anualmente** ou conforme mudanças regulatórias. Mudanças materiais notificadas ao Cliente com 30 dias de antecedência.

Histórico de versões em solution-ticket.com/privacy/history.

---

## 13. Contato

**DPO Solution Ticket**:

- Nome: {a preencher}
- E-mail: dpo@solution-ticket.com
- Endereço postal: {a preencher}

**Para titulares de dados** que constam no produto e querem exercer direitos:

- Contate primeiro o **Cliente** (sua empresa) — eles são o controlador
- Se não atendido, contate Solution Ticket: dpo@solution-ticket.com

**Canal de fallback (DPO Solution Ticket)**:

- E-mail primário: `dpo@solution-ticket.com` (resposta automática em até
  1 dia útil; resposta humana conforme SLA do §7).
- Horário comercial: **9h às 18h (BRT), segunda a sexta**, exceto feriados
  nacionais.
- Fora do horário comercial, mensagens são registradas e respondidas no
  próximo dia útil.

---

## 14. Legislação aplicável

- LGPD (Lei 13.709/2018) — Brasil
- Marco Civil da Internet (Lei 12.965/2014)
- Código de Defesa do Consumidor (quando aplicável)
- GDPR (apenas para Clientes europeus) — via SCC

Foro: Comarca de São Paulo - SP (alinhado com TERMOS-USO §16).

---

## 15. Glossário LGPD

- **Controlador**: quem decide finalidade e meios do tratamento
- **Operador**: quem trata em nome do controlador
- **Titular**: pessoa natural a quem se referem os dados
- **Tratamento**: qualquer operação com dados pessoais
- **DPO (Encarregado)**: pessoa indicada pelo controlador

---

**⚠️ DISCLAIMER**: Este documento é **rascunho técnico** elaborado pela equipe de produto. **Antes de uso em ambiente de produção comercial, validação por advogado é mandatória.** Leis evoluem e particularidades regionais podem exigir ajustes.
