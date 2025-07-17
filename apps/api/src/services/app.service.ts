import express, { Application, Request, Response } from 'express';
import { useExpressServer } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { notFoundHandler } from '@middleware/not-found.middleware';
import { ErrorHandlerMiddleware } from '@middleware/global-error.middleware';
import { authorizationChecker } from '@middleware/authz-checker.middleware';
import { currentUserChecker } from '@middleware/current-user-checker.middleware';
import { OpenAPIService } from './openapi.service';
import morgan from 'morgan';
@Injectable()
export class AppService {
  private app: Application = express();

  constructor(private readonly openAPIService: OpenAPIService) {}

  registerRoutes(): AppService {
    useExpressServer(this.app, {
      routePrefix: '/api',
      controllers: [__dirname + '/../modules/**/*.controller.{js,ts}'],
      middlewares: [ErrorHandlerMiddleware],
      defaultErrorHandler: false,
      cors: true,
      authorizationChecker,
      currentUserChecker,
    });
    return this;
  }

  init(): AppService {
    this.registerHealthCheck();
    this.registerBeforeAllMiddlewares();
    this.registerRoutes();
    this.registerAfterAllMiddlewares();
    return this;
  }

  registerBeforeAllMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(morgan('dev'));
  }

  registerAfterAllMiddlewares(): void {
    this.openAPIService.setup(this.app);
    this.app.use(notFoundHandler);
  }

  registerHealthCheck(): void {
    this.app.get('/health', (_req: Request, res: Response): void => {
      res.status(200).json({ status: 'ok' });
    });
  }

  getApp(): Application {
    return this.app;
  }

  setApp(app: Application): void {
    this.app = app;
  }
}
