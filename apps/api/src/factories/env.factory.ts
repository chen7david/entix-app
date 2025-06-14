import { EnvResult } from '@config/env.config';
import { EnvUtil } from '@utils/env.util';
import { Token } from '@utils/typedi.util';

export const EnvToken = new Token<EnvResult>('EnvToken');

export class EnvFactory {
  create(): EnvResult {
    const envUtil = new EnvUtil(process.env);
    envUtil.loadFromEnvFile();
    return envUtil.validate();
  }
}
