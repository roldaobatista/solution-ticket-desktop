import * as os from 'os';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

/**
 * Gera fingerprint estavel da maquina:
 *   Windows: MAC da primeira NIC ativa + hostname + volume serial do C:
 *   macOS/Linux: MAC + hostname + machine-id (ou uname -n fallback)
 * Retorna SHA-256 hex truncado em 32 chars. Cache em memoria.
 */

let cached: string | null = null;

function primeiroMacAtivo(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const nics = interfaces[name] || [];
    for (const nic of nics) {
      if (!nic.internal && nic.mac && nic.mac !== '00:00:00:00:00:00') {
        return nic.mac.toLowerCase();
      }
    }
  }
  return 'no-mac';
}

function volumeSerialWindows(): string {
  try {
    // Tenta PowerShell primeiro (mais moderno)
    const ps = execSync(
      'powershell -NoProfile -Command "(Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID=\'C:\'\\").VolumeSerialNumber"',
      { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();
    if (ps) return ps;
  } catch {
    // ignore
  }
  try {
    const wmic = execSync(
      'wmic logicaldisk where "DeviceID=\'C:\'" get VolumeSerialNumber /value',
      {
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    )
      .toString()
      .trim();
    const m = wmic.match(/VolumeSerialNumber=(\w+)/i);
    if (m) return m[1];
  } catch {
    // ignore
  }
  return 'no-volserial';
}

function machineIdUnix(): string {
  const candidatos = ['/etc/machine-id', '/var/lib/dbus/machine-id'];
  for (const p of candidatos) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      if (fs.existsSync(p)) {
        const v = fs.readFileSync(p, 'utf8').trim();
        if (v) return v;
      }
    } catch {
      // ignore
    }
  }
  try {
    // macOS: IOPlatformUUID
    const out = execSync(
      "ioreg -rd1 -c IOPlatformExpertDevice | awk -F'\"' '/IOPlatformUUID/{print $4}'",
      { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();
    if (out) return out;
  } catch {
    // ignore
  }
  return os.arch() + '-' + os.platform();
}

export function obterFingerprint(): string {
  if (cached) return cached;

  const mac = primeiroMacAtivo();
  const hostname = os.hostname();
  let complemento = '';
  if (process.platform === 'win32') {
    complemento = volumeSerialWindows();
  } else {
    complemento = machineIdUnix();
  }

  const payload = `${mac}|${hostname}|${complemento}`;
  const hex = crypto.createHash('sha256').update(payload).digest('hex');
  cached = hex.substring(0, 32);
  return cached;
}

export function _resetFingerprintCache() {
  cached = null;
}
