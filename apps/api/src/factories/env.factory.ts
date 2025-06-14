import { EnvSchema } from '@config/env.config';
import { EnvUtil } from '@utils/env.util';
import { Token } from '@utils/typedi.util';

export const EnvToken = new Token<EnvSchema>('EnvToken');

export class EnvFactory {
  create(): EnvSchema {
    const envUtil = new EnvUtil(process.env);
    envUtil.loadFromEnvFile();
    return envUtil.validate();
  }
}
