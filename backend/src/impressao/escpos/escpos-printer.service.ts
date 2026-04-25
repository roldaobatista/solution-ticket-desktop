import { Injectable, Logger } from '@nestjs/common';
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
    // Windows: tenta usar copy /b para porta (LPT1, COM3, etc.)
    if (os.platform() === 'win32') {
      return this.imprimirWindows(buffer, porta);
    }

    // Linux/macOS: escreve diretamente no device file
    return this.imprimirUnix(buffer, porta);
  }

  private async imprimirWindows(buffer: Buffer, porta: string): Promise<boolean> {
    return new Promise((resolve) => {
      const isPort = /^((COM|LPT)\d+|USB\d+)$/i.test(porta);

      if (isPort) {
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
      } else {
        // Path de arquivo (spool ou device)
        fs.writeFile(porta, buffer, (err) => {
          if (err) {
            this.logger.error(`Falha ao escrever em ${porta}: ${err.message}`);
            resolve(false);
          } else {
            this.logger.log(`Buffer ESC/POS escrito em ${porta}`);
            resolve(true);
          }
        });
      }
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
    const fileName = nome || `ticket-${Date.now()}.bin`;
    const filePath = path.join(tmpDir, fileName);
    fs.writeFileSync(filePath, buffer);
    this.logger.log(`Buffer ESC/POS salvo em ${filePath}`);
    return filePath;
  }
}
