import * as fs from 'fs';
import * as path from 'path';

describe('Electron packaging config', () => {
  function readElectronPackage() {
    const packagePath = path.resolve(process.cwd(), '../electron/package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
      scripts: Record<string, string>;
      build: { files: string[] };
    };
  }

  it('inclui updater.js no pacote para o require do main process', () => {
    const pkg = readElectronPackage();
    expect(pkg.build.files).toEqual(expect.arrayContaining(['updater.js']));
  });

  it('roda rebuild nativo em modo estrito no script de distribuição', () => {
    const pkg = readElectronPackage();
    expect(pkg.scripts.dist).toContain('REBUILD_STRICT=true');
  });
});
