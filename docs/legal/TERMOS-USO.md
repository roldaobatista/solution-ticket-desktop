# Termos de Uso — Solution Ticket

**Versão**: 1.0 — 2026-04-26
**Última atualização**: 2026-04-26

> ⚠️ **Importante**: documento **rascunho técnico**. Validação jurídica obrigatória antes de uso comercial real.

---

## 1. Aceitação dos termos

Ao instalar, acessar ou usar o Solution Ticket ("Software"), o Cliente concorda integralmente com estes Termos de Uso e com a Política de Privacidade.

Caso não concorde, não use o Software e exclua todas as cópias.

### 1.1 Natureza B2B

Este é um **contrato empresarial** entre pessoas jurídicas. As partes declaram não se enquadrarem como consumidor nos termos do art. 2º do CDC, excluindo-se expressamente a aplicação do Código de Defesa do Consumidor (CDC) salvo nos limites do art. 17 quando aplicável a microempresa em situação de hipossuficiência reconhecida judicialmente.

#### 1.1.1 Revisão automática para ME/EPP

Quando a contraparte for **Microempresa (ME) ou Empresa de Pequeno Porte (EPP)** comprovada via consulta à Receita Federal (regime Simples Nacional ou enquadramento formal), aplicam-se automaticamente:

- Cap de responsabilidade do §8.3 reduzido a **50%** dos valores ali previstos
- Multa de rescisão do §10.1 reduzida a **50%**
- Foro segue regra do CDC quando reconhecida hipossuficiência (art. 17 CDC)
- Demais cláusulas comutativas permanecem aplicáveis

---

## 2. Definições

- **Solution Ticket**: empresa fornecedora do Software
- **Cliente**: pessoa jurídica que adquire licença
- **Usuário**: pessoa autorizada pelo Cliente a operar o Software
- **Software**: produto Solution Ticket Desktop + módulos
- **Conectores**: integrações com ERPs nativas ou genéricas
- **Hub de Integração**: módulo de integração ERP
- **Tenant**: instância isolada de uso pelo Cliente
- **Plano**: nível de licenciamento contratado (Standard/Pro/Enterprise)

---

## 3. Licença de uso

### 3.1 Concessão

Solution Ticket concede ao Cliente licença **não exclusiva, intransferível, limitada** para usar o Software conforme:

- Número de máquinas/balanças contratadas
- Plano contratado
- Volume de pesagens incluído

### 3.2 Restrições

Cliente **não pode**:

- Sublicenciar, vender, alugar ou redistribuir
- Fazer engenharia reversa, descompilar, desmontar
- Remover avisos de copyright
- Usar para fim ilegal
- Burlar mecanismos de licenciamento
- Compartilhar credenciais entre tenants

### 3.3 Propriedade intelectual

- Software permanece propriedade do Solution Ticket
- Cliente mantém propriedade de seus próprios dados
- Conectores parceiros: propriedade do parceiro (vide SDK)

#### 3.3.1 Customizações e mappings

- **Mappings, layouts customizados e configurações pagas pelo Cliente** (incluindo regras de transformação de dados, templates de ticket personalizados e parametrizações específicas do negócio do Cliente) **permanecem propriedade do Cliente**, que pode exportá-los a qualquer tempo
- **Código de extensão, SDK e bibliotecas do Solution Ticket** utilizados para implementar tais mappings permanecem propriedade do Solution Ticket
- **Customizações híbridas** (que combinam código ST com configuração específica do Cliente): Solution Ticket concede ao Cliente **licença de uso perpétua e não-exclusiva** sobre a parte derivada, limitada à operação interna do Cliente, sem direito de sublicenciamento ou comercialização a terceiros

---

## 4. Planos e cobrança

### 4.1 Mensalidade

- Cobrada mensalmente, em moeda local (BRL)
- Vencimento: dia configurado no contrato
- Métodos: boleto, cartão de crédito, transferência

### 4.2 Volume

- Cada plano inclui volume mensal de pesagens
- Excedente cobrado conforme tabela vigente
- Volume não consumido **não acumula**

### 4.3 Setup fee

- Cobrado one-time no início do contrato
- Não reembolsável após 60 dias (exceto cláusula de garantia — vide seção 12)

### 4.4 Reajuste

- IPCA + 3% no aniversário do contrato
- Avisado 60 dias antes

### 4.5 Inadimplência

- Atraso de 5 dias: notificação
- Atraso de 15 dias: bloqueio de novos envios
- Atraso de 30 dias: suspensão completa
- Atraso de 60 dias: rescisão + cobrança judicial

Operação local da balança continua funcional mesmo durante suspensão (offline).

---

## 5. Suporte e SLA

Conforme plano contratado:

| Plano      | Resposta          | Resolução     | Disponibilidade |
| ---------- | ----------------- | ------------- | --------------- |
| Standard   | Comunidade        | Best-effort   | Best-effort     |
| Pro        | 4h business       | Best-effort   | Best-effort     |
| Enterprise | 30 min P0 / 1h P1 | 4h P0 / 8h P1 | 99.5%           |

Detalhes em `../comercial/PLANO-COMERCIAL.md` seção 8.

---

## 6. Obrigações do Cliente

Cliente compromete-se a:

- Fornecer informações verdadeiras
- Manter credenciais seguras
- Treinar usuários
- Não utilizar Software para fins ilegais
- Manter ambiente computacional adequado (Windows, hardware compatível)
- Comunicar mudanças relevantes (versão de ERP, customização)
- Pagar mensalidades em dia
- Cumprir leis aplicáveis (LGPD, fiscal, etc.)
- Backup periódico do banco local

---

## 7. Obrigações do Solution Ticket

Solution Ticket compromete-se a:

- Manter Software funcional conforme documentação
- Aplicar atualizações de segurança
- Cumprir SLA contratado
- Proteger dados conforme Política de Privacidade
- Notificar mudanças com antecedência
- Manter documentação acessível
- Suporte conforme plano

---

## 8. Limitação de responsabilidade

### 8.1 Solution Ticket NÃO é responsável por:

- Decisões fiscais/financeiras tomadas pelo Cliente com base em relatórios
- Indisponibilidade do ERP do Cliente
- Indisponibilidade de internet do Cliente
- Hardware do Cliente (balança, computador)
- Uso indevido por usuários do Cliente
- Lucros cessantes ou danos indiretos

### 8.2 Limite de responsabilidade

Em qualquer caso, responsabilidade total do Solution Ticket é limitada ao **maior valor entre**:
(a) o valor pago pelo Cliente nos últimos 12 meses; ou
(b) R$ 50.000,00 (cinquenta mil reais).

Esse piso garante reparação mínima mesmo para Clientes Standard com baixo histórico de pagamento.

### 8.3 Exceções e cap variável

Esta limitação não se aplica a:

- Dolo ou culpa grave comprovada (definidos: ato deliberado contra o Cliente; negligência crassa em segurança da informação)
- Violação **da LGPD** (Lei 13.709/2018), Marco Civil da Internet (Lei 12.965/2014) ou normas correlatas
- Violação **comprovada** de propriedade intelectual de terceiros
- Vazamento de dados pessoais por negligência operacional do Solution Ticket

Para tais hipóteses, aplica-se **cap variável proporcional ao tier do Cliente**:

| Tier           | Cap aplicável                                              |
| -------------- | ---------------------------------------------------------- |
| Standard / Pro | 3× R$ 50.000 = **R$ 150.000**                              |
| Enterprise     | maior valor entre **3× anuidade vigente** e **R$ 500.000** |

#### 8.3.1 Multa ANPD efetiva (LGPD)

Em casos de **violação LGPD com multa ANPD efetiva** ou condenação judicial específica por descumprimento de obrigação do operador, a responsabilidade do Solution Ticket fica **limitada à proporção do dano causado pela falha do operador**, **sem cap monetário pré-fixado**, observados:

- Apuração técnica de causa raiz (laudo independente quando solicitado)
- Concorrência de culpa do controlador (Cliente) é deduzida proporcionalmente
- Dolo ou culpa exclusiva do Cliente afasta responsabilidade do operador

---

## 9. Garantias

### 9.1 Garantia limitada

Solution Ticket garante que o Software funciona substancialmente conforme documentação por 90 dias após instalação inicial.

### 9.2 Sem garantia ampla

Software fornecido "como está" — sem garantia de adequação a propósito específico além do documentado.

### 9.3 Cláusula especial — conectores

Para conectores ERP, Solution Ticket garante:

- Conectores nativos: funcionam conforme documentação no momento do GA
- Atualizações em caso de mudança de versão do ERP (sem custo adicional)
- Sem garantia de funcionar com customizações não documentadas do ERP do Cliente

---

## 10. Rescisão

### 10.1 Por iniciativa do Cliente

- Pro: 30 dias de aviso, sem multa após 12 meses iniciais
- Enterprise: 60 dias de aviso; multa **proporcional** = `min(30% do saldo restante; 6 mensalidades)`, com redução proporcional ao % do contrato já cumprido

### 10.1.1 Reciprocidade — multa simétrica

Se **Solution Ticket rescindir o contrato sem justa causa**:

- Aviso prévio mínimo de **90 dias**
- **Multa simétrica equivalente** ao Cliente: pagamento de **3 (três) mensalidades vigentes** + **reembolso pro rata do setup fee** (proporcional ao tempo restante do ciclo inicial de 18 meses) + **suporte de migração assistida por 90 dias** sem custo adicional
- Fornecimento integral do export final de dados conforme §10.3
- A multa simétrica não se acumula com reembolso de setup quando contrato já tiver superado 18 meses

### 10.2 Por iniciativa do Solution Ticket

Pode rescindir imediatamente em caso de:

- Inadimplência > 60 dias
- Violação grave destes Termos
- Uso ilegal
- Falência do Cliente

### 10.3 Efeitos da rescisão — continuidade e saída

- Acesso ao Software cessa em até **30 dias** após data efetiva de rescisão
- **Export final dos dados**:
  - Formato: **CSV + JSON estruturado** (ambos)
  - Prazo de entrega: **até 30 dias** corridos da data de rescisão
  - **Escopo completo**: todos os schemas relevantes — `tickets`, `conectores`, `mappings`, `clientes/parceiros`, `produtos/veículos`, `usuários`, e **logs operacionais dos últimos 90 dias**
  - Documentação do schema acompanha o export
- Solution Ticket retém apenas o legalmente obrigatório (fiscal — 5 anos)
- **Backup estendido opcional** para auditoria fiscal: **R$ 297/mês**, retenção até 5 anos, contratável até 30 dias após rescisão

---

## 11. Confidencialidade

Ambas as partes comprometem-se a:

- Manter sigilo sobre informações técnicas/comerciais trocadas
- Não divulgar a terceiros sem autorização escrita
- Restringir acesso interno ao mínimo necessário
- Por 5 anos após rescisão

Exceções:

- Informação pública
- Solicitação judicial
- Autorização expressa

### 11.4 Direito de auditoria do controlador (right to audit)

Solution Ticket compromete-se a fornecer **anualmente**, mediante solicitação formal do Cliente:

- (a) **Questionário de segurança** preenchido (modelo CAIQ, SIG-Lite ou questionário próprio do Cliente)
- (b) **Sumário executivo do pentest** mais recente (sem detalhes que comprometam segurança operacional — vulnerabilidades específicas e vetores de ataque permanecem confidenciais)
- (c) **Lista versionada de subprocessadores ativos**, com data de inclusão e finalidade do tratamento

**Auditoria in loco** (presencial nas instalações do Solution Ticket): facultada ao Cliente Enterprise mediante:

- Assinatura de NDA específico
- Custos por conta do Cliente (deslocamento, auditor)
- Frequência máxima de **1 (uma) vez por ano calendário**
- Aviso prévio mínimo de 30 dias
- Escopo restrito a controles que afetem dados do Cliente solicitante

Para conectores ERP cobrados com setup fee:

- Se em 60 dias o conector não estiver em produção por motivo técnico do Solution Ticket → reembolso integral do setup
- Se Cliente desistir antes de 60 dias → reembolso de 50%
- Não se aplica a desistência por mudança de escopo do Cliente

---

## 13. Conectores parceiros (Marketplace)

Quando Cliente compra conector de parceiro via Marketplace:

- Termos específicos do parceiro também se aplicam
- Solution Ticket atua como facilitador comercial
- Suporte primário pelo parceiro (conforme tier)
- Solution Ticket pode descontinuar conector parceiro com aviso de 60 dias

Detalhes em `../integracao/SDK-CONNECTOR-SPEC.md`.

---

## 14. Marca e propaganda

- Solution Ticket pode mencionar Cliente como cliente (com permissão prévia)
- Cliente pode mencionar uso do Solution Ticket sem aprovação
- Uso de logo de cada parte exige autorização escrita
- Cases públicos: vide cláusula em contrato específico

---

## 15. Modificações dos Termos

Solution Ticket pode modificar estes Termos. Mudanças materiais:

- Notificação ao Cliente com **30 dias de antecedência**
- Cliente pode rescindir sem multa se discordar
- Continuar usando após prazo = aceite tácito

Histórico de versões em solution-ticket.com/terms/history.

---

## 16. Disputas

### 16.1 Tentativa amigável

Disputas devem primeiro ser resolvidas amigavelmente. Reclamação formal por escrito → resposta em 30 dias.

### 16.2 Mediação/arbitragem

Se não resolvido amigavelmente: mediação **CAM-CCBC (Centro de Arbitragem e Mediação da Câmara de Comércio Brasil-Canadá), São Paulo/SP**, regulamento vigente. Sede arbitral: São Paulo. Idioma: português.

### 16.3 Foro judicial — alçada de proporcionalidade

Para questões não cobertas por mediação/arbitragem: **Comarca da Capital de São Paulo/SP**, com renúncia a qualquer outro foro por mais privilegiado que seja.

**Alçada CAM-CCBC**: disputas com **valor de causa inferior a R$ 100.000,00** podem ser submetidas diretamente ao **foro da Comarca de São Paulo - SP**, dispensada a arbitragem CAM-CCBC do §16.2, para preservar **proporcionalidade de custas** (custas de arbitragem CAM-CCBC podem superar o valor da disputa em causas pequenas). A escolha entre foro judicial e arbitragem nessa faixa é da parte autora.

> ⚠️ **Aplicável a contratos a partir de 2026-04-27**. Versões anteriores podem ter foro diferente — consultar contrato específico.

---

## 17. Disposições gerais

### 17.1 Cessão — simetria

- **Cliente** não pode ceder este contrato sem **autorização prévia e escrita** do Solution Ticket
- **Solution Ticket** pode ceder o contrato em caso de fusão, aquisição ou reorganização societária, mediante **notificação prévia ao Cliente com antecedência mínima de 30 dias**
- **Em ambos os casos**, cessão para **concorrente direto** da contraparte (mesma indústria e segmento de atuação) exige **autorização expressa e escrita** da contraparte. A recusa motivada não configura inadimplência.

### 17.1.1 Change-of-control — opt-out do Cliente

Em caso de **fusão, aquisição ou alteração de controle societário do Solution Ticket** por **concorrente direto do Cliente** (definido como: empresa atuante na mesma indústria e mesmo segmento de mercado do Cliente, em produtos comparáveis), o Cliente terá:

- **Direito de rescisão imediata sem multa** nos **60 (sessenta) dias** seguintes ao **fechamento formal** da operação
- Aplicação integral dos efeitos do §10.3 (export final + suporte de migração)
- Dispensa do aviso prévio do §10.1
- Solution Ticket compromete-se a **comunicar formalmente** o fechamento ao Cliente em até 15 dias da efetivação

---

### 18. Não-aliciamento (no-poach)

Ambas as partes comprometem-se, durante a vigência do contrato e por **12 (doze) meses após sua rescisão**, a **não aliciar, contratar ou propor contratação direta ou indireta** de funcionários ou prestadores de serviço da contraparte que tenham trabalhado **diretamente no projeto** objeto deste contrato.

**Exceções**:

- Resposta a anúncios públicos de vaga não direcionados especificamente
- Contratação após 6 meses do desligamento voluntário do funcionário da contraparte
- Autorização escrita expressa da contraparte

**Multa por descumprimento**: equivalente a **3 (três) salários** mensais brutos do funcionário aliciado, pagos pela parte infratora à contraparte, sem prejuízo de perdas e danos suplementares comprovados.

### 17.2 Independência das cláusulas

Se uma cláusula for inválida, demais permanecem em vigor.

### 17.3 Renúncia

Tolerância a descumprimento não constitui renúncia ao direito.

### 17.4 Comunicações

- Por e-mail registrado nos cadastros
- Aviso recebido em até 5 dias úteis após envio

### 17.5 Idioma

Versão em português é a oficial. Traduções são meramente referenciais.

---

## 19. Aceite

Ao usar o Software, Cliente declara:

- Ter lido e compreendido estes Termos
- Ter capacidade legal para aceitar
- Aceitar integralmente

---

**Versionado em**: 2026-04-26
**Próxima revisão programada**: 2027-04-26 ou conforme mudanças legais

---

**⚠️ DISCLAIMER FINAL**: Este documento é **rascunho técnico** elaborado pela equipe de produto. **Validação por advogado especializado em direito digital, contratos B2B e LGPD é mandatória antes de uso comercial.** Leis evoluem; particularidades de jurisdição podem exigir ajustes. Solution Ticket não se responsabiliza por conformidade de uso desta minuta sem revisão jurídica.
