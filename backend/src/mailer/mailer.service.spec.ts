import { Test } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import { protectSecret } from '../common/secret-protection.util';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue({ messageId: '<msg123>' }),
  }),
}));

type SmtpMutationArgs = { data: Record<string, unknown> };
type MailerPrismaMock = {
  configuracaoSmtp: {
    findUnique: jest.Mock;
    create: jest.Mock<Promise<Record<string, unknown>>, [SmtpMutationArgs]>;
    update: jest.Mock<Promise<Record<string, unknown>>, [SmtpMutationArgs]>;
    delete: jest.Mock;
  };
};

describe('MailerService', () => {
  let service: MailerService;
  let prisma: MailerPrismaMock;
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'm'.repeat(48);
    prisma = {
      configuracaoSmtp: {
        findUnique: jest.fn(),
        create: jest
          .fn()
          .mockImplementation((args: SmtpMutationArgs) =>
            Promise.resolve({ id: '1', ...args.data }),
          ),
        update: jest
          .fn()
          .mockImplementation((args: SmtpMutationArgs) =>
            Promise.resolve({ id: '1', ...args.data }),
          ),
        delete: jest.fn().mockResolvedValue({}),
      },
    };

    const module = await Test.createTestingModule({
      providers: [MailerService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(MailerService);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  describe('getConfig', () => {
    it('retorna config sem expor senha', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue({
        id: 'c1',
        tenantId: 't1',
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        user: 'user',
        senha: 'encrypted',
        from: 'from@test.com',
        fromName: 'Test',
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      });
      const r = await service.getConfig('t1');
      expect(r).toBeDefined();
      expect(Object.prototype.hasOwnProperty.call(r, 'senha')).toBe(false);
      expect(r!.host).toBe('smtp.test.com');
    });

    it('retorna null quando nao existe config', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue(null);
      const r = await service.getConfig('t1');
      expect(r).toBeNull();
    });
  });

  describe('createOrUpdate', () => {
    it('criptografa a senha ao criar e nao retorna segredo persistido', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue(null);
      const result = await service.createOrUpdate('t1', {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        user: 'u',
        senha: 'plain',
        from: 'a@b.com',
      });
      const createCall = prisma.configuracaoSmtp.create.mock.calls[0][0];
      expect(createCall.data.senha).not.toBe('plain');
      expect(typeof createCall.data.senha).toBe('string');
      expect(Object.prototype.hasOwnProperty.call(result, 'senha')).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('retorna ok=false quando nao ha config', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue(null);
      const r = await service.testConnection('t1');
      expect(r.ok).toBe(false);
    });

    it('retorna ok=false quando config inativa', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue({
        tenantId: 't1',
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        user: 'u',
        senha: protectSecret('p'),
        from: 'a@b.com',
        ativo: false,
      });
      const r = await service.testConnection('t1');
      expect(r.ok).toBe(false);
    });

    it('retorna ok=true quando conexao verifica', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue({
        tenantId: 't1',
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        user: 'u',
        senha: protectSecret('p'),
        from: 'a@b.com',
        ativo: true,
      });
      const r = await service.testConnection('t1');
      expect(r.ok).toBe(true);
    });
  });

  describe('sendMail', () => {
    it('retorna ok=false quando nao ha config', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue(null);
      const r = await service.sendMail('t1', { to: 'a@b.com', subject: 'Test' });
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/SMTP nao configurado/);
    });

    it('envia e-mail e retorna messageId quando config ativa', async () => {
      prisma.configuracaoSmtp.findUnique.mockResolvedValue({
        tenantId: 't1',
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        user: 'u',
        senha: protectSecret('p'),
        from: 'a@b.com',
        fromName: 'App',
        ativo: true,
      });
      const r = await service.sendMail('t1', { to: 'dest@b.com', subject: 'S', text: 'T' });
      expect(r.ok).toBe(true);
      expect(r.messageId).toBe('<msg123>');
    });
  });
});
