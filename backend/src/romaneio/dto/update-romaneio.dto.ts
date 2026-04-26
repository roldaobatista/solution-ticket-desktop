import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRomaneioDto } from './create-romaneio.dto';

// ticketIds nao e atualizavel via PATCH (use endpoint dedicado).
export class UpdateRomaneioDto extends PartialType(
  OmitType(CreateRomaneioDto, ['ticketIds'] as const),
) {}
