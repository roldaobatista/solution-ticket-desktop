param(
  [switch]$DryRun = $true,
  [switch]$Execute,
  [string]$InventoryPath = "",
  [string]$EvidenceDir = "docs/integracao/incidentes/token-revocation"
)

$ErrorActionPreference = "Stop"

if ($Execute -and $DryRun) {
  throw "Use -Execute -DryRun:`$false para execucao real."
}

if ($Execute -and [string]::IsNullOrWhiteSpace($InventoryPath)) {
  throw "Execucao real exige -InventoryPath com inventario de conectores/credenciais."
}

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
$evidencePath = Join-Path $EvidenceDir "revoke-all-tokens-$timestamp.json"

$result = [ordered]@{
  timestamp = (Get-Date).ToString("o")
  mode = $(if ($Execute) { "execute" } else { "dry-run" })
  inventoryPath = $InventoryPath
  status = "not-implemented-for-real-connectors"
  note = "Este script cria evidence pack e falha fechado para execucao real ate existir integracao com cofre/ERP."
  requiredNextSteps = @(
    "Ler inventario de conectores ativos do cofre DPAPI",
    "Chamar endpoint OAuth revoke de cada ERP",
    "Marcar credencial como REVOKED no SQLite",
    "Pausar outbox via feature flag",
    "Registrar audit log Sev1"
  )
}

$result | ConvertTo-Json -Depth 5 | Set-Content -Path $evidencePath -Encoding UTF8

if ($Execute) {
  Write-Error "Execucao real ainda nao implementada. Evidence pack gerado em $evidencePath"
  exit 2
}

Write-Output "Dry-run concluido. Evidence pack gerado em $evidencePath"
