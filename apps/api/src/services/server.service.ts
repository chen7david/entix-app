import { Injectable } from '@utils/typedi.util';
import { AppService } from '@services/app.service';
import { ConfigService } from '@services/config.service';
import { LoggerService } from './logger.service';

@Injectable()
export class ServerService {
  private readonly logger: LoggerService;
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = this.loggerService.child({
      module: 'ServerService',
    });
  }

  start(): ServerService {
    const app = this.appService.init().getApp();
    const port = this.configService.env.APP_PORT;

    app.listen(port, () => {
      this.logger.info('Server is running 🚀', {
        env: this.configService.env.NODE_ENV,
        port,
        url: `http://localhost:${port}`,
      });
    });

    return this;
  }
}
