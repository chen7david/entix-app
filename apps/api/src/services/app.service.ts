import express, { Application } from 'express';
import { Action, useExpressServer } from 'routing-controllers';
import { Container, Injectable } from '@utils/typedi.util';
import { notFoundHandler } from '@middleware/not-found.middleware';
import { ErrorHandlerMiddleware } from '@middleware/global-error.middleware';
import { JwtService } from './jwt.service';

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
      authorizationChecker: async (action: Action) => {
        const jwtService = Container.get(JwtService);
        const token = action.request.headers['authorization']?.split(' ')[1];
        if (!token) return false;

        try {
          const payload = await jwtService.verifyAccessToken(token);
          console.log(payload);
          return !!payload;
        } catch {
          return false;
        }
      },
      currentUserChecker: async (action: Action) => {
        const jwtService = Container.get(JwtService);

        const authHeader = action.request.headers['authorization'];
        const token = authHeader?.split(' ')[1];
        if (!token) return null;
        console.log(token);
        try {
          const payload = await jwtService.verifyAccessToken(token);
          return payload;
        } catch (err) {
          console.log(err);
          return null;
        }
      },
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
