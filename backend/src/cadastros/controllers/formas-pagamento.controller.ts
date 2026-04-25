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
import { FormasPagamentoService } from '../services/formas-pagamento.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';
import { UpdateFormaPagamentoDto } from '../dto/update-forma-pagamento.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Formas de Pagamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formas-pagamento')
export class FormasPagamentoController {
  constructor(private readonly service: FormasPagamentoService) {}

  @Post()
  @ApiOperation({ summary: 'Criar forma de pagamento' })
  create(@Body() dto: CreateFormaPagamentoDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar formas de pagamento' })
  findAll(@Query() filter: BaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar forma de pagamento por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar forma de pagamento' })
  update(@Param('id') id: string, @Body() dto: UpdateFormaPagamentoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover forma de pagamento' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
