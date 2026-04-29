import { Injectable } from '@nestjs/common';
import { scrubPii } from '../../common/pii.util';

@Injectable()
export class PayloadMaskerService {
  mask(payload: unknown): unknown {
    return scrubPii(payload);
  }

  stringifyMasked(payload: unknown): string | undefined {
    if (payload === undefined) return undefined;
    return JSON.stringify(this.mask(payload));
  }
}
