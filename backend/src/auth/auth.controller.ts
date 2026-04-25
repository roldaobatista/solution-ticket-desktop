import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

interface AuthUser {
  id: string;
  sub?: string;
  email: string;
  nome?: string;
  tenantId?: string | null;
  perfis?: Array<{ perfil: { nome: string } }>;
  perfil?: string;
}
type AuthRequest = ExpressRequest & { user: AuthUser };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req: AuthRequest) {
    return this.authService.login(req.user);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('login-direct')
  @ApiOperation({ summary: 'Login direto (sem LocalAuthGuard)' })
  async loginDirect(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.senha);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário logado a partir do JWT' })
  async me(@Request() req: AuthRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Troca senha do usuario logado' })
  async changePassword(
    @Request() req: AuthRequest,
    @Body() body: { senhaAtual: string; novaSenha: string },
  ) {
    const userId = req.user.id ?? req.user.sub;
    if (!userId) throw new UnauthorizedException('Usuario sem identificador no token');
    return this.authService.changePassword(userId, body.senhaAtual, body.novaSenha);
  }

  @Public()
  @Throttle({ auth: { limit: 3, ttl: 60_000 } })
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Solicita reset de senha (envia token por canal externo)' })
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reseta senha usando token' })
  async resetPassword(@Body() body: { token: string; novaSenha: string }) {
    return this.authService.resetPassword(body.token, body.novaSenha);
  }
}
