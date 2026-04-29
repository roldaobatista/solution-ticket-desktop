# ADR-004: Credenciais protegidas via Windows DPAPI

**Status**: Aprovada (pendente confirmação no spike S0-01)
**Data**: 2026-04-26

## Contexto

Conectores ERP exigem credenciais sensíveis: API keys, tokens OAuth, certificados ICP-Brasil, senhas SOAP, chaves SFTP. Armazenar em texto claro no SQLite local é **inaceitável** — banco fica em `%APPDATA%`, acessível a malware/usuários não autorizados.

Soluções possíveis em desktop Windows:

1. **Windows DPAPI** (Data Protection API) — chave derivada do perfil do usuário Windows
2. **`node-keytar`** — wrapper sobre Credential Manager
3. **AES-256 com chave mestra própria** — exige proteger a chave mestra
4. **Cofre externo** (Vault) — exige infra cloud, contraria local-first

## Decisão

Usar **Windows DPAPI** como mecanismo primário de proteção de credenciais.

- Toda credencial é encriptada via DPAPI **antes** de persistir em `integracao_profile_secret`
- A coluna `provider` indica o mecanismo (`windows-dpapi`, `os-keyring`, `encrypted-local`)
- Rotação manual via UI invalida valor antigo e cria novo registro
- **Nunca** logar credenciais — mascaramento obrigatório no `IntegrationLogService`

### Fallback

Se spike S0-01 mostrar que DPAPI tem limitação grave no Electron (IPC complexo, latência alta), usar **`node-keytar`** como fallback. Decisão final no fim do Sprint 0.

## Consequências

### Positivas

- Sem chave mestra para gerenciar — Windows cuida
- Credenciais inacessíveis a outros usuários da mesma máquina
- Sem dependência externa (compatível com local-first)

### Negativas

- Não funciona em Linux/macOS sem fallback (futuro)
- Backup do banco SQLite **não restaura** credenciais em outra máquina (devem ser reconfiguradas)
- Spike obrigatório para validar IPC Electron → backend

## Alternativas consideradas

- **AES-256 + chave mestra em arquivo**: rejeitada — chave fica acessível
- **Cofre Vault/Azure Key Vault**: rejeitada — exige cloud
- **Texto claro com permissão de arquivo**: rejeitada — inaceitável para auditoria

## Riscos

- DPAPI exige IPC Electron complexo → spike S0-01
- Restauração em nova máquina exige reconfiguração — documentar em runbook

## Referências

- Microsoft, _DPAPI documentation_
- `docs/PLANO-MODULO-INTEGRACAO.md` seção 6.5 risco de DPAPI
- `docs/GUIA-INTEGRACAO-ERP.md` seção 9.2
