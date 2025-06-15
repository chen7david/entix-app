import { Container } from '@utils/typedi.util';
import { useContainer } from 'routing-controllers';
import { EnvFactory, EnvToken } from '@factories/env.factory';
import { PinoFactory, PinoToken } from '@factories/pino.factory';
import { CognitoFactory, CognitoToken } from '@factories/cognito.factory';

export class ContainerManager {
  static bootstrap(): void {
    ContainerManager.registerContainer();
    ContainerManager.registerCoreServices();
    ContainerManager.registerServices();
  }

  static registerContainer(): void {
    useContainer(Container);
  }

  static registerCoreServices(): void {
    Container.set(EnvToken, new EnvFactory().create());
  }

  static registerServices(): void {
    const pinoFactory = Container.get(PinoFactory);
    const cognitoFactory = Container.get(CognitoFactory);

    Container.set(PinoToken, pinoFactory.create());
    Container.set(CognitoToken, cognitoFactory.create());
  }
}
