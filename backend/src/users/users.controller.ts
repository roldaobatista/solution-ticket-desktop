import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Onda 1.4: gerencia de usuarios exige permissao explicita.
  // Antes qualquer usuario logado podia criar admins, deletar contas
  // e alterar senhas alheias.
  @Post()
  @Roles('usuarios:gerenciar')
  @ApiOperation({ summary: 'Criar usuário (admin)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles('usuarios:gerenciar')
  @ApiOperation({ summary: 'Listar usuários com paginação e filtros (admin)' })
  findAll(@Query() filter: UserFilterDto) {
    return this.usersService.findAll(filter);
  }

  @Get(':id')
  @Roles('usuarios:gerenciar')
  @ApiOperation({ summary: 'Buscar usuário por ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('usuarios:gerenciar')
  @ApiOperation({ summary: 'Atualizar usuário (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('usuarios:gerenciar')
  @ApiOperation({ summary: 'Remover usuário (admin)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
