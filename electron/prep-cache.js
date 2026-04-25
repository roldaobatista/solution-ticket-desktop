// Pre-extrai o winCodeSign cache ignorando symlinks (flag -snl do 7za)
// para funcionar em Windows sem privilegio de criar symlinks.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const CACHE_DIR = path.join(
  os.homedir(),
  'AppData',
  'Local',
  'electron-builder',
  'Cache',
  'winCodeSign',
);
const VERSION = '2.6.0';
const TARGET = path.join(CACHE_DIR, `winCodeSign-${VERSION}`);
const SEVENZ = path.join(
  __dirname,
  '..',
  'node_modules',
  '.pnpm',
  '7zip-bin@5.2.0',
  'node_modules',
  '7zip-bin',
  'win',
  'x64',
  '7za.exe',
);

function findDownloaded7z() {
  if (!fs.existsSync(CACHE_DIR)) return null;
  const entries = fs.readdirSync(CACHE_DIR);
  for (const e of entries) {
    if (e.endsWith('.7z')) {
      const full = path.join(CACHE_DIR, e);
      const stat = fs.statSync(full);
      if (stat.size > 1000000) return full;
    }
  }
  return null;
}

async function main() {
  if (fs.existsSync(TARGET) && fs.existsSync(path.join(TARGET, 'windows-10'))) {
    console.log('[prep-cache] winCodeSign ja extraido em', TARGET);
    return;
  }

  fs.mkdirSync(CACHE_DIR, { recursive: true });

  let archive = findDownloaded7z();
  if (!archive) {
    console.log('[prep-cache] baixando winCodeSign-2.6.0.7z');
    const https = require('https');
    const url = `https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-${VERSION}/winCodeSign-${VERSION}.7z`;
    archive = path.join(CACHE_DIR, `winCodeSign-${VERSION}.7z`);
    await new Promise((resolve, reject) => {
      const f = fs.createWriteStream(archive);
      function get(u) {
        https
          .get(u, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return get(res.headers.location);
            }
            if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
            res.pipe(f);
            f.on('finish', () => f.close(resolve));
          })
          .on('error', reject);
      }
      get(url);
    });
    console.log('[prep-cache] download OK', archive);
  }

  if (!fs.existsSync(SEVENZ)) {
    console.error('[prep-cache] 7za.exe nao encontrado em', SEVENZ);
    process.exit(1);
  }

  fs.mkdirSync(TARGET, { recursive: true });
  console.log('[prep-cache] extraindo (ignorando symlinks) para', TARGET);
  const r = spawnSync(SEVENZ, ['x', '-bd', '-snl-', '-y', archive, `-o${TARGET}`], {
    stdio: 'inherit',
  });
  // -snl- desabilita criacao de symlinks em windows
  if (r.status !== 0) {
    // tenta sem -snl- mas com -y (em dev mode funciona)
    console.warn('[prep-cache] primeiro attempt falhou, retry com -aou');
    const r2 = spawnSync(SEVENZ, ['x', '-bd', '-y', '-aou', archive, `-o${TARGET}`], {
      stdio: 'inherit',
    });
    if (r2.status !== 0) {
      console.error('[prep-cache] extract falhou');
      process.exit(1);
    }
  }
  console.log('[prep-cache] OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
