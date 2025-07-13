import { AppEnv, AppEnvFileName } from '@constants/app.constant';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { envSchema, EnvResult } from '@config/env.config';

export class EnvUtil {
  private readonly env: AppEnv;
  private readonly envPath: string;

  constructor(private readonly processEnv: NodeJS.ProcessEnv = process.env) {
    this.env = this.resolveAppEnv();
    this.envPath = path.join(process.cwd(), AppEnvFileName[this.env]);
  }

  /**
   * Load a single `.env` file based on current env.
   * Returns `true` if a file was loaded, `false` if not found.
   */
  loadFromEnvFile(): boolean {
    if (!fs.existsSync(this.envPath)) return false;

    const result = dotenv.config({ path: this.envPath });
    if (result.error) {
      console.warn(`⚠️ Failed to load env file at ${this.envPath}: ${result.error.message}`);
      return false;
    }

    return true;
  }

  /**
   * Determine app environment from NODE_ENV.
   * Defaults to 'development' if NODE_ENV is unset.
   * Throws if NODE_ENV is set but invalid.
   */
  private resolveAppEnv(): AppEnv {
    const env = this.processEnv.NODE_ENV;

    if (!env || env === '') {
      return AppEnv.Development;
    }

    if (!Object.values(AppEnv).includes(env as AppEnv)) {
      throw new Error(`❌ Invalid NODE_ENV: "${env}". Must be one of: ${Object.values(AppEnv).join(', ')}`);
    }

    return env as AppEnv;
  }

  /**
   * Validate the current process env using the Zod schema.
   */
  validate(): EnvResult {
    const result = envSchema.safeParse(this.processEnv);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const formattedMessage = this.formatEnvValidationErrors(errors);
      console.error(formattedMessage);
      throw new Error('Invalid environment variables');
    }

    return result.data;
  }

  formatEnvValidationErrors(errors: Record<string, string[]>): string {
    const messageLines = Object.entries(errors).flatMap(([field, messages]) =>
      messages.map(msg => `- ${field}: ${msg}`),
    );

    return [
      '',
      '❌ ENV VALIDATION FAILED',
      '======================================',
      ...messageLines,
      '======================================',
      '',
    ].join('\n');
  }

  /**
   * Expose resolved AppEnv.
   */
  getAppEnv(): AppEnv {
    return this.env;
  }
}
