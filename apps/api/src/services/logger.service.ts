import { Inject, Injectable } from '@utils/typedi.util';
import { PinoToken } from '@factories/pino.factory';
import pino from 'pino';

@Injectable()
export class LoggerService {
  constructor(@Inject(PinoToken) private readonly logger: pino.Logger) {}

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta, message);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(meta, message);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(meta, message);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(meta, message);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.logger.fatal(meta, message);
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.logger.trace(meta, message);
  }

  child(meta: Record<string, unknown>): LoggerService {
    return new LoggerService(this.logger.child(meta));
  }
}
