import { ConfigService } from '@services/config.service';
import { enrichWithNewRelic } from '@utils/newrelic-pino.util';
import { Injectable, Token } from '@utils/typedi.util';
import pino from 'pino';

export const PinoToken = new Token<pino.Logger>('PinoToken');

@Injectable()
export class PinoFactory {
  constructor(private readonly configService: ConfigService) {}

  create() {
    return pino(this.getPinoConfig());
  }

  private getPinoConfig() {
    let options: pino.LoggerOptions = {
      level: this.configService.env.LOG_LEVEL,
    };

    if (this.configService.isDevelopment) {
      options.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      };
      options.timestamp = pino.stdTimeFunctions.isoTime;
    }

    if (this.configService.isNewRelicEnabled && this.configService.isProduction) {
      options = enrichWithNewRelic(options);
    }

    return options;
  }
}
