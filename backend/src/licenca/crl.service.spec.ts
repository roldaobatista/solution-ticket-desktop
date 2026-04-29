import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'crypto';
import { CrlService } from './crl.service';

describe('CrlService', () => {
  const originalPath = process.env.LICENSE_CRL_PATH;
  let tmpDir: string;
  let crlPath: string;
  let publicKey: string;
  let privateKey: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solution-ticket-crl-'));
    crlPath = path.join(tmpDir, 'licenca-crl.jwt');
    process.env.LICENSE_CRL_PATH = crlPath;
    const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  });

  afterEach(() => {
    if (originalPath === undefined) delete process.env.LICENSE_CRL_PATH;
    else process.env.LICENSE_CRL_PATH = originalPath;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function signCrl(revoked: string[], version = 1) {
    return jwt.sign(
      {
        version,
        revoked,
        issued_at: new Date('2026-04-29T12:00:00Z').toISOString(),
      },
      privateKey,
      { algorithm: 'RS256' },
    );
  }

  it('mantem ultima CRL valida quando recarrega arquivo invalido', () => {
    fs.writeFileSync(crlPath, signCrl(['jti-revogado'], 2), 'utf8');
    const service = new CrlService();
    service.setPublicKey(publicKey);
    expect(service.isRevogado('jti-revogado')).toBe(true);

    fs.writeFileSync(crlPath, 'conteudo-invalido', 'utf8');
    const result = service.recarregar();

    expect(result.ok).toBe(false);
    expect(result.total).toBe(1);
    expect(result.versao).toBe(2);
    expect(service.isRevogado('jti-revogado')).toBe(true);
  });

  it('mantem ultima CRL valida se arquivo some depois de carregado', () => {
    fs.writeFileSync(crlPath, signCrl(['jti-revogado'], 3), 'utf8');
    const service = new CrlService();
    service.setPublicKey(publicKey);
    fs.unlinkSync(crlPath);

    const result = service.recarregar();

    expect(result.ok).toBe(false);
    expect(result.total).toBe(1);
    expect(result.versao).toBe(3);
    expect(result.motivo).toBe('crl_ausente_ultima_valida_mantida');
    expect(service.isRevogado('jti-revogado')).toBe(true);
  });
});
