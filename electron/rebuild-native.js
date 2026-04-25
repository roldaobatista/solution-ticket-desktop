/**
 * Rebuild native modules (serialport, modbus-serial) contra ABI do Electron.
 * Falha aqui NAO interrompe o build do instalador — apenas loga aviso.
 */
const path = require('path');

async function main() {
  const backendDir = path.resolve(__dirname, '..', 'backend');
  let rebuild;
  try {
    ({ rebuild } = require('@electron/rebuild'));
  } catch (err) {
    console.warn('[rebuild-native] @electron/rebuild nao instalado, pulando:', err.message);
    return;
  }

  // Detecta versao do electron
  let electronVersion;
  try {
    electronVersion = require('electron/package.json').version;
  } catch {
    electronVersion = require(
      path.join(__dirname, 'node_modules', 'electron', 'package.json'),
    ).version;
  }

  // Q6: diagnostico para detectar ABI mismatch (causa raiz #1 de "driver nao carrega")
  console.log(`[rebuild-native] Electron   ${electronVersion}`);
  console.log(`[rebuild-native] Node.js    ${process.versions.node}`);
  console.log(`[rebuild-native] ABI module ${process.versions.modules}`);
  console.log(`[rebuild-native] Platform   ${process.platform}-${process.arch}`);
  console.log(`[rebuild-native] Rebuild em ${backendDir} para: serialport, modbus-serial`);

  const strictMode = process.env.CI === 'true' || process.env.REBUILD_STRICT === 'true';
  try {
    await rebuild({
      buildPath: backendDir,
      electronVersion,
      onlyModules: ['serialport', '@serialport/bindings-cpp', 'modbus-serial'],
      force: true,
    });
    console.log('[rebuild-native] OK');
  } catch (err) {
    // Q6: em CI, falhar ruidoso; em desenvolvimento local, continuar com aviso.
    if (strictMode) {
      console.error('[rebuild-native] FALHOU (modo estrito):', err.message);
      throw err;
    }
    console.warn(
      '[rebuild-native] FALHOU (build continuara — use REBUILD_STRICT=true para abortar):',
      err.message,
    );
  }
}

main().catch((err) => {
  const strictMode = process.env.CI === 'true' || process.env.REBUILD_STRICT === 'true';
  if (strictMode) {
    console.error('[rebuild-native] erro fatal:', err.message);
    process.exit(1);
  }
  console.warn('[rebuild-native] erro fatal ignorado (use REBUILD_STRICT=true):', err.message);
  process.exit(0);
});
