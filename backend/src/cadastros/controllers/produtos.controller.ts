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
import { ProdutosService } from '../services/produtos.service';
import { CreateProdutoDto } from '../dto/create-produto.dto';
import { UpdateProdutoDto } from '../dto/update-produto.dto';
import { BaseFilterDto } from '../dto/base-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissao } from '../../constants/permissoes';

@ApiTags('Produtos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  @Post()
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Criar produto' })
  create(@Body() dto: CreateProdutoDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  findAll(@Query() filter: BaseFilterDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(filter, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Atualizar produto' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles(Permissao.CADASTRO_GERENCIAR)
  @ApiOperation({ summary: 'Remover produto' })
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
