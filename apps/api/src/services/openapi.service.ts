import { Application, Request, Response } from 'express';
import { Injectable } from '@utils/typedi.util';
import { getMetadataArgsStorage } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';

@Injectable()
export class OpenAPIService {
  setup(app: Application, routePrefix = '/api', docsPath = '/docs'): void {
    const storage = getMetadataArgsStorage();

    const spec = routingControllersToSpec(
      storage,
      { routePrefix },
      {
        info: {
          title: 'Entix API',
          version: '1.0.0',
        },
      },
    );

    app.use(docsPath, swaggerUi.serve, swaggerUi.setup(spec));

    app.get('/openapi.json', (_req: Request, res: Response): void => {
      res.json(spec);
    });
  }
}
