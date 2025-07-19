import type { EnvResult } from '@config/env.config';
import { EnvToken } from '@factories/env.factory';
import { AppEnv } from '@constants/app.constant';
import { Inject, Injectable } from '@utils/typedi.util';

@Injectable()
export class ConfigService {
  constructor(@Inject(EnvToken) private readonly _env: EnvResult) {}

  get env(): EnvResult {
    return this._env;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === AppEnv.Production;
  }

  get isStaging(): boolean {
    return this.env.NODE_ENV === AppEnv.Staging;
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === AppEnv.Development;
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === AppEnv.Test;
  }

  get isNewRelicEnabled(): boolean {
    return this.env.NEW_RELIC_ENABLED;
  }
}
