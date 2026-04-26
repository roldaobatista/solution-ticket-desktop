import { Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissao } from '../constants/permissoes';
import { CameraService } from './camera.service';

@ApiTags('Camera')
@ApiBearerAuth()
@Controller('camera')
@UseGuards(JwtAuthGuard)
export class CameraController {
  constructor(private readonly service: CameraService) {}

  @Post('foto')
  @Roles(Permissao.TICKET_CRIAR, Permissao.TICKET_EDITAR)
  @ApiOperation({ summary: 'Anexa foto a um ticket/passagem' })
  salvar(
    @Body()
    body: {
      ticketId: string;
      passagemId?: string;
      base64: string;
      origem?: 'WEBCAM' | 'IP_CAMERA' | 'OCR';
      placaDetectada?: string;
    },
  ) {
    return this.service.salvar(body);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Lista fotos de um ticket' })
  listar(@Param('ticketId') ticketId: string) {
    return this.service.listarPorTicket(ticketId);
  }

  @Get('foto/:id/raw')
  @ApiOperation({ summary: 'Retorna o arquivo binário da foto' })
  async raw(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mime, filename } = await this.service.obterArquivo(id);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  }

  @Delete('foto/:id')
  @Roles(Permissao.TICKET_CRIAR, Permissao.TICKET_EDITAR)
  @ApiOperation({ summary: 'Remove foto (arquivo + registro)' })
  excluir(@Param('id') id: string) {
    return this.service.excluir(id);
  }
}
