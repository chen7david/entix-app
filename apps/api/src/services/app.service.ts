import express, { Application } from 'express';
import { useExpressServer } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { notFoundHandler } from '@middleware/not-found.middleware';
import { ErrorHandlerMiddleware } from '@middleware/global-error.middleware';
import { authorizationChecker } from '@middleware/authz-checker.middleware';
import { currentUserChecker } from '@middleware/current-user-checker.middleware';
import { OpenAPIService } from './openapi.service';

@Injectable()
export class AppService {
  private app: Application = express();

  constructor(private readonly openAPIService: OpenAPIService) {}

  registerRoutes(): AppService {
    useExpressServer(this.app, {
      routePrefix: '/api',
      controllers: [__dirname + '/../modules/**/*.controller.ts'],
      middlewares: [ErrorHandlerMiddleware],
      defaultErrorHandler: false,
      cors: true,
      authorizationChecker,
      currentUserChecker,
    });
    return this;
  }

  init(): AppService {
    this.registerBeforeAllMiddlewares();
    this.registerRoutes();
    this.registerAfterAllMiddlewares();
    return this;
  }

  registerBeforeAllMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  registerAfterAllMiddlewares(): void {
    this.openAPIService.setup(this.app);
    this.app.use(notFoundHandler);
  }

  getApp(): Application {
    return this.app;
  }

  setApp(app: Application): void {
    this.app = app;
  }
}
