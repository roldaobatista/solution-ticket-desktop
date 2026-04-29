/**
 * Auto-update via electron-updater + GitHub Releases.
 *
 * Ativado apenas em produção e quando UPDATE_FEED_URL não for "off".
 * Notifica o usuário antes de baixar e antes de instalar.
 *
 * Pré-requisitos:
 *  1. `electron-builder` config tem provider "github" (ver package.json).
 *  2. Releases publicados no GitHub com asset .exe + .yml + .blockmap.
 *  3. Em ambiente de teste manual, defina GH_TOKEN para repos privados.
 */

const { dialog, app } = require('electron');
const crypto = require('crypto');
const log = require('electron-log');

let autoUpdater;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch (err) {
  log.warn('electron-updater não instalado. Auto-update desativado.');
}

function parseRolloutPercent(value) {
  if (value === undefined || value === null || value === '') return 100;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 100;
  return Math.max(0, Math.min(100, parsed));
}

function rolloutBucket(seed) {
  const hex = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8);
  return parseInt(hex, 16) % 100;
}

function isAllowedByRollout() {
  const percent = parseRolloutPercent(process.env.UPDATE_ROLLOUT_PERCENT);
  if (percent >= 100) return true;
  if (percent <= 0) return false;
  const seed = `${app.getPath('userData')}|${app.getVersion()}`;
  return rolloutBucket(seed) < percent;
}

function setupAutoUpdate(mainWindow) {
  if (!autoUpdater) return;
  if (process.env.UPDATE_FEED_URL === 'off') {
    log.info('Auto-update desativado (UPDATE_FEED_URL=off).');
    return;
  }
  if (!app.isPackaged) {
    log.info('Auto-update ignorado em desenvolvimento.');
    return;
  }
  if (!isAllowedByRollout()) {
    log.info(`Auto-update fora do rollout atual (${process.env.UPDATE_ROLLOUT_PERCENT}%).`);
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = process.env.UPDATE_CHANNEL === 'canary';
  autoUpdater.channel = process.env.UPDATE_CHANNEL || 'latest';
  if (process.env.UPDATE_FEED_URL) {
    autoUpdater.setFeedURL({ provider: 'generic', url: process.env.UPDATE_FEED_URL });
  }

  autoUpdater.on('update-available', async (info) => {
    log.info(`Update disponível: ${info.version}`);
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização disponível',
      message: `Uma nova versão (${info.version}) está disponível. Baixar agora?`,
      detail: info.releaseNotes ? String(info.releaseNotes).slice(0, 500) : '',
      buttons: ['Baixar', 'Mais tarde'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) {
      autoUpdater.downloadUpdate().catch((err) => log.error('Falha download:', err));
    }
  });

  autoUpdater.on('update-not-available', () => log.info('Já está na versão mais recente.'));

  autoUpdater.on('error', (err) => log.error('Erro auto-update:', err));

  autoUpdater.on('download-progress', (p) => {
    log.info(`Download: ${p.percent.toFixed(1)}% (${p.transferred}/${p.total})`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log.info(`Update baixado: ${info.version}`);
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização pronta',
      message: 'A atualização foi baixada. Reiniciar agora para aplicar?',
      buttons: ['Reiniciar agora', 'Mais tarde'],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  // Checa imediatamente e a cada 4 horas
  autoUpdater.checkForUpdates().catch((err) => log.error('Check inicial falhou:', err));
  setInterval(
    () => {
      autoUpdater.checkForUpdates().catch((err) => log.error('Check periódico falhou:', err));
    },
    4 * 60 * 60 * 1000,
  );
}

module.exports = { setupAutoUpdate };
