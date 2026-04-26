/**
 * Script de code signing condicional para electron-builder.
 *
 * Uso:
 *   set WIN_CSC_LINK=path\to\cert.p12
 *   set WIN_CSC_KEY_PASSWORD=senha
 *   pnpm --filter ./electron dist
 *
 * Regras:
 * - Em release oficial (CI_RELEASE=true), a assinatura é obrigatória.
 * - Em builds dev/CI sem certificado, o skip é permitido com aviso.
 */

exports.default = async function sign(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'win32') {
    console.log('[sign] Pulando signing — não é Windows');
    return;
  }

  const certPath = process.env.WIN_CSC_LINK;
  const certPassword = process.env.WIN_CSC_KEY_PASSWORD;
  const isRelease = process.env.CI_RELEASE === 'true';

  if (!certPath || !certPassword) {
    if (isRelease) {
      throw new Error(
        '[sign] CI_RELEASE=true exige WIN_CSC_LINK e WIN_CSC_KEY_PASSWORD para code signing. Abortando release.',
      );
    }
    console.log(
      '[sign] Variáveis WIN_CSC_LINK/WIN_CSC_KEY_PASSWORD não definidas — pulando code signing (build dev)',
    );
    return;
  }

  if (!require('fs').existsSync(certPath)) {
    if (isRelease) {
      throw new Error(
        `[sign] Certificado não encontrado em ${certPath} e CI_RELEASE=true. Abortando release.`,
      );
    }
    console.warn(`[sign] Certificado não encontrado em ${certPath} — pulando code signing`);
    return;
  }

  // Se chegou aqui, o electron-builder usará as variáveis de ambiente
  // WIN_CSC_LINK e WIN_CSC_KEY_PASSWORD automaticamente.
  // Este script serve principalmente como gate/documentação.
  console.log(`[sign] Code signing habilitado com certificado: ${certPath}`);
};
