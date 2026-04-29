import { Body, Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MailerService } from './mailer.service';
import { CreateSmtpConfigDto } from './dto/create-smtp-config.dto';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';

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
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Criar ou atualizar configuracao SMTP' })
  upsertConfig(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateSmtpConfigDto) {
    return this.mailerService.createOrUpdate(tenantId, dto);
  }

  @Post('config/patch')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar parcialmente configuracao SMTP' })
  patchConfig(@CurrentUser('tenantId') tenantId: string, @Body() dto: UpdateSmtpConfigDto) {
    return this.mailerService.createOrUpdate(tenantId, dto);
  }

  @Delete('config')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover configuracao SMTP' })
  removeConfig(@CurrentUser('tenantId') tenantId: string) {
    return this.mailerService.remove(tenantId);
  }

  @Post('test')
  @Roles(Permissao.CONFIG_GERENCIAR)
  @HttpCode(200)
  @ApiOperation({ summary: 'Testar conexao SMTP' })
  testConnection(@CurrentUser('tenantId') tenantId: string) {
    return this.mailerService.testConnection(tenantId);
  }
}
