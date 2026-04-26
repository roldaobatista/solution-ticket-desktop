import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as fs from 'fs';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadDocumentoMetaDto } from './dto/upload-documento.dto';

@ApiTags('Documentos do Ticket')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  // Onda 2.5: tenantId vem do JWT — service compara com ticket.tenantId
  // antes de listar/upload/remover/download (defesa contra IDOR cross-tenant).
  @Get(':ticketId/documentos')
  @ApiOperation({ summary: 'Listar documentos de um ticket' })
  listar(
    @Param('ticketId') ticketId: string,
    @CurrentUser('tenantId') tenantId: string | undefined,
  ) {
    return this.service.listar(ticketId, tenantId);
  }

  @Post(':ticketId/documentos')
  @ApiOperation({ summary: 'Upload de documento fiscal do ticket' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo'))
  upload(
    @Param('ticketId') ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() meta: UploadDocumentoMetaDto,
    @CurrentUser('tenantId') tenantId: string | undefined,
  ) {
    return this.service.upload(ticketId, file, meta.tipo, meta.numero, meta.observacao, tenantId);
  }

  @Delete('documentos/:id')
  @ApiOperation({ summary: 'Remover documento' })
  remover(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string | undefined) {
    return this.service.remover(id, tenantId);
  }

  @Get('documentos/:id/download')
  @ApiOperation({ summary: 'Baixar documento' })
  async download(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser('tenantId') tenantId: string | undefined,
  ) {
    const info = await this.service.download(id, tenantId);
    res.setHeader('Content-Type', info.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${info.nome}"`);
    fs.createReadStream(info.path).pipe(res);
  }
}
