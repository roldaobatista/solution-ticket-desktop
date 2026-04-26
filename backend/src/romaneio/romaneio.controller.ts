import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RomaneioService } from './romaneio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CreateRomaneioDto } from './dto/create-romaneio.dto';
import { UpdateRomaneioDto } from './dto/update-romaneio.dto';
import { VincularTicketsDto } from './dto/vincular-tickets.dto';

@ApiTags('Romaneios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('romaneios')
export class RomaneioController {
  constructor(private readonly romaneioService: RomaneioService) {}

  @Post()
  @Roles(Permissao.ROMANEIO_GERENCIAR)
  @ApiOperation({ summary: 'Criar romaneio' })
  create(@Body() dto: CreateRomaneioDto, @CurrentUser('tenantId') tenantId: string) {
    return this.romaneioService.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar romaneios (paginado)' })
  findAll(
    @Query('tenantId') tenantId: string,
    @Query('clienteId') clienteId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.romaneioService.findAll(tenantId, clienteId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar romaneio por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.romaneioService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.ROMANEIO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar romaneio' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRomaneioDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.romaneioService.update(id, tenantId, dto);
  }

  @Post(':id/vincular-tickets')
  @Roles(Permissao.ROMANEIO_GERENCIAR)
  @ApiOperation({ summary: 'Vincular tickets ao romaneio' })
  vincularTickets(@Param('id') id: string, @Body() dto: VincularTicketsDto) {
    return this.romaneioService.vincularTickets(id, dto.ticketIds);
  }
}
