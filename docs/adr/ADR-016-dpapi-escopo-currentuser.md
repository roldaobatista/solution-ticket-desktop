# ADR-016: DPAPI no escopo `CurrentUser` (não `LocalMachine`)

**Status**: Aprovada (resolve achado HIGH da Rodada 5 — decisão DPAPI silenciosa)
**Data**: 2026-04-27
**Cross-link**: ADR-004 (cofre DPAPI), `005-seguranca-credenciais.md` §2.

## Contexto

ADR-004 estabeleceu DPAPI como cofre de credenciais, mas **não fixou o escopo**
(`CurrentUser` vs `LocalMachine`). O código usa `CurrentUser` desde o início.
A auditoria Rodada 5 (Agente 2) classificou como decisão silenciosa que
precisa de ADR explícito com trade-offs documentados, porque a escolha tem
consequências operacionais não-óbvias.

## Decisão

A KEK (e, portanto, indiretamente, todas as DEKs e segredos cifrados — ver
doc 005 §2.2) é protegida via DPAPI **escopo `CurrentUser`**.

```typescript
const blob = dpapi.protectData(kekMaterial, /* entropy */ tenantSalt, 'CurrentUser');
```

**Não** usamos `LocalMachine`.

## Justificativa

Escopo `CurrentUser` deriva a chave do **perfil Windows do usuário logado**.
Outro usuário Windows na mesma máquina **não consegue decifrar**, mesmo com
acesso ao arquivo de blob. Isso casa com o modelo de ameaça do produto:
operador de balança opera sob seu próprio login, blob roubado isoladamente
(via cópia de pasta) é inutilizável.

`LocalMachine` deriva a chave da máquina inteira — qualquer processo rodando
em qualquer conta da máquina consegue decifrar, **incluindo malware sem
privilégio elevado**. Inaceitável para um cofre de credenciais.

## Trade-offs explícitos

### Cenários que **quebram** com `CurrentUser`

1. **Serviço Windows como `LocalSystem` ou `NetworkService`**: o serviço
   roda sob conta diferente do operador que cifrou — não decripta. **Como
   o produto roda como app de usuário (Electron) e não como serviço, não há
   regressão hoje**, mas qualquer migração futura para serviço Windows fica
   bloqueada por este ADR.
2. **Múltiplos operadores Windows na mesma máquina**: cada login Windows
   tem cofre independente. Operador A configura Bling; operador B faz login
   e o profile aparece como "credencial não disponível". Comportamento
   esperado, **não é bug**.
3. **Perda do perfil Windows** (corrupção, reinstalação, novo hardware): o
   blob fica permanentemente irrecuperável. Cliente precisa **re-onboarding
   completo** de credenciais.
4. **Roaming profile / domínio AD com perfis itinerantes**: DPAPI
   `CurrentUser` migra junto com o perfil **se** o domínio estiver
   configurado corretamente; sem isso, comporta-se como item 3.

### Mitigação

- **Re-onboarding documentado** em `docs/runbooks/integracao/dr-dpapi.md`
  (drill periódico, ainda não executado em produção — gate Rodada 5 do
  Agente DevOps).
- **Onboarding multi-usuário** desencorajado por padrão; cliente que precisa
  de N operadores compartilhando a mesma máquina deve consolidar num único
  login Windows operacional.
- **Aviso na UI** ao cadastrar credencial: "esta credencial só será visível
  para o usuário Windows atual nesta máquina".
- **Vault externo** (ADR-004 §2.1 hierarquia 3) recomendado para Enterprise
  com requisito de multi-operador, com adapter dedicado.

## Consequências

### Positivas

- Modelo de ameaça respeita defense-in-depth contra co-tenant Windows.
- Sem dependência de TPM ou de credenciais de máquina.

### Negativas

- Migração para serviço Windows futura requer ADR de superseção + plano de
  migração de cofre (provavelmente vault externo).
- Re-onboarding em DR é manual; impacto operacional documentado em
  `dr-dpapi.md`.

## Cenários multi-usuário Windows

Detalhamento de comportamento DPAPI `CurrentUser` em cenários reais de campo.
Cada cenário precisa ter teste correspondente no spike Sprint 0.

### Cenário 1 — Técnico de campo loga como `Administrator` local

- **Comportamento DPAPI**: o cofre cifrado pelo operador (login `joao`) é
  **inacessível** quando o técnico abre sessão como `Administrator`. Mesmo
  com privilégio elevado, o escopo `CurrentUser` deriva da SID do perfil
  ativo — `Administrator` tem outra SID, outra master key.
- **Mitigação**: técnico deve fazer suporte usando login do operador
  (com supervisão) ou re-onboarding via runbook `dr-dpapi.md` se o operador
  não está disponível. UI deve apresentar erro claro: "credencial pertence
  ao usuário Windows X — entre como X ou re-cadastre".
- **Teste no spike**: criar 2 logins Windows na mesma máquina, cifrar com A,
  tentar abrir com B (esperado: falha controlada, sem crash).

### Cenário 2 — Máquina compartilhada entre 2 operadores (turnos)

- **Comportamento DPAPI**: cada operador tem seu próprio cofre. Operador A
  configura Bling no turno da manhã; operador B abre o app à tarde e **não
  vê** a credencial. Cada um precisa cadastrar a sua.
- **Mitigação**: padrão recomendado é login Windows único compartilhado pela
  estação (ex.: `operador@balanca`) — mas isso reduz rastreabilidade no nível
  do SO. Alternativa Enterprise: vault externo (ADR-004 §2.1 hierarquia 3)
  com login pessoal no app + cofre compartilhado.
- **Teste no spike**: simular 2 operadores Windows sequenciais, validar que
  app exibe mensagem "credencial não encontrada para este usuário" sem
  vazamento e sem corromper banco.

### Cenário 3 — Citrix / RDS multi-sessão

- **Comportamento DPAPI**: em servidor Terminal Server, cada usuário RDS
  tem perfil isolado. DPAPI `CurrentUser` funciona por sessão. **Mas**: o
  produto Solution Ticket é **app de balança em estação física** — Citrix
  não é caso de uso suportado e fica fora do escopo deste ADR. Tentativa de
  rodar em farm RDS deve ser bloqueada por detecção (`SessionId != 0` →
  exibir aviso e abortar).
- **Mitigação**: bloqueio explícito; se Enterprise pedir, abrir ADR de
  superseção com vault externo + bind por sessão.
- **Teste no spike**: rodar app em VM Windows Server com função RDS,
  confirmar que detecção dispara e impede inicialização.

### Cenário 4 — Roaming profile / domínio AD com perfis itinerantes

- **Comportamento DPAPI**: `CurrentUser` migra junto com o perfil **se** o
  domínio replica corretamente os arquivos `%AppData%\Microsoft\Protect\<SID>`.
  Em domínios mal-configurados ou com perfis V2 vs V6, o blob pode ficar
  irrecuperável após login em outra máquina.
- **Mitigação**: pré-flight check no setup detecta `roaming profile` e exibe
  aviso "credencial poderá não ser portátil entre máquinas — confirme com
  o admin AD". Documentar em `dr-dpapi.md` o procedimento de re-onboarding
  em troca de máquina.
- **Teste no spike**: configurar domínio AD lab com roaming profile, cifrar
  em máquina A, logar em máquina B, validar comportamento (esperado:
  funciona OU falha controlada com mensagem clara).

### Cenário 5 — Reset de senha pelo admin AD (sem o usuário saber)

- **Comportamento DPAPI**: reset administrativo de senha **invalida a
  master key DPAPI** do usuário. O blob fica cifrado com chave derivada da
  senha antiga; após reset, decriptar falha. Diferente de troca de senha
  pelo próprio usuário (que re-cifra a master key transparentemente).
- **Mitigação**: detectar erro `CRYPT_E_NO_MATCH` na abertura, exibir
  "credencial irrecuperável após reset administrativo de senha — re-cadastre".
  Documentar em `dr-dpapi.md`. Comunicar admin AD do impacto antes de reset.
- **Teste no spike**: criar usuário em AD lab, cifrar credencial, fazer
  reset administrativo via `Reset-ADAccountPassword`, validar mensagem.

---

## Decisão final pré-Sprint 2

Este ADR fecha a decisão **DPAPI vs node-keytar** em caráter definitivo
**após o spike de Sprint 0**. Critérios de eliminação:

1. **Cenário multi-usuário** — qualquer um dos 5 cenários acima que falhar
   de forma não-controlada (crash, corrompimento de banco, vazamento entre
   usuários) elimina a opção.
2. **Compatibilidade Windows 10 1809+** — DPAPI nativo, sem dependência
   nativa adicional. node-keytar exige rebuild Electron por versão.
3. **Footprint de supply chain** — node-keytar tem histórico de incidentes
   (deps nativas com binários pré-compilados); DPAPI é API do SO.
4. **Performance no insert do audit log** — HMAC encadeado (ADR-018) não
   pode passar de 5ms/linha; DPAPI é cache local rápido, keytar varia por
   backend Windows.

Cenários documentados em detalhe em
`docs/integracao/MULTI-USER-WINDOWS-SCENARIOS.md` (matriz de teste do spike,
critérios pass/fail, registros de execução).

Saída do spike: relatório com tabela de cenários × resultado, decisão
assinada pelo Tech Lead + CISO. Sprint 2 não inicia sem este documento.

---

## Fingerprint de auth ERP

A integração ERP precisa de um **fingerprint** para ligar instância do app
a uma chave de auth no relay cloud + ERP. Este fingerprint é
**dissociado do fingerprint de licenciamento RSA** (que usa MAC + hostname

- serial volume C: — ver `docs/PLANO-DESKTOP.md`).

### Por que dissociar

Misturar os dois fingerprints cria acoplamento perigoso:

- Troca de HD para SSD invalida licença **e** quebra integração ERP no
  mesmo instante — cliente fica sem nada operacional.
- Comprometimento de uma chave força rotação da outra desnecessariamente.
- Auditoria fiscal exige rastreabilidade de **identidade da estação** que
  enviou o payload, separada da identidade comercial (licença).

### Derivação

```
fingerprint_auth_erp = HKDF-SHA256(
  ikm   = master_seed_local,
  salt  = "solution-ticket/erp-auth/v1",   // salt diferente do licenciamento
  info  = tenant_id || install_id,
  L     = 32 bytes
)
```

- `master_seed_local` é um segredo gerado no primeiro boot, gravado via
  DPAPI `CurrentUser`.
- `salt` é literal de domínio diferente do usado no licenciamento RSA
  (que usa `"solution-ticket/license/v1"`).
- `install_id` é UUID gerado no primeiro boot, persistido em SQLite.

Resultado: dois fingerprints independentes derivados da mesma origem
(master seed) mas com domínios separados — comprometimento de um não
revela o outro.

### Re-binding em troca de hardware (5 passos)

Cliente troca HD/MAC/placa-mãe → fingerprint muda → integração quebra.
Fluxo de re-binding controlado:

1. **Detectar mismatch** — startup do app compara fingerprint atual com o
   registrado no relay; se diferente, marca estado `RE_BINDING_REQUIRED`
   e pausa todos os conectores ERP.
2. **Notificar usuário** — UI exibe diálogo "hardware mudou — confirme
   identidade para reativar integração". Bloqueia operação até confirmar
   ou abortar.
3. **Confirmar identidade** — usuário fornece **senha do app + OTP** (TOTP
   via app autenticador cadastrado no onboarding). Sem TOTP, fluxo cai em
   verificação por suporte (ticket manual).
4. **Gerar novo fingerprint** — após confirmação, app deriva novo
   `fingerprint_auth_erp`, envia ao relay com assinatura do antigo (prova
   de continuidade).
5. **Invalidar antigo** — relay marca fingerprint antigo como `REVOKED`
   com timestamp; tokens emitidos sob ele são rejeitados; audit log
   registra evento `RE_BINDING_OK` no cliente e no relay.

Falha em qualquer passo → estado `RE_BINDING_BLOCKED` + escalação para
suporte. Janela máxima de re-binding: 7 dias após mismatch (configurável
por tenant Enterprise).

---

## Referências

- ADR-004 — cofre DPAPI
- `docs/integracao/005-seguranca-credenciais.md` §2 (KEK + DEK)
- `docs/integracao/MULTI-USER-WINDOWS-SCENARIOS.md` — matriz de spike
- `docs/runbooks/integracao/dr-dpapi.md` — re-onboarding em DR
- Microsoft Docs — `ProtectedData.Protect` / `DataProtectionScope`
- RFC 5869 — HKDF
