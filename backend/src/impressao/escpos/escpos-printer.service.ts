import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * D14: Serviço de envio de buffers ESC/POS para impressoras.
 *
 * Suporta:
 *   - USB/Serial via nome da porta (ex: "COM3", "USB001", "/dev/usb/lp0")
 *   - RAW via path de device (ex: "/dev/usb/lp0")
 *   - Spool file (grava em arquivo temporário para driver Windows)
 */
@Injectable()
export class EscposPrinterService {
  private readonly logger = new Logger(EscposPrinterService.name);

  /**
   * Envia um buffer ESC/POS para a impressora.
   *
   * @param buffer  Buffer ESC/POS gerado pelo template
   * @param porta   Porta de impressão (ex: "COM3", "USB001", "LPT1", "/dev/usb/lp0")
   * @returns true se enviado com sucesso
   */
  async imprimir(buffer: Buffer, porta: string): Promise<boolean> {
    const portaSegura = this.validarPorta(porta);

    // Windows: tenta usar copy /b para porta (LPT1, COM3, etc.)
    if (os.platform() === 'win32') {
      return this.imprimirWindows(buffer, portaSegura);
    }

    // Linux/macOS: escreve diretamente no device file
    return this.imprimirUnix(buffer, portaSegura);
  }

  private async imprimirWindows(buffer: Buffer, porta: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Usa PowerShell para escrever bytes brutos na porta
      const psScript = `
          $port = New-Object System.IO.Ports.SerialPort "${porta}",9600,None,8,One
          try {
            $port.Open()
            $port.Write([byte[]](${Array.from(buffer).join(',')}), 0, ${buffer.length})
            $port.Close()
            Write-Host "OK"
          } catch {
            Write-Host "ERRO: $_"
          }
        `;
      const proc = spawn('powershell.exe', ['-Command', psScript], { shell: false });
      let output = '';
      proc.stdout.on('data', (d) => (output += d.toString()));
      proc.stderr.on('data', (d) => (output += d.toString()));
      proc.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          this.logger.log(`Impressão ESC/POS enviada para ${porta}`);
          resolve(true);
        } else {
          this.logger.error(`Falha ao imprimir em ${porta}: ${output}`);
          resolve(false);
        }
      });
    });
  }

  private async imprimirUnix(buffer: Buffer, porta: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.writeFile(porta, buffer, (err) => {
        if (err) {
          this.logger.error(`Falha ao escrever em ${porta}: ${err.message}`);
          resolve(false);
        } else {
          this.logger.log(`Buffer ESC/POS escrito em ${porta}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Salva o buffer em um arquivo temporário para testes ou spool manual.
   */
  salvarParaArquivo(buffer: Buffer, nome?: string): string {
    const tmpDir = path.join(os.tmpdir(), 'solution-ticket-escpos');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const fileName = this.validarNomeArquivo(nome);
    const filePath = this.resolverArquivoTemporario(tmpDir, fileName);
    fs.writeFileSync(filePath, buffer);
    this.logger.log(`Buffer ESC/POS salvo em ${filePath}`);
    return filePath;
  }

  private validarPorta(porta: string): string {
    if (typeof porta !== 'string') {
      throw new BadRequestException('Porta ESC/POS invalida');
    }

    const normalizada = porta.trim();
    if (!normalizada || normalizada.includes('\0')) {
      throw new BadRequestException('Porta ESC/POS invalida');
    }

    if (os.platform() === 'win32') {
      if (/^((COM|LPT)\d{1,3}|USB\d{1,3})$/i.test(normalizada)) {
        return normalizada;
      }
      throw new BadRequestException('Porta ESC/POS deve ser COM, LPT ou USB no Windows');
    }

    const unixPath = path.posix.normalize(normalizada.replace(/\\/g, '/'));
    if (
      /^\/dev\/usb\/lp\d+$/i.test(unixPath) ||
      /^\/dev\/lp\d+$/i.test(unixPath) ||
      /^\/dev\/tty(S|USB|ACM)\d+$/i.test(unixPath) ||
      /^\/dev\/(cu|tty)\.[A-Za-z0-9._-]+$/.test(unixPath) ||
      /^\/dev\/serial\/by-id\/[A-Za-z0-9._:-]+$/.test(unixPath)
    ) {
      return unixPath;
    }

    throw new BadRequestException('Porta ESC/POS deve apontar para um device permitido em /dev');
  }

  private validarNomeArquivo(nome?: string): string {
    const fileName = (nome?.trim() || `ticket-${Date.now()}.bin`).trim();

    if (
      fileName.length === 0 ||
      fileName.length > 120 ||
      fileName === '.' ||
      fileName === '..' ||
      fileName.includes('\0') ||
      fileName.includes('/') ||
      fileName.includes('\\') ||
      fileName.includes(':') ||
      !/^[A-Za-z0-9._-]+$/.test(fileName)
    ) {
      throw new BadRequestException('Nome de arquivo ESC/POS invalido');
    }

    return fileName;
  }

  private resolverArquivoTemporario(tmpDir: string, fileName: string): string {
    const baseDir = path.resolve(tmpDir);
    const filePath = path.resolve(baseDir, fileName);
    const baseDirComSeparador = baseDir.endsWith(path.sep) ? baseDir : `${baseDir}${path.sep}`;

    if (!filePath.toLowerCase().startsWith(baseDirComSeparador.toLowerCase())) {
      throw new BadRequestException('Nome de arquivo ESC/POS fora do diretorio temporario');
    }

    return filePath;
  }
}
