import { spawnSync } from 'child_process';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { decrypt } from './crypto.util';
import { getUserDataDir } from './desktop-paths';

const DPAPI_PREFIX = 'dpapi:v1:';
const ENC_PREFIX = 'enc:v1:';
const LOCAL_PREFIX = 'local:v1:';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

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

function getLocalKey(): Buffer {
  if (process.env.SECRET_PROTECTION_KEY) {
    return createHash('sha256').update(process.env.SECRET_PROTECTION_KEY).digest();
  }

  const keyPath = path.join(getUserDataDir(), 'secret-protection.key');
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });
  if (!fs.existsSync(keyPath)) {
    fs.writeFileSync(keyPath, randomBytes(32).toString('base64'), {
      encoding: 'utf8',
      mode: 0o600,
    });
  }

  const raw = Buffer.from(fs.readFileSync(keyPath, 'utf8').trim(), 'base64');
  if (raw.length !== 32) {
    throw new Error('Chave local de proteção de segredos inválida');
  }
  return raw;
}

function encryptLocal(value: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getLocalKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decryptLocal(value: string): string {
  const combined = Buffer.from(value, 'base64');
  const iv = combined.subarray(0, IV_LEN);
  const authTag = combined.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const encrypted = combined.subarray(IV_LEN + AUTH_TAG_LEN);
  const decipher = createDecipheriv(ALGO, getLocalKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function protectSecret(value: string): string {
  const dpapi = runDpapi('protect', value);
  if (dpapi) return `${DPAPI_PREFIX}${dpapi}`;
  return `${LOCAL_PREFIX}${encryptLocal(value)}`;
}

export function revealSecret(value: string): string {
  if (value.startsWith(DPAPI_PREFIX)) {
    const plain = runDpapi('unprotect', value.slice(DPAPI_PREFIX.length));
    if (plain === null) throw new Error('Falha ao abrir segredo DPAPI');
    return plain;
  }
  if (value.startsWith(LOCAL_PREFIX)) return decryptLocal(value.slice(LOCAL_PREFIX.length));
  if (value.startsWith(ENC_PREFIX)) return decrypt(value.slice(ENC_PREFIX.length));
  return value;
}
