/**
 * Script de code signing condicional para electron-builder.
 *
 * Uso:
 *   set WIN_CSC_LINK=path\to\cert.p12
 *   set WIN_CSC_KEY_PASSWORD=senha
 *   pnpm --filter ./electron dist
 *
 * Se as variáveis não estiverem definidas, o signing é pulado silenciosamente
 * (útil para builds de desenvolvimento/CI sem certificado).
 */

exports.default = async function sign(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'win32') {
    console.log('[sign] Pulando signing — não é Windows');
    return;
  }

  const certPath = process.env.WIN_CSC_LINK;
  const certPassword = process.env.WIN_CSC_KEY_PASSWORD;

  if (!certPath || !certPassword) {
    console.log(
      '[sign] Variáveis WIN_CSC_LINK/WIN_CSC_KEY_PASSWORD não definidas — pulando code signing',
    );
    return;
  }

  if (!require('fs').existsSync(certPath)) {
    console.warn(`[sign] Certificado não encontrado em ${certPath} — pulando code signing`);
    return;
  }

  // Se chegou aqui, o electron-builder usará as variáveis de ambiente
  // WIN_CSC_LINK e WIN_CSC_KEY_PASSWORD automaticamente.
  // Este script serve principalmente como gate/documentação.
  console.log(`[sign] Code signing habilitado com certificado: ${certPath}`);
};
