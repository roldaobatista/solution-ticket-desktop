import { PartialType } from '@nestjs/swagger';
import { CreateSmtpConfigDto } from './create-smtp-config.dto';

export class UpdateSmtpConfigDto extends PartialType(CreateSmtpConfigDto) {}
