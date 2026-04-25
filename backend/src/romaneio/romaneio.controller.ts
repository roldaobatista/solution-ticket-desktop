import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RomaneioService } from './romaneio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @ApiOperation({ summary: 'Criar romaneio' })
  create(@Body() dto: CreateRomaneioDto) {
    return this.romaneioService.create(dto);
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
  findOne(@Param('id') id: string) {
    return this.romaneioService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar romaneio' })
  update(@Param('id') id: string, @Body() dto: UpdateRomaneioDto) {
    return this.romaneioService.update(id, dto);
  }

  @Post(':id/vincular-tickets')
  @ApiOperation({ summary: 'Vincular tickets ao romaneio' })
  vincularTickets(@Param('id') id: string, @Body() dto: VincularTicketsDto) {
    return this.romaneioService.vincularTickets(id, dto.ticketIds);
  }
}
