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

  console.log(`[rebuild-native] Electron ${electronVersion}`);
  console.log(`[rebuild-native] Rebuild em ${backendDir} para: serialport, modbus-serial`);

  try {
    await rebuild({
      buildPath: backendDir,
      electronVersion,
      onlyModules: ['serialport', '@serialport/bindings-cpp', 'modbus-serial'],
      force: true,
    });
    console.log('[rebuild-native] OK');
  } catch (err) {
    console.warn('[rebuild-native] FALHOU (build do instalador continuara):', err.message);
  }
}

main().catch((err) => {
  console.warn('[rebuild-native] erro fatal ignorado:', err.message);
  process.exit(0);
});
