import { EnvResult } from '@config/env.config';
import { EnvToken } from '@factories/env.factory';
import { Inject, Injectable } from '@utils/typedi.util';

@Injectable()
export class ConfigService {
  constructor(@Inject(EnvToken) private readonly env: EnvResult) {}
}
