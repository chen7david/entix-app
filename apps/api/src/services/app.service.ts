import express, { Application } from 'express';
import { useExpressServer } from 'routing-controllers';
import { Injectable } from '@utils/typedi.util';
import { notFoundHandler } from '@middleware/not-found.middleware';
import { ErrorHandlerMiddleware } from '@middleware/global-error.middleware';

@Injectable()
export class AppService {
  private app: Application = express();

  constructor() {}

  registerRoutes(): AppService {
    useExpressServer(this.app, {
      routePrefix: '/api',
      controllers: [__dirname + '/../modules/**/*.controller.ts'],
      middlewares: [ErrorHandlerMiddleware],
      defaultErrorHandler: false,
      cors: true,
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
    this.app.use(notFoundHandler);
  }

  getApp(): Application {
    return this.app;
  }

  setApp(app: Application): void {
    this.app = app;
  }
}
