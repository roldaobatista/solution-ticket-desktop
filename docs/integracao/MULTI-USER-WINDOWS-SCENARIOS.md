# Multi-User Windows Scenarios — DPAPI vs node-keytar

> Owner: Tech Lead + SRE. Insumos: SECRETS-MANAGEMENT.md, THREAT-MODEL-INTEGRACAO.md.
> Status: **insumo do spike Sprint 0** para escolha entre DPAPI CurrentUser e node-keytar.

## 1. Contexto

Windows desktop em ambientes industriais/operacionais tem cenarios multi-usuario que afetam o escopo de protecao de credenciais (DPAPI per-user vs Windows Credential Manager via node-keytar). Esta matriz lista os cenarios problematicos e a recomendacao por cenario.

## 2. Cenarios

### Cenario 1 — Tecnico de campo loga como Administrator local

- **Setup**: tecnico instala/configura como `Administrator`, depois operador usa como `OperadorBalanca`.
- **DPAPI CurrentUser**: secret cifrado com SID do Administrator. Operador nao consegue decifrar -> **falha em runtime**.
- **node-keytar (Credential Manager)**: secret salvo no cofre do usuario que rodou (Administrator). Outro usuario nao ve -> mesma falha.
- **Recomendacao**: instalacao deve criar secrets **sob o usuario que vai operar**, nao sob admin. Documentar no runbook.

### Cenario 2 — Maquina compartilhada entre 2 operadores (turno A/B)

- **Setup**: `OperadorA` (turno manha) e `OperadorB` (turno tarde) usam o mesmo PC.
- **DPAPI CurrentUser**: secret de A invisivel para B (cofres separados).
- **node-keytar**: igual — Credential Manager e per-user.
- **Recomendacao**: usar **DPAPI LocalMachine** (nao CurrentUser) — secret cifrado com chave da maquina, acessivel a qualquer usuario logado nela. Trade-off: qualquer admin local da maquina pode decifrar (aumenta superficie). Mitigacao: ACL no arquivo blob + auditoria.

### Cenario 3 — Citrix / RDS / multi-sessao

- **Setup**: servidor Windows Server + multiplos usuarios em sessoes simultaneas (RDP, Citrix XenApp).
- **DPAPI CurrentUser**: funciona por sessao — cada usuario tem seu cofre. Compatibilidade OK.
- **node-keytar**: idem.
- **Recomendacao**: **DPAPI CurrentUser ou keytar** funcionam. Atencao: se app roda como service em sessao 0 mas usuario interage em sessao N, DPAPI CurrentUser nao alcanca cross-session. Usar service account dedicado.

### Cenario 4 — Roaming profile (Active Directory)

- **Setup**: usuario AD com roaming profile; loga em multiplas maquinas e perfil viaja.
- **DPAPI CurrentUser**: master key viaja com perfil (parte do `AppData\Roaming\Microsoft\Protect`). Funciona em qualquer maquina onde o usuario logue.
- **node-keytar**: Credential Manager **nao** viaja com roaming profile por padrao — cofre fica local. Secret nao acessivel em maquina nova.
- **Recomendacao**: para clientes com AD + roaming, **DPAPI CurrentUser e superior** ao keytar. Validar no spike com cliente piloto que use AD.

### Cenario 5 — Reset de senha por admin AD

- **Setup**: usuario esquece senha, admin AD reseta via console (nao via "trocar senha" do proprio usuario).
- **DPAPI CurrentUser**: master key e re-cifrada com a nova senha **se** o usuario trocar a senha (fluxo normal). Reset por admin **pode invalidar a master key** -> secrets perdidos.
- **node-keytar**: Credential Manager geralmente sobrevive reset (depende da implementacao do Windows). Seguro, mas precisa testar.
- **Recomendacao**: documentar runbook: "se admin AD resetar senha, re-cadastrar credenciais ERP no app". Idealmente, instruir usuario a trocar senha pelo proprio fluxo (Ctrl+Alt+Del -> Trocar senha) em vez de admin reset.

### Cenario 6 — Desktop industrial em "kiosk mode" (usuario unico, system)

- **Setup**: maquina dedicada a balanca, 1 usuario local fixo (`OperadorBalanca`), sem rotacao.
- **DPAPI CurrentUser**: funciona perfeitamente. Cofre estavel, sem rotacao.
- **node-keytar**: igual, estavel.
- **Recomendacao**: **DPAPI CurrentUser e suficiente e mais simples**. Default do produto neste perfil de cliente.

## 3. Matriz de decisao

| Cenario                          | DPAPI CurrentUser | DPAPI LocalMachine       | node-keytar           | Recomendacao                                       |
| -------------------------------- | ----------------- | ------------------------ | --------------------- | -------------------------------------------------- |
| 1 — Admin instala, operador usa  | falha             | OK (com ACL)             | falha                 | Instalar sob usuario operador OU usar LocalMachine |
| 2 — Multi-operador mesma maquina | falha             | OK (com ACL + auditoria) | falha                 | **DPAPI LocalMachine**                             |
| 3 — Citrix/RDS                   | OK                | OK                       | OK                    | DPAPI CurrentUser (default)                        |
| 4 — Roaming profile AD           | OK                | OK                       | falha em maquina nova | **DPAPI CurrentUser**                              |
| 5 — Reset senha por admin        | risco de perda    | OK                       | OK                    | DPAPI CurrentUser + runbook OU LocalMachine        |
| 6 — Kiosk industrial             | OK                | OK                       | OK                    | DPAPI CurrentUser (default)                        |

## 4. Conclusao para o spike Sprint 0

- **Default do produto**: **DPAPI CurrentUser** (cobre cenarios 3, 4, 6 — maioria do ICP).
- **Modo "shared workstation"**: **DPAPI LocalMachine** com ACL no arquivo blob + auditoria — opcional, ativado por configuracao para clientes com cenarios 1 e 2.
- **node-keytar**: **NAO** sera usado como secrets store primario. Pode ser fallback para casos onde DPAPI falha (raro), mas adiciona dependencia nativa (vide RUNWAY-DEPENDENCIES-EXTERNAL.md).
- **Validacao no spike**: testar cenarios 1, 2, 4 em maquinas reais (laboratorio + 1 cliente piloto com AD).
- Documentacao final no SECRETS-MANAGEMENT.md secao "Multi-user matrix" apos spike.

## 5. Runbook (esboco)

- Instalador: detectar se usuario corrente e administrador local. Se sim, alertar "Esta maquina sera operada por outro usuario? Se sim, faca login com aquele usuario antes de configurar credenciais ERP".
- Fluxo de reset de senha AD: documentar em runbook de suporte.
- Migracao CurrentUser -> LocalMachine: ferramenta auxiliar via menu "Configuracao avancada > Modo workstation compartilhada".
