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

@ApiTags('Documentos do Ticket')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Get(':ticketId/documentos')
  @ApiOperation({ summary: 'Listar documentos de um ticket' })
  listar(@Param('ticketId') ticketId: string) {
    return this.service.listar(ticketId);
  }

  @Post(':ticketId/documentos')
  @ApiOperation({ summary: 'Upload de documento fiscal do ticket' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo'))
  upload(
    @Param('ticketId') ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('tipo') tipo?: string,
    @Body('numero') numero?: string,
    @Body('observacao') observacao?: string,
  ) {
    return this.service.upload(ticketId, file, tipo, numero, observacao);
  }

  @Delete('documentos/:id')
  @ApiOperation({ summary: 'Remover documento' })
  remover(@Param('id') id: string) {
    return this.service.remover(id);
  }

  @Get('documentos/:id/download')
  @ApiOperation({ summary: 'Baixar documento' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const info = await this.service.download(id);
    res.setHeader('Content-Type', info.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${info.nome}"`);
    fs.createReadStream(info.path).pipe(res);
  }
}
