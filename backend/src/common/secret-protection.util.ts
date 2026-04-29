import { spawnSync } from 'child_process';
import { decrypt, encrypt } from './crypto.util';

const DPAPI_PREFIX = 'dpapi:v1:';
const ENC_PREFIX = 'enc:v1:';

function runDpapi(mode: 'protect' | 'unprotect', value: string): string | null {
  if (process.platform !== 'win32') return null;
  const script =
    mode === 'protect'
      ? `
Add-Type -AssemblyName System.Security
$plain = [Console]::In.ReadToEnd()
$bytes = [Text.Encoding]::UTF8.GetBytes($plain)
$protected = [Security.Cryptography.ProtectedData]::Protect($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Out.Write([Convert]::ToBase64String($protected))
`
      : `
Add-Type -AssemblyName System.Security
$cipher = [Console]::In.ReadToEnd()
$bytes = [Convert]::FromBase64String($cipher)
$plain = [Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
[Console]::Out.Write([Text.Encoding]::UTF8.GetString($plain))
`;

  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    {
      input: value,
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    },
  );
  if (result.status !== 0) return null;
  const output = result.stdout.trim();
  return output || null;
}

export function protectSecret(value: string): string {
  const dpapi = runDpapi('protect', value);
  if (dpapi) return `${DPAPI_PREFIX}${dpapi}`;
  return `${ENC_PREFIX}${encrypt(value)}`;
}

export function revealSecret(value: string): string {
  if (value.startsWith(DPAPI_PREFIX)) {
    const plain = runDpapi('unprotect', value.slice(DPAPI_PREFIX.length));
    if (plain === null) throw new Error('Falha ao abrir segredo DPAPI');
    return plain;
  }
  if (value.startsWith(ENC_PREFIX)) return decrypt(value.slice(ENC_PREFIX.length));
  return value;
}
