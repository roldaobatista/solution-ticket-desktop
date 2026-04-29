import { PartialType } from '@nestjs/swagger';
import { CreateIntegracaoProfileDto } from './create-integracao-profile.dto';

export class UpdateIntegracaoProfileDto extends PartialType(CreateIntegracaoProfileDto) {}
