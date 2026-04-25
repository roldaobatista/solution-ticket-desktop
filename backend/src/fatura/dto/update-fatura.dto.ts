import { PartialType } from '@nestjs/swagger';
import { CreateFaturaDto } from './create-fatura.dto';

export class UpdateFaturaDto extends PartialType(CreateFaturaDto) {}
