import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRomaneioDto } from './create-romaneio.dto';

// tenantId e ticketIds nao sao atualizaveis via PATCH (use endpoint dedicado).
export class UpdateRomaneioDto extends PartialType(
  OmitType(CreateRomaneioDto, ['tenantId', 'ticketIds'] as const),
) {}
