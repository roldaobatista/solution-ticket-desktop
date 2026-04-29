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
import {
  ChangePasswordDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/change-password.dto';

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
  @ApiOperation({ summary: 'Troca senha do usuario logado (revoga JWTs antigos)' })
  async changePassword(@Request() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    const userId = req.user.id ?? req.user.sub;
    if (!userId) throw new UnauthorizedException('Usuario sem identificador no token');
    return this.authService.changePassword(userId, dto.senhaAtual, dto.novaSenha);
  }

  // Onda 2.3: logout server-side incrementa tokenVersion no DB,
  // invalidando o JWT atual (e quaisquer outros emitidos para o mesmo usuario).
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoga JWTs do usuario)' })
  async logout(@Request() req: AuthRequest) {
    const userId = req.user.id ?? req.user.sub;
    if (!userId) throw new UnauthorizedException('Usuario sem identificador no token');
    return this.authService.logout(userId);
  }

  @Public()
  @Throttle({ auth: { limit: 3, ttl: 60_000 } })
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Solicita reset de senha (envia token por canal externo)' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email, dto.tenantId);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @ApiOperation({ summary: 'Reseta senha usando token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.novaSenha);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sse-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Token curto para EventSource/SSE (60s)' })
  async sseToken(@Request() req: AuthRequest) {
    const token = this.authService.generateSseToken(req.user);
    return { token, expiresIn: 60 };
  }
}
