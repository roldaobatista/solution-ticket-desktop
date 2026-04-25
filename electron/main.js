const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const { setupAutoUpdate } = require('./updater');

const isDev = !app.isPackaged;

const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3000;
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/api/health`;

let mainWindow = null;
let splashWindow = null;
let backendProcess = null;
let frontendProcess = null;

// ---------- Logging ----------

function getLogFile() {
  const dir = path.join(app.getPath('userData'), 'logs');
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return path.join(dir, 'electron.log');
}

function logLine(tag, msg) {
  const line = `[${new Date().toISOString()}] [${tag}] ${msg}\n`;
  try {
    fs.appendFileSync(getLogFile(), line);
  } catch {}
  try {
    process.stdout.write(line);
  } catch {}
}

// ---------- Paths ----------

function getBackendDir() {
  if (isDev) return path.resolve(__dirname, '..', 'backend');
  return path.join(process.resourcesPath, 'backend');
}

function getFrontendDir() {
  if (isDev) return path.resolve(__dirname, '..', 'frontend');
  return path.join(process.resourcesPath, 'frontend');
}

function getBackendEntry() {
  return path.join(getBackendDir(), 'dist', 'main.js');
}

function getDatabasePath() {
  const dir = path.join(app.getPath('userData'));
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return path.join(dir, 'solution-ticket.db');
}

function getPrismaSchemaPath() {
  return path.join(getBackendDir(), 'src', 'prisma', 'schema.prisma');
}

function getPrismaBin() {
  return path.join(getBackendDir(), 'node_modules', 'prisma', 'build', 'index.js');
}

function getNextBin() {
  return path.join(getFrontendDir(), 'node_modules', 'next', 'dist', 'bin', 'next');
}

// ---------- Migrate on first run ----------

function runMigrationsIfNeeded() {
  const dbPath = getDatabasePath();
  const schemaPath = getPrismaSchemaPath();
  const prismaBin = getPrismaBin();

  if (isDev) {
    logLine('migrate', 'dev mode: skipping auto-migrate');
    return Promise.resolve();
  }

  if (fs.existsSync(dbPath)) {
    logLine('migrate', `db ja existe em ${dbPath}, pulando migrate`);
    return Promise.resolve();
  }

  if (!fs.existsSync(prismaBin)) {
    logLine('migrate', `prisma bin nao encontrado em ${prismaBin}, pulando`);
    return Promise.resolve();
  }
  if (!fs.existsSync(schemaPath)) {
    logLine('migrate', `schema nao encontrado em ${schemaPath}, pulando`);
    return Promise.resolve();
  }

  logLine('migrate', `rodando prisma migrate deploy (db=${dbPath})`);

  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      [prismaBin, 'migrate', 'deploy', `--schema=${schemaPath}`],
      {
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          DATABASE_URL: `file:${dbPath}`,
        },
        stdio: 'pipe',
      },
    );

    proc.stdout.on('data', (d) => logLine('migrate-out', d.toString().trim()));
    proc.stderr.on('data', (d) => logLine('migrate-err', d.toString().trim()));
    proc.on('exit', (code) => {
      if (code === 0) {
        logLine('migrate', 'migrate deploy OK');
        resolve();
      } else {
        logLine('migrate', `migrate deploy FALHOU (code=${code})`);
        reject(new Error(`prisma migrate deploy exit ${code}`));
      }
    });
    proc.on('error', (err) => {
      logLine('migrate', `erro spawn: ${err.message}`);
      reject(err);
    });
  });
}

// ---------- Backend spawn ----------

function startBackend() {
  const entry = getBackendEntry();
  if (!fs.existsSync(entry)) {
    dialog.showErrorBox(
      'Solution Ticket',
      `Backend nao encontrado em:\n${entry}\n\nExecute "pnpm build" no backend antes de iniciar.`,
    );
    app.quit();
    return null;
  }

  logLine('backend', `spawn ${entry}`);

  const dbPath = getDatabasePath();
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_ENV: isDev ? 'development' : 'production',
    PORT: String(BACKEND_PORT),
  };
  if (!isDev) {
    env.DATABASE_URL = `file:${dbPath}`;
    env.USER_DATA_PATH = app.getPath('userData');
  }

  const proc = spawn(process.execPath, [entry], {
    env,
    cwd: getBackendDir(),
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => logLine('backend', data.toString().trim()));
  proc.stderr.on('data', (data) => logLine('backend-err', data.toString().trim()));
  proc.on('exit', (code, signal) => {
    logLine('backend', `encerrado code=${code} signal=${signal}`);
    backendProcess = null;
    if (!app.isQuitting) {
      dialog.showErrorBox(
        'Solution Ticket',
        `Backend encerrou inesperadamente (code=${code}).\nVeja logs em ${getLogFile()}`,
      );
      app.quit();
    }
  });

  return proc;
}

// ---------- Frontend spawn ----------

function startFrontend() {
  if (isDev) {
    const npmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const proc = spawn(npmCmd, ['dev'], {
      cwd: getFrontendDir(),
      env: { ...process.env },
      shell: true,
      stdio: 'pipe',
    });
    proc.stdout.on('data', (d) => logLine('frontend', d.toString().trim()));
    proc.stderr.on('data', (d) => logLine('frontend-err', d.toString().trim()));
    return proc;
  }

  // production: next start
  const nextBin = getNextBin();
  if (!fs.existsSync(nextBin)) {
    dialog.showErrorBox('Solution Ticket', `Next.js bin nao encontrado:\n${nextBin}`);
    app.quit();
    return null;
  }

  logLine('frontend', `spawn next start port=${FRONTEND_PORT}`);

  const proc = spawn(process.execPath, [nextBin, 'start', '-p', String(FRONTEND_PORT)], {
    cwd: getFrontendDir(),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
    },
    stdio: 'pipe',
  });

  proc.stdout.on('data', (d) => logLine('frontend', d.toString().trim()));
  proc.stderr.on('data', (d) => logLine('frontend-err', d.toString().trim()));
  proc.on('exit', (code, signal) => {
    logLine('frontend', `encerrado code=${code} signal=${signal}`);
    frontendProcess = null;
    if (!app.isQuitting) {
      dialog.showErrorBox(
        'Solution Ticket',
        `Frontend encerrou inesperadamente (code=${code}).\nVeja logs em ${getLogFile()}`,
      );
      app.quit();
    }
  });

  return proc;
}

// ---------- Health check ----------

function waitForUrl(url, maxMs = 90000, intervalMs = 500) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) return resolve();
          retry();
        })
        .on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > maxMs) return reject(new Error(`Timeout aguardando ${url}`));
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

// ---------- Windows ----------

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    center: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => (splashWindow = null));
}

function createMainWindow(url) {
  const isKiosk = process.env.KIOSK_MODE === 'true';
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    fullscreen: isKiosk,
    kiosk: isKiosk,
    autoHideMenuBar: isKiosk,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // S2: defesa em profundidade — renderer roda em processo isolado
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  if (isKiosk) {
    mainWindow.setMenuBarVisibility(false);
    logLine('boot', 'KIOSK_MODE ativo (fullscreen, sem menu)');
  }

  mainWindow.loadURL(url);
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) splashWindow.close();
    mainWindow.show();
    if (!isKiosk) mainWindow.maximize();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    // S3: allowlist de protocolo — evita javascript:/file:/data: via window.open
    try {
      const { protocol } = new URL(openUrl);
      if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
        shell.openExternal(openUrl);
      } else {
        logLine('security', `bloqueado openExternal protocolo=${protocol} url=${openUrl}`);
      }
    } catch (e) {
      logLine('security', `bloqueado openExternal url invalida: ${openUrl}`);
    }
    return { action: 'deny' };
  });

  // S3: bloquear navegação para URLs fora do app (http://127.0.0.1)
  mainWindow.webContents.on('will-navigate', (event, navUrl) => {
    try {
      const u = new URL(navUrl);
      const allowed = u.hostname === '127.0.0.1' || u.hostname === 'localhost';
      if (!allowed) {
        event.preventDefault();
        logLine('security', `will-navigate bloqueado: ${navUrl}`);
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { type: 'separator' },
        { role: isMac ? 'close' : 'quit', label: 'Sair' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar tudo' },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'resetZoom', label: 'Zoom padrao' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Reduzir zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela cheia' },
        ...(isDev ? [{ role: 'toggleDevTools', label: 'DevTools' }] : []),
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Abrir pasta de logs',
          click: () => shell.openPath(path.dirname(getLogFile())),
        },
        {
          label: 'Instalar driver CH340',
          click: () => {
            const driverPath = isDev
              ? path.resolve(__dirname, '..', 'resources', 'drivers', 'CH340')
              : path.join(process.resourcesPath, 'drivers', 'CH340');
            shell.openPath(driverPath);
          },
        },
        { type: 'separator' },
        {
          label: 'Sobre',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Solution Ticket',
              message: 'Solution Ticket',
              detail: `Versao ${app.getVersion()}\nSistema de pesagem veicular\n\nSuporte: contato@solutionticket.com`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------- Lifecycle ----------

app.on('ready', async () => {
  logLine('boot', `Solution Ticket ${app.getVersion()} starting (dev=${isDev})`);
  buildMenu();
  createSplash();

  try {
    await runMigrationsIfNeeded();

    backendProcess = startBackend();
    if (!backendProcess) return;

    frontendProcess = startFrontend();
    if (!frontendProcess) return;

    await waitForUrl(HEALTH_URL);
    logLine('boot', 'backend OK');

    await waitForUrl(FRONTEND_URL);
    logLine('boot', 'frontend OK');

    createMainWindow(FRONTEND_URL);
    try {
      setupAutoUpdate(mainWindow);
    } catch (uerr) {
      logLine('updater-err', uerr.message);
    }
  } catch (err) {
    logLine('boot-err', err.message);
    dialog.showErrorBox(
      'Solution Ticket',
      `Erro ao iniciar:\n${err.message}\n\nLogs: ${getLogFile()}`,
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.isQuitting = true;
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch {}
  }
  if (frontendProcess) {
    try {
      frontendProcess.kill();
    } catch {}
  }
});
