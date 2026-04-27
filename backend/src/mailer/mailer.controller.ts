import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MailerService } from './mailer.service';
import { CreateSmtpConfigDto } from './dto/create-smtp-config.dto';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('SMTP / E-mail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obter configuracao SMTP do tenant (sem senha)' })
  getConfig(@CurrentUser('tenantId') tenantId: string) {
    return this.mailerService.getConfig(tenantId);
  }

  @Post('config')
  @ApiOperation({ summary: 'Criar ou atualizar configuracao SMTP' })
  upsertConfig(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateSmtpConfigDto) {
    return this.mailerService.createOrUpdate(tenantId, dto);
  }

  @Post('config/patch')
  @ApiOperation({ summary: 'Atualizar parcialmente configuracao SMTP' })
  patchConfig(@CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateSmtpConfigDto) {
    return this.mailerService.createOrUpdate(tenantId, dto);
  }

  @Delete('config')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover configuracao SMTP' })
  removeConfig(@CurrentUser('tenantId') tenantId: string) {
    return this.mailerService.remove(tenantId);
  }

  @Post('test')
  @HttpCode(200)
  @ApiOperation({ summary: 'Testar conexao SMTP' })
  testConnection(@CurrentUser('tenantId') tenantId: string) {
    return this.mailerService.testConnection(tenantId);
  }
}
