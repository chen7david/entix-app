import { Injectable } from '@utils/typedi.util';
import { AppService } from '@services/app.service';
import { ConfigService } from '@services/config.service';

@Injectable()
export class ServerService {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  start(): ServerService {
    const app = this.appService.init().getApp();
    const port = this.configService.env.PORT;

    app.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });

    return this;
  }
}
