import { Container } from '@utils/typedi.util';
import { useContainer } from 'routing-controllers';
import { EnvFactory, EnvToken } from '@factories/env.factory';

export class DependencyManager {
  bootstrap(): void {
    this.registerContainer();
    this.registerServices();
  }

  registerContainer(): void {
    useContainer(Container);
  }

  registerServices(): void {
    Container.set(EnvToken, new EnvFactory().create());
  }
}
