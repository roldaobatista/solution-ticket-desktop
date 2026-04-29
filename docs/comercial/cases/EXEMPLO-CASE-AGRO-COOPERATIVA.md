> ⚠️ **DISCLAIMER — CASO FICTÍCIO**: este documento é ilustrativo, baseado em padrões de mercado. **Cliente, números e quotes não são reais.** Não utilizar como prova de cliente real em RFPs, propostas comerciais ou material público sem substituir por dados de cliente verdadeiro com permissão escrita.

# Caso — Cooperativa Agrícola (Exemplo Anonimizado)

**Status**: Exemplo ilustrativo (números baseados em padrões reais de mercado, cliente fictício)
**Uso**: material de pré-venda para prospects do segmento agro
**Permissão**: ✅ Versão anonimizada
**Versão**: 1.0 — 2026-04-26

---

## 1. Resumo executivo

> "Reduzimos o tempo de digitação no Protheus de 4 horas/dia para zero. Em pico de safra, conseguimos pesar 30% a mais sem contratar ninguém."
> — Diretor de TI, Cooperativa Agrícola do Centro-Oeste

| Métrica                     | Antes     | Depois   | Diferença |
| --------------------------- | --------- | -------- | --------- |
| Pesagens/dia em pico        | 280       | 360      | +29%      |
| Tempo de digitação no ERP   | 4h/dia    | 0        | -100%     |
| Divergência fiscal mensal   | 4,2%      | 0,3%     | -93%      |
| Horas de balança parada/mês | 14h       | 0        | -100%     |
| Custo mensal de retrabalho  | R$ 18.500 | R$ 1.200 | -94%      |

---

## 2. Sobre o cliente

| Item          | Valor                                          |
| ------------- | ---------------------------------------------- |
| Setor         | Agronegócio (recebimento de grãos)             |
| Porte         | Médio-grande (cooperativa com ~600 cooperados) |
| Faturamento   | ~R$ 800 milhões/ano                            |
| Funcionários  | 240                                            |
| Localização   | Centro-Oeste                                   |
| ERP           | TOTVS Protheus (módulo Agro Multicultivo)      |
| Cliente desde | 2026-Q1 (fictício)                             |

---

## 3. O desafio

### Contexto operacional

Cooperativa opera 4 unidades de recebimento, 7 balanças rodoviárias, com pico de até 360 pesagens/dia em safra de soja (set–dez) e milho (mar–jun). Cada ticket precisa virar:

- Movimento no Protheus (recebimento)
- Vinculação ao contrato do cooperado
- Aplicação de desconto de umidade/impureza
- Geração de NF-e ou nota de remessa

### Problemas enfrentados

- **Digitação manual**: 2 operadores em tempo integral só transcrevendo ticket → Protheus (custo R$ 14.500/mês em folha + retrabalho)
- **Divergência de quantidade**: 4,2% das pesagens tinham diferença entre kg pesado e kg lançado (erro de digitação)
- **Multas fiscais**: 3 em 12 meses por divergência em NF-e (~R$ 22.000 em multas anuais)
- **Balança parada**: ERP travava em pico de safra; balança não podia operar até voltar (média 14h/mês × R$ 1.200/h de faturamento perdido = R$ 16.800/mês)
- **Auditoria de cooperado**: cooperado pedia comprovação de pesagem → 3 dias para gerar relatório

### Tentativas anteriores

- **2024**: contrataram consultoria local para custom em Protheus. R$ 240k investidos. Funcionou 6 meses até Protheus atualizar release (Harpia) e quebrar tudo.
- **2025**: tentaram bot RPA simulando entrada no Protheus. Quebrou 11 vezes em 8 meses. Bot custava R$ 12k/mês + manutenção.

---

## 4. A solução

### Arquitetura implantada

- **Plano**: Enterprise
- **Conectores nativos**: TOTVS Protheus (REST + SOAP), 1 conector NF-e via XML
- **Volume mensal**: 6.500 pesagens (média), 9.200 em pico
- **Balanças integradas**: 7
- **Unidades**: 4

### Implementação

- **Início**: 2026-01-15
- **Discovery + Contrato técnico**: 3 semanas
- **Mapping customizado** (Protheus muito personalizado): 2 semanas
- **Homologação H1–H4**: 4 semanas
- **Modo Sombra (H5)**: 2 semanas
- **GA**: 2026-03-15
- **Equipe do cliente**: 1 técnico TI + 1 operador líder + diretor TI

### Customizações

- Mapping específico para 23 produtos da cooperativa (soja, milho, sorgo, etc.)
- Tabela de equivalência de cooperado (CPF → CODPARC Protheus)
- Regra customizada de desconto de umidade por produto e safra
- Integração com módulo TOTVS Agro Multicultivo (NN5/NN6)

---

## 5. Resultados (após 60 dias em produção)

### Métricas operacionais

| KPI                             | Antes                 | Depois   | Variação |
| ------------------------------- | --------------------- | -------- | -------- |
| Pesagens perdidas/mês           | 12 (média)            | 0        | -100%    |
| Tempo de digitação              | 4h/dia × 2 operadores | 0        | -100%    |
| Divergência fiscal              | 4,2%                  | 0,3%     | -93%     |
| Multas fiscais (12m projetados) | R$ 22.000/ano         | R$ 0     | -100%    |
| Tempo de fechamento contábil    | 5 dias                | 1 dia    | -80%     |
| Horas balança parada            | 14h/mês               | 0        | -100%    |
| Custo mensal retrabalho         | R$ 18.500             | R$ 1.200 | -94%     |

### ROI

- **Investimento total (12 meses projetados)**:
  - Setup fee: R$ 12.000 (Tier-1 BR)
  - Mensalidade: (R$ 1.497 + R$ 197×7 + R$ 797 conector) + R$ 1.500/mês excedente = R$ 5.173/mês × 12 = R$ 62.076
  - Onboarding técnico (mapping customizado): R$ 18.000
  - **Total ano 1**: R$ 92.076
- **Economia anual**: ~R$ 240.000 (folha + retrabalho + multas + balança parada)
- **Payback**: 5 meses
- **ROI ano 1**: 161%

### Resultados intangíveis

- Auditoria interna de cooperado: de 3 dias para 5 minutos (correlation ID + filtro por cooperado)
- Operadores migraram para função de qualidade (classificação visual de carga)
- Diretor TI relata "primeira vez em 4 anos sem chamado de balança parada"
- Relacionamento com cooperado melhorou: comprovação imediata de pesagem por WhatsApp

---

## 6. Depoimentos

> "Quando o RPA quebrou pela 11ª vez, decidimos buscar produto. Solution Ticket foi indicado por outra cooperativa. A diferença é que aqui é **produto**, não projeto. Atualizam, mantêm, sem nos cobrar a mais."
> — Diretor de TI

> "Cooperado liga querendo saber se pesagem chegou. Em 5 segundos respondo: 'sim, número 4583, lançado às 10h12 no Protheus, vinculado ao seu contrato 8821'. Antes eu pedia 1 dia."
> — Operadora líder de balança

> "A multa de R$ 8.700 do ano passado por divergência fiscal era anual. Com Solution Ticket, dorme em paz."
> — Diretor financeiro

---

## 7. Lições aprendidas

### O que funcionou

- **Discovery profundo**: 3 semanas parecia muito, mas evitou retrabalho
- **Mapping declarativo**: cooperativa edita mapping pela UI quando regra muda, sem chamar dev
- **Mock Connector na homologação**: time treinou cenários de erro antes de tocar Protheus produção
- **Modo Sombra**: 2 semanas comparando lado a lado deu segurança para virar

### Desafios superados

- **Protheus extremamente customizado**: 30% dos campos eram `AD_*` específicos. Mapping precisou de 2ª iteração.
- **Pico de safra durante GA**: estresse maior que esperado, mas outbox absorveu sem perder pesagem.
- **Treinamento de operadores**: 4h previstas viraram 6h. Material de vídeo ajudou.

### Recomendações para cooperativas similares

- Negocie cliente piloto durante safra baixa (jul–ago) para sobra de tempo
- Tenha 1 técnico interno dedicado durante homologação
- Aproveite a UI de mapping para ajustar regras sem esperar release
- Use o módulo de reconciliação **toda semana**, não só no fim do mês

---

## 8. Próximos passos

- **Q3 2026**: integrar 2 unidades adicionais (totalizando 6 unidades)
- **Q4 2026**: avaliar conector adicional para TOTVS RM (RH/folha)
- **2027**: virar referência pública, autorizou vídeo testemunhal

---

## 9. Permissão de divulgação (versão completa, fictícia)

- [x] Cliente autoriza menção do nome em material comercial — **versão anonimizada**
- [x] Versão anonimizada autorizada
- [ ] Logo (não autorizado nesta versão)
- [x] Divulgação de números absolutos
- [x] Divulgação de percentuais

**Aprovado por**: {Diretor TI fictício}
**Data**: 2026-04-26
**Validade**: indefinida (anonimizado)

---

## 10. Material gerado a partir deste case

- [x] Case escrito (este arquivo)
- [ ] One-pager PDF (a fazer)
- [ ] Slide para pitch deck (a fazer)
- [ ] Vídeo testemunhal (planejado para Q4)

---

## 11. Uso interno

| Onde usar                                 | Sim/Não |
| ----------------------------------------- | ------- |
| Pitch deck (slide 8)                      | ✅      |
| Site (cases anonimizados)                 | ✅      |
| Apresentação para cooperativas            | ✅      |
| RFP segmento agro                         | ✅      |
| Treinamento de inside sales (perfil agro) | ✅      |

---

**⚠️ Disclaimer importante**:
Este case é **ilustrativo** baseado em padrões observados no segmento. Números exatos podem variar conforme cliente real. Para uso comercial, sempre validar dados com cliente real antes de publicar.

---

**Autor**: Equipe Solution Ticket
**Última atualização**: 2026-04-26
