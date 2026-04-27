import { Test } from '@nestjs/testing';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';

describe('MailerController', () => {
  let controller: MailerController;
  let service: MailerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MailerController],
      providers: [
        {
          provide: MailerService,
          useValue: {
            getConfig: jest.fn().mockResolvedValue({ host: 'smtp.test.com' }),
            createOrUpdate: jest.fn().mockResolvedValue({ id: '1' }),
            remove: jest.fn().mockResolvedValue({}),
            testConnection: jest.fn().mockResolvedValue({ ok: true, message: 'OK' }),
          },
        },
      ],
    }).compile();

    controller = module.get(MailerController);
    service = module.get(MailerService);
  });

  it('obtem config do tenant', async () => {
    const r = await controller.getConfig('t1');
    expect(r).toEqual({ host: 'smtp.test.com' });
    expect(service.getConfig).toHaveBeenCalledWith('t1');
  });

  it('cria ou atualiza config', async () => {
    const dto = {
      host: 'smtp.x.com',
      port: 587,
      secure: false,
      user: 'u',
      senha: 'p',
      from: 'a@b.com',
    };
    const r = await controller.upsertConfig('t1', dto as any);
    expect(service.createOrUpdate).toHaveBeenCalledWith('t1', dto);
  });

  it('testa conexao', async () => {
    const r = await controller.testConnection('t1');
    expect(r.ok).toBe(true);
  });
});
