import { Container } from '@utils/typedi.util';
import { useContainer } from 'routing-controllers';
import { EnvFactory, EnvToken } from '@factories/env.factory';

export class ContainerManager {
  static bootstrap(): void {
    ContainerManager.registerContainer();
    ContainerManager.registerServices();
  }

  static registerContainer(): void {
    useContainer(Container);
  }

  static registerServices(): void {
    Container.set(EnvToken, new EnvFactory().create());
  }
}
