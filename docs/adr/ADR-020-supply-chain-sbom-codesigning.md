# ADR-020 — Supply chain: SBOM, SCA bloqueante e code signing

- **Status:** Aceita
- **Data:** 2026-04-27
- **Owner:** Tech Lead
- **Aprovador:** Roldão (sponsor) + DPO

---

## Contexto

O módulo de integração ERP movimenta dado fiscal (NF-e, CT-e, payloads contábeis) entre estações cliente e ERPs corporativos. Três vetores de cadeia de suprimentos são especialmente perigosos no nosso stack:

1. **Dependências NPM** — o ecossistema tem CVEs frequentes (eventos como `event-stream`, `colors`, `node-ipc`); sem SCA bloqueante, um update transitivo pode introduzir backdoor com acesso a CPF e tokens OAuth.
2. **Instalador NSIS sem code signing** — vetor clássico de "update poisoning" (atacante substitui o binário no canal de atualização ou em download mirror). Windows também passou a sinalizar binários não-assinados com SmartScreen severo, prejudicando adoção.
3. **Build não reproduzível** — sem SBOM versionado, é impossível responder rapidamente a um CVE pós-release ("estamos afetados pela CVE-2026-XXXX?").

Adicionalmente, programas de partner (SAP PartnerEdge, TOTVS Partner) já exigem evidência de SBOM e code signing como pré-requisito de certificação (ver `CERT-OBLIGATIONS-MATRIX.md`).

---

## Decisão

Adotamos um conjunto integrado de práticas de supply chain:

1. **SBOM CycloneDX 1.5** gerado automaticamente em cada release pelo CI; arquivo `sbom.json` publicado junto ao instalador e versionado.
2. **SCA bloqueante** — Snyk **ou** GitHub Advanced Security configurado como gate de PR; falha automática em qualquer CVE de severidade **High** ou superior; CVE Medium gera warning não-bloqueante.
3. **Pinning de dependências** — `package-lock.json` commitado; uso de `npm ci` no CI (não `npm install`); dependabot configurado com revisão semanal.
4. **Code signing OV ou EV** no instalador NSIS e nos executáveis do auto-update. Certificado emitido por CA reconhecida (DigiCert, Sectigo). Custo estimado **R$ 2-4k/ano** (OV) ou **R$ 5-8k/ano** (EV — recomendado para evitar SmartScreen reputation warmup).
5. **Auto-update verifica assinatura** — antes de aplicar, valida cadeia de assinatura + hash SHA-256 conhecido. Falha de verificação → recusa update + alerta no audit log.
6. **Pinning de Node/Electron** — versão major+minor fixada em `.nvmrc` e `package.json#engines`.

---

## Consequências

### Positivas

- Bloqueador de GA pago **não-negociável** atendido (SAP, TOTVS exigem).
- Resposta a CVE pós-release passa de "horas pesquisando" para "comando contra SBOM versionado".
- SmartScreen + auto-update verificado = update poisoning praticamente eliminado.
- Cliente corporativo aceita instalador (sem aviso vermelho de Windows).

### Negativas / custo

- **Ferramental:** **~R$ 8-12k/18m** considerando o ciclo real do certificado
  no Brasil (cert EV + token HSM físico ou KMS + renovação a cada 18 meses
  com taxas locais e câmbio); somar ~R$ 2-3k/ano de SCA (Snyk Team) + SBOM
  tooling. Estimativa anterior de "R$ 5-10k/ano" estava subestimada
  (ignorava token HSM e câmbio do certificado emitido por CA brasileira ou
  via importador).
- **Tempo extra por release:** ~30 minutos (SCA full + signing + verificação).
- **Curva de gestão:** rotação anual do certificado; rotação ≤90d para tokens NPM publish.

### Riscos residuais

- Comprometimento da chave de assinatura → revogação imediata + emissão de novo cert + comunicação a clientes (ver `SECURITY-INCIDENT-PLAYBOOK.md` Sev1).
- CVE em dependência sem patch disponível → mitigação por versão alternativa ou pin com aceite de risco documentado pelo Tech Lead.

---

## Alternativas consideradas

- **Apenas code signing, sem SBOM/SCA** — descartada: não responde a "estamos afetados pela CVE X?".
- **SBOM sem SCA bloqueante** — descartada: virar relatório que ninguém lê.
- **EV-only** — descartada inicialmente por custo; OV cobre 95% dos casos. Migrar a EV quando volume justificar warmup do SmartScreen.

---

## Política de licenças open-source

Scan automatizado de licenças no CI a cada PR. Política:

### Default OK (auto-aprovado)

- **MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Unlicense, CC0-1.0**
- Compatíveis com produto comercial proprietário, sem obrigação de
  abertura de código.

### Bloqueante em produção (build vermelho)

- **GPL-2.0, GPL-3.0** — viralidade copyleft força abertura do código
  derivado; incompatível com modelo comercial.
- **AGPL-3.0** — pior caso, dispara obrigação mesmo em uso SaaS.
- **LGPL-2.1, LGPL-3.0** — bloqueado por padrão em deps de produção
  (linkagem dinâmica em Electron/Node tem ambiguidade jurídica); aceito
  apenas como dev-dependency.
- **SSPL, BSL, Commons Clause, Elastic License v2** — não-OSI; revisão
  jurídica obrigatória.

### Lista de exceções

Cada exceção (ex.: dep com LGPL crítica sem alternativa) requer aprovação
**dupla CISO + Jurídico**, com justificativa de "alternativa pesquisada e
inviável", e fica registrada em `LICENSE-WHITELIST.md` (raiz do repo) com:

- Pacote + versão
- Licença
- Justificativa
- Aprovador CISO + data
- Aprovador Jurídico + data
- Data de revalidação (anual)

CI usa `license-checker` (npm) ou `pnpm licenses` cruzado com whitelist;
fail no build se dep nova introduz licença bloqueante sem entrada
correspondente.

---

## Assinatura e integridade de pacotes pnpm

Mitigações específicas contra supply chain attack no ecossistema pnpm:

1. **Integridade do store** — habilitar
   `pnpm config set verify-store-integrity true` no CI e em workstations
   dos devs. Garante que `pnpm install` recalcula hash do conteúdo e
   bloqueia mismatch.
2. **Verify publisher** — `pnpm install --verify-deps-before-run` (a
   partir de pnpm 9.x); validação de signatures dos publishers npm.
3. **`npm audit signatures`** rodado no CI a cada release; falha se algum
   pacote do lockfile não tem assinatura válida do registry.
4. **`lockfile-lint`** — bloquear PRs que alterem `pnpm-lock.yaml` para
   apontar registries não autorizados (ex.: forks no GitHub Packages,
   tarballs em URL arbitrária); whitelist apenas `registry.npmjs.org`.
5. **Provenance** — preferir pacotes com SLSA provenance attestation
   (npm provenance via GitHub Actions) quando disponível.
6. **Pinning de versões** — `save-exact=true` em `.npmrc` para impedir
   ranges (`^`/`~`) que resolvem para versão maliciosa em update
   automático.

Configurações em `.npmrc` versionado no repo.

---

## Cross-links

- `RELEASE.md` — pipeline de release que executa SBOM + signing.
- ADR-016 (DPAPI) — outra peça da defesa em camadas.
- `SECURITY-INCIDENT-PLAYBOOK.md` — resposta a comprometimento da chave.
- `CERT-OBLIGATIONS-MATRIX.md` — exigências por programa de partner.
- `dr-dpapi` (runbook) — relacionado ao cofre cliente.
- `AUDIT-TRAIL` (ADR-018) — registro de eventos de update.
