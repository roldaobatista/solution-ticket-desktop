import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Retorna o diretório de dados do usuário para o Solution Ticket.
 * - Windows:  %APPDATA%\SolutionTicket
 * - macOS:    ~/Library/Application Support/SolutionTicket
 * - Linux:    ~/.config/SolutionTicket
 *
 * Em modo de desenvolvimento (NODE_ENV !== 'production'), usa
 * <backend>/data/ para manter o ciclo local rápido.
 */
export function getUserDataDir(): string {
  // O Electron passa USER_DATA_PATH via env. Se presente, usa ele para
  // garantir consistência de paths entre Electron e backend (Onda 1 fix).
  if (process.env.USER_DATA_PATH) {
    return process.env.USER_DATA_PATH;
  }

  if (process.env.NODE_ENV !== 'production') {
    return path.resolve(process.cwd(), 'data');
  }

  const platform = process.platform;
  let base: string;

  if (platform === 'win32') {
    base = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    base = path.join(os.homedir(), 'Library', 'Application Support');
  } else {
    base = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config');
  }

  return path.join(base, 'SolutionTicket');
}

export function ensureUserDataDir(): string {
  const dir = getUserDataDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'logs'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'backups'), { recursive: true });
  return dir;
}

export function getDatabasePath(): string {
  return path.join(getUserDataDir(), 'solution-ticket.db');
}

export function getDatabaseUrl(): string {
  return `file:${getDatabasePath()}`;
}
